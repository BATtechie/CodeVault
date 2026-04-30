import crypto from 'crypto';
import prisma from '../db/prisma.js';
import { sendError, sendSuccess } from '../utils/http.js';
import { createNotifications } from '../utils/notifications.js';
import { slugify } from '../utils/snippets.js';

const buildUniqueTeamSlug = async (name) => {
  const baseSlug = slugify(name) || `team-${crypto.randomBytes(2).toString('hex')}`;
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.team.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

const createInviteCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

const serializeTeamMembership = (membership) => {
  const { team, role } = membership;

  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    description: team.description,
    inviteCode: role === 'OWNER' || role === 'ADMIN' ? team.inviteCode : null,
    owner: team.owner,
    membershipRole: role,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
    memberCount: team._count.members,
    snippetCount: team._count.snippets,
  };
};

const teamController = {
  async listMyTeams(req, res) {
    try {
      const memberships = await prisma.teamMember.findMany({
        where: { userId: req.user.id },
        orderBy: {
          team: {
            updatedAt: 'desc',
          },
        },
        include: {
          team: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  members: true,
                  snippets: true,
                },
              },
            },
          },
        },
      });

      return sendSuccess(res, {
        data: memberships.map(serializeTeamMembership),
      });
    } catch (error) {
      console.error('List teams error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to load teams right now.',
      });
    }
  },

  async createTeam(req, res) {
    try {
      const name = String(req.body.name || '').trim();
      const description = String(req.body.description || '').trim() || null;

      if (!name) {
        return sendError(res, {
          status: 400,
          message: 'Team name is required.',
        });
      }

      const slug = await buildUniqueTeamSlug(name);
      const inviteCode = createInviteCode();

      const team = await prisma.team.create({
        data: {
          name,
          slug,
          description,
          inviteCode,
          ownerId: req.user.id,
          members: {
            create: {
              userId: req.user.id,
              role: 'OWNER',
            },
          },
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              members: true,
              snippets: true,
            },
          },
          members: {
            where: { userId: req.user.id },
            select: { role: true },
            take: 1,
          },
        },
      });

      return sendSuccess(res, {
        status: 201,
        message: 'Team created successfully.',
        data: {
          id: team.id,
          name: team.name,
          slug: team.slug,
          description: team.description,
          inviteCode: team.inviteCode,
          owner: team.owner,
          membershipRole: team.members[0]?.role || 'OWNER',
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
          memberCount: team._count.members,
          snippetCount: team._count.snippets,
        },
      });
    } catch (error) {
      console.error('Create team error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to create a team right now.',
      });
    }
  },

  async joinTeam(req, res) {
    try {
      const inviteCode = String(req.body.inviteCode || '').trim().toUpperCase();

      if (!inviteCode) {
        return sendError(res, {
          status: 400,
          message: 'Invite code is required.',
        });
      }

      const team = await prisma.team.findUnique({
        where: { inviteCode },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              members: true,
              snippets: true,
            },
          },
          members: {
            where: { userId: req.user.id },
            select: { id: true, role: true },
            take: 1,
          },
        },
      });

      if (!team) {
        return sendError(res, {
          status: 404,
          message: 'We could not find a team with that invite code.',
        });
      }

      if (team.members.length > 0) {
        return sendSuccess(res, {
          message: 'You are already a member of this team.',
          data: {
            id: team.id,
            name: team.name,
            slug: team.slug,
            description: team.description,
            inviteCode: null,
            owner: team.owner,
            membershipRole: team.members[0].role,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
            memberCount: team._count.members,
            snippetCount: team._count.snippets,
          },
        });
      }

      const membership = await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: req.user.id,
        },
        include: {
          team: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  members: true,
                  snippets: true,
                },
              },
            },
          },
        },
      });

      await createNotifications(prisma, {
        userIds: [team.ownerId],
        type: 'TEAM_JOINED',
        title: 'New team member',
        message: `${req.user.name || req.user.email} joined ${team.name}.`,
        payload: {
          teamId: team.id,
          teamName: team.name,
          memberId: req.user.id,
        },
      });

      return sendSuccess(res, {
        message: 'Team joined successfully.',
        data: serializeTeamMembership(membership),
      });
    } catch (error) {
      console.error('Join team error:', error);
      return sendError(res, {
        status: 500,
        message: 'Unable to join the team right now.',
      });
    }
  },
};

export default teamController;
