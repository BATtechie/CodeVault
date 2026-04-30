import prisma from '../db/prisma.js';
import { createNotifications } from '../utils/notifications.js';
import { parsePagination, sendError, sendSuccess } from '../utils/http.js';
import {
  buildSnippetSearchWhere,
  normalizeLanguage,
  normalizeTags,
  resolveVisibility,
  scoreSnippet,
} from '../utils/snippets.js';

const snippetListInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  team: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  collaborators: {
    select: {
      role: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  _count: {
    select: {
      comments: true,
      collaborators: true,
    },
  },
};

const snippetAccessInclude = {
  ...snippetListInclude,
  team: {
    include: {
      members: {
        select: {
          userId: true,
          role: true,
        },
      },
    },
  },
};

const snippetDetailInclude = {
  ...snippetAccessInclude,
  comments: {
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
};

const TEAM_MANAGER_ROLES = new Set(['OWNER', 'ADMIN']);
const SNIPPET_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'title', 'language']);

const getCollaborator = (snippet, userId) =>
  snippet.collaborators?.find((collaborator) => collaborator.user.id === userId);

const getTeamMembership = (snippet, userId) =>
  snippet.team?.members?.find((member) => member.userId === userId);

const canViewSnippet = (snippet, user) => {
  if (!snippet) {
    return false;
  }

  if (snippet.visibility === 'PUBLIC' || snippet.isPublic) {
    return true;
  }

  if (!user) {
    return false;
  }

  if (user.role === 'ADMIN' || snippet.userId === user.id) {
    return true;
  }

  if (getCollaborator(snippet, user.id)) {
    return true;
  }

  return Boolean(getTeamMembership(snippet, user.id));
};

const canEditSnippet = (snippet, user) => {
  if (!snippet || !user) {
    return false;
  }

  if (user.role === 'ADMIN' || snippet.userId === user.id) {
    return true;
  }

  const collaborator = getCollaborator(snippet, user.id);

  if (collaborator?.role === 'EDITOR') {
    return true;
  }

  const teamMembership = getTeamMembership(snippet, user.id);
  return TEAM_MANAGER_ROLES.has(teamMembership?.role);
};

const canDeleteSnippet = (snippet, user) => {
  if (!snippet || !user) {
    return false;
  }

  if (user.role === 'ADMIN' || snippet.userId === user.id) {
    return true;
  }

  const teamMembership = getTeamMembership(snippet, user.id);
  return TEAM_MANAGER_ROLES.has(teamMembership?.role);
};

const buildWorkspaceWhere = (user, query, options = {}) => {
  const scope = String(query.scope || 'workspace').trim().toLowerCase();
  const accessConditions =
    options.publicOnly || user.role === 'ADMIN'
      ? null
      : {
          workspace: {
            OR: [
              { userId: user.id },
              { collaborators: { some: { userId: user.id } } },
              { team: { members: { some: { userId: user.id } } } },
            ],
          },
          mine: { userId: user.id },
          shared: {
            AND: [
              {
                OR: [
                  { collaborators: { some: { userId: user.id } } },
                  { team: { members: { some: { userId: user.id } } } },
                ],
              },
              { NOT: { userId: user.id } },
            ],
          },
          team: { team: { members: { some: { userId: user.id } } } },
        }[scope] || {
          OR: [
            { userId: user.id },
            { collaborators: { some: { userId: user.id } } },
            { team: { members: { some: { userId: user.id } } } },
          ],
        };

  const and = [];

  if (accessConditions) {
    and.push(accessConditions);
  }

  const language = query.language ? normalizeLanguage(query.language) : null;
  const visibility = query.visibility
    ? String(query.visibility).trim().toUpperCase()
    : null;
  const tag = String(query.tag || '').trim().toLowerCase();
  const teamId = String(query.teamId || '').trim();
  const searchWhere = buildSnippetSearchWhere(query.q);

  if (language) {
    and.push({ language });
  }

  if (visibility) {
    and.push({ visibility });
  }

  if (tag) {
    and.push({ tags: { has: tag } });
  }

  if (teamId) {
    and.push({ teamId });
  }

  if (options.publicOnly) {
    and.push({ visibility: 'PUBLIC' });
  }

  if (searchWhere) {
    and.push(searchWhere);
  }

  return and.length > 0 ? { AND: and } : {};
};

const buildOrderBy = (query) => {
  const sortBy = SNIPPET_SORT_FIELDS.has(query.sortBy) ? query.sortBy : 'updatedAt';
  const sortOrder = String(query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

  return { [sortBy]: sortOrder };
};

const getSnippetWriteInput = async (payload, user) => {
  const title = String(payload.title || '').trim();
  const code = String(payload.code || '').replace(/\r\n/g, '\n');
  const description = String(payload.description || '').trim() || null;
  const language = normalizeLanguage(payload.language);
  const tags = normalizeTags(payload.tags);
  const teamId = String(payload.teamId || '').trim() || null;
  const visibility = resolveVisibility({
    visibility: payload.visibility,
    isPublic: payload.isPublic,
    teamId,
  });

  if (!title || !code || !language) {
    return {
      error: 'Title, language, and code are required.',
    };
  }

  if (visibility === 'TEAM') {
    if (!teamId) {
      return {
        error: 'Select a team before sharing a snippet with a team.',
      };
    }

    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!membership && user.role !== 'ADMIN') {
      return {
        error: 'You can only share snippets with teams you belong to.',
      };
    }
  }

  return {
    data: {
      title,
      description,
      code,
      language,
      tags,
      visibility,
      isPublic: visibility === 'PUBLIC',
      teamId: visibility === 'TEAM' ? teamId : null,
    },
  };
};

const notifySnippetStakeholders = async ({ snippet, actor, message }) => {
  const stakeholderIds = [
    snippet.userId,
    ...(snippet.collaborators || []).map((collaborator) => collaborator.user.id),
    ...(snippet.team?.members || [])
      .filter((member) => TEAM_MANAGER_ROLES.has(member.role))
      .map((member) => member.userId),
  ].filter((userId) => userId !== actor.id);

  await createNotifications(prisma, {
    userIds: stakeholderIds,
    type: 'SNIPPET_UPDATED',
    title: 'Snippet updated',
    message,
    payload: {
      snippetId: snippet.id,
      snippetTitle: snippet.title,
    },
  });
};

const snippetController = {
  async getAllSnippets(req, res) {
    try {
      const { page, limit, skip } = parsePagination(req.query, {
        limit: 12,
        maxLimit: 30,
      });
      const where = buildWorkspaceWhere(req.user, req.query);
      const orderBy = buildOrderBy(req.query);
      const queryText = String(req.query.q || '').trim();
      const candidateTake = queryText
        ? Math.min(250, Math.max(limit * Math.max(page, 1) * 5, 50))
        : limit;

      const [total, rawSnippets] = await prisma.$transaction([
        prisma.snippet.count({ where }),
        prisma.snippet.findMany({
          where,
          include: snippetListInclude,
          orderBy: queryText ? { updatedAt: 'desc' } : orderBy,
          skip: queryText ? 0 : skip,
          take: candidateTake,
        }),
      ]);

      const snippets = queryText
        ? rawSnippets
            .map((snippet) => ({
              snippet,
              score: scoreSnippet(snippet, queryText),
            }))
            .sort((left, right) => {
              if (right.score !== left.score) {
                return right.score - left.score;
              }

              return (
                new Date(right.snippet.updatedAt).getTime() -
                new Date(left.snippet.updatedAt).getTime()
              );
            })
            .slice(skip, skip + limit)
            .map(({ snippet }) => snippet)
        : rawSnippets;

      return sendSuccess(res, {
        data: snippets,
        meta: {
          page,
          limit,
          total,
        },
      });
    } catch (error) {
      console.error('Get snippets error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to load snippets right now.',
      });
    }
  },

  async getSnippetById(req, res) {
    try {
      const snippet = await prisma.snippet.findUnique({
        where: { id: req.params.id },
        include: snippetDetailInclude,
      });

      if (!snippet || !canViewSnippet(snippet, req.user)) {
        return sendError(res, {
          status: 404,
          message: 'Snippet not found.',
        });
      }

      return sendSuccess(res, {
        data: snippet,
      });
    } catch (error) {
      console.error('Get snippet error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to load that snippet right now.',
      });
    }
  },

  async createSnippet(req, res) {
    try {
      const preparedInput = await getSnippetWriteInput(req.body, req.user);

      if (preparedInput.error) {
        return sendError(res, {
          status: 400,
          message: preparedInput.error,
        });
      }

      const snippet = await prisma.snippet.create({
        data: {
          ...preparedInput.data,
          userId: req.user.id,
        },
        include: snippetListInclude,
      });

      return sendSuccess(res, {
        status: 201,
        message: 'Snippet created successfully.',
        data: snippet,
      });
    } catch (error) {
      console.error('Create snippet error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to create the snippet right now.',
      });
    }
  },

  async updateSnippet(req, res) {
    try {
      const existingSnippet = await prisma.snippet.findUnique({
        where: { id: req.params.id },
        include: snippetAccessInclude,
      });

      if (!existingSnippet || !canEditSnippet(existingSnippet, req.user)) {
        return sendError(res, {
          status: 404,
          message: 'Snippet not found or you do not have permission to edit it.',
        });
      }

      const preparedInput = await getSnippetWriteInput(
        {
          ...existingSnippet,
          ...req.body,
        },
        req.user,
      );

      if (preparedInput.error) {
        return sendError(res, {
          status: 400,
          message: preparedInput.error,
        });
      }

      const updatedSnippet = await prisma.snippet.update({
        where: { id: req.params.id },
        data: preparedInput.data,
        include: snippetAccessInclude,
      });

      await notifySnippetStakeholders({
        snippet: updatedSnippet,
        actor: req.user,
        message: `${req.user.name || req.user.email} updated "${updatedSnippet.title}".`,
      });

      return sendSuccess(res, {
        message: 'Snippet updated successfully.',
        data: updatedSnippet,
      });
    } catch (error) {
      console.error('Update snippet error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to update the snippet right now.',
      });
    }
  },

  async deleteSnippet(req, res) {
    try {
      const existingSnippet = await prisma.snippet.findUnique({
        where: { id: req.params.id },
        include: snippetAccessInclude,
      });

      if (!existingSnippet || !canDeleteSnippet(existingSnippet, req.user)) {
        return sendError(res, {
          status: 404,
          message: 'Snippet not found or you do not have permission to delete it.',
        });
      }

      await prisma.snippet.delete({
        where: { id: req.params.id },
      });

      return sendSuccess(res, {
        message: 'Snippet deleted successfully.',
      });
    } catch (error) {
      console.error('Delete snippet error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to delete the snippet right now.',
      });
    }
  },

  async getPublicSnippets(req, res) {
    try {
      const { page, limit, skip } = parsePagination(req.query, {
        limit: 12,
        maxLimit: 30,
      });
      const where = buildWorkspaceWhere(req.user || { role: 'MEMBER', id: '' }, req.query, {
        publicOnly: true,
      });
      const orderBy = buildOrderBy(req.query);
      const queryText = String(req.query.q || '').trim();
      const candidateTake = queryText
        ? Math.min(250, Math.max(limit * Math.max(page, 1) * 5, 50))
        : limit;

      const [total, rawSnippets] = await prisma.$transaction([
        prisma.snippet.count({ where }),
        prisma.snippet.findMany({
          where,
          include: snippetListInclude,
          orderBy: queryText ? { updatedAt: 'desc' } : orderBy,
          skip: queryText ? 0 : skip,
          take: candidateTake,
        }),
      ]);

      const snippets = queryText
        ? rawSnippets
            .map((snippet) => ({
              snippet,
              score: scoreSnippet(snippet, queryText),
            }))
            .sort((left, right) => right.score - left.score)
            .slice(skip, skip + limit)
            .map(({ snippet }) => snippet)
        : rawSnippets;

      return sendSuccess(res, {
        data: snippets,
        meta: {
          page,
          limit,
          total,
        },
      });
    } catch (error) {
      console.error('Get public snippets error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to load public snippets right now.',
      });
    }
  },

  async getSnippetComments(req, res) {
    try {
      const snippet = await prisma.snippet.findUnique({
        where: { id: req.params.id },
        include: snippetAccessInclude,
      });

      if (!snippet || !canViewSnippet(snippet, req.user)) {
        return sendError(res, {
          status: 404,
          message: 'Snippet not found.',
        });
      }

      const comments = await prisma.comment.findMany({
        where: {
          snippetId: req.params.id,
        },
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return sendSuccess(res, {
        data: comments,
      });
    } catch (error) {
      console.error('Get snippet comments error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to load comments right now.',
      });
    }
  },

  async createSnippetComment(req, res) {
    try {
      const body = String(req.body.body || '').trim();

      if (!body) {
        return sendError(res, {
          status: 400,
          message: 'Comment text is required.',
        });
      }

      const snippet = await prisma.snippet.findUnique({
        where: { id: req.params.id },
        include: snippetAccessInclude,
      });

      if (!snippet || !canViewSnippet(snippet, req.user)) {
        return sendError(res, {
          status: 404,
          message: 'Snippet not found.',
        });
      }

      const comment = await prisma.comment.create({
        data: {
          snippetId: snippet.id,
          userId: req.user.id,
          body,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      await createNotifications(prisma, {
        userIds: [
          snippet.userId,
          ...(snippet.collaborators || []).map((collaborator) => collaborator.user.id),
          ...(snippet.team?.members || [])
            .filter((member) => TEAM_MANAGER_ROLES.has(member.role))
            .map((member) => member.userId),
        ].filter((userId) => userId !== req.user.id),
        type: 'COMMENT_ADDED',
        title: 'New snippet comment',
        message: `${req.user.name || req.user.email} commented on "${snippet.title}".`,
        payload: {
          snippetId: snippet.id,
          snippetTitle: snippet.title,
        },
      });

      return sendSuccess(res, {
        status: 201,
        message: 'Comment added successfully.',
        data: comment,
      });
    } catch (error) {
      console.error('Create snippet comment error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to add that comment right now.',
      });
    }
  },
};

export default snippetController;
