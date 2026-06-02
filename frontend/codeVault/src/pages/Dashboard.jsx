import { startTransition, useDeferredValue, useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, FolderKanban, Plus, Search, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import SnippetEditor from '../components/SnippetEditor';
import SnippetCard from '../components/SnippetCard';
import { apiRequest, buildQueryString, getErrorMessage } from '../config/api.js';
import useAuth from '../hooks/useAuth.js';
import './Dashboard.css';

const WORKSPACE_VIEW = {
  TEAMS: 'teams',
  CREATE: 'create',
  BROWSE: 'browse',
};

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    summary,
    notifications,
    unreadCount,
    refreshSession,
    refreshNotifications,
  } = useAuth();
  const [snippets, setSnippets] = useState([]);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('workspace');
  const [language, setLanguage] = useState('');
  const [visibility, setVisibility] = useState('');
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [editorError, setEditorError] = useState('');
  const [savingSnippet, setSavingSnippet] = useState(false);
  const [commentsBySnippet, setCommentsBySnippet] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentLoadingId, setCommentLoadingId] = useState('');
  const [commentSubmittingId, setCommentSubmittingId] = useState('');
  const [createTeamName, setCreateTeamName] = useState('');
  const [createTeamDescription, setCreateTeamDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [teamError, setTeamError] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);
  const [activeWorkspaceView, setActiveWorkspaceView] = useState(WORKSPACE_VIEW.BROWSE);
  const deferredSearch = useDeferredValue(search);
  const totalSnippets = summary?.snippetCount ?? snippets.length;
  const editorSectionRef = useRef(null);

  const openNewSnippetEditor = () => {
    setActiveWorkspaceView(WORKSPACE_VIEW.CREATE);
    setEditorOpen(true);
    setEditingSnippet(null);
    setEditorError('');
  };

  // Auto-scroll to editor when opened
  useEffect(() => {
    if (editorOpen && editorSectionRef.current) {
      setTimeout(() => {
        editorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  }, [editorOpen]);

  const openSnippetEditorForEdit = (selectedSnippet) => {
    setActiveWorkspaceView(WORKSPACE_VIEW.CREATE);
    setEditingSnippet(selectedSnippet);
    setEditorOpen(true);
    setEditorError('');
  };

  useEffect(() => {
    let active = true;

    const loadTeams = async () => {
      try {
        const response = await apiRequest('/api/teams');

        if (active) {
          setTeams(response.data || []);
        }
      } catch {
        if (active) {
          setTeams([]);
        }
      }
    };

    loadTeams();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const loadSnippets = async () => {
      setLoading(true);
      setError('');

      try {
        const query = buildQueryString({
          q: deferredSearch,
          scope,
          language,
          visibility,
          teamId,
        });
        const response = await apiRequest(`/api/snippets${query}`, {
          signal: controller.signal,
        });

        if (!active) {
          return;
        }

        startTransition(() => {
          setSnippets(response.data || []);
        });
      } catch (loadError) {
        if (!active || loadError.name === 'AbortError') {
          return;
        }

        setError(getErrorMessage(loadError, 'Unable to load snippets right now.'));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSnippets();

    return () => {
      active = false;
      controller.abort();
    };
  }, [deferredSearch, language, scope, teamId, visibility]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get('create') === '1') {
      setActiveWorkspaceView(WORKSPACE_VIEW.CREATE);
      setEditorOpen(true);
      setEditingSnippet(null);
      setEditorError('');
      navigate('/dashboard', { replace: true });
    }
  }, [location.search, navigate]);

  const resetEditor = () => {
    setEditingSnippet(null);
    setEditorOpen(false);
    setEditorError('');
    setActiveWorkspaceView(WORKSPACE_VIEW.BROWSE);
  };

  const loadComments = async (snippetId) => {
    setCommentLoadingId(snippetId);

    try {
      const response = await apiRequest(`/api/snippets/${snippetId}/comments`);
      setCommentsBySnippet((current) => ({
        ...current,
        [snippetId]: response.data || [],
      }));
    } catch {
      setCommentsBySnippet((current) => ({
        ...current,
        [snippetId]: [],
      }));
    } finally {
      setCommentLoadingId('');
    }
  };

  const handleSaveSnippet = async (payload) => {
    setSavingSnippet(true);
    setEditorError('');

    try {
      const endpoint = editingSnippet ? `/api/snippets/${editingSnippet.id}` : '/api/snippets';
      const method = editingSnippet ? 'PUT' : 'POST';
      const response = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      if (editingSnippet) {
        setSnippets((current) =>
          current.map((snippet) =>
            snippet.id === editingSnippet.id ? response.data : snippet,
          ),
        );
      } else {
        setSnippets((current) => [response.data, ...current]);
      }

      await refreshSession();
      await refreshNotifications();
      resetEditor();
    } catch (saveError) {
      setEditorError(getErrorMessage(saveError, 'Unable to save this snippet right now.'));
    } finally {
      setSavingSnippet(false);
    }
  };

  const handleDeleteSnippet = async (snippetId) => {
    const confirmed = window.confirm('Delete this snippet? This cannot be undone.');

    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(`/api/snippets/${snippetId}`, {
        method: 'DELETE',
      });

      setSnippets((current) => current.filter((snippet) => snippet.id !== snippetId));
      await refreshSession();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Unable to delete this snippet right now.'));
    }
  };

  const handleCommentSubmit = async (snippetId) => {
    const body = commentDrafts[snippetId]?.trim();

    if (!body) {
      return;
    }

    setCommentSubmittingId(snippetId);

    try {
      const response = await apiRequest(`/api/snippets/${snippetId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });

      setCommentsBySnippet((current) => ({
        ...current,
        [snippetId]: [...(current[snippetId] || []), response.data],
      }));
      setCommentDrafts((current) => ({
        ...current,
        [snippetId]: '',
      }));
      setSnippets((current) =>
        current.map((snippet) =>
          snippet.id === snippetId
            ? {
                ...snippet,
                _count: {
                  ...snippet._count,
                  comments: (snippet._count?.comments || 0) + 1,
                },
              }
            : snippet,
        ),
      );
      await refreshNotifications();
    } catch (commentError) {
      setError(getErrorMessage(commentError, 'Unable to post that comment right now.'));
    } finally {
      setCommentSubmittingId('');
    }
  };

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    setTeamLoading(true);
    setTeamError('');

    try {
      const response = await apiRequest('/api/teams', {
        method: 'POST',
        body: JSON.stringify({
          name: createTeamName,
          description: createTeamDescription,
        }),
      });

      setTeams((current) => [response.data, ...current]);
      setCreateTeamName('');
      setCreateTeamDescription('');
      await refreshSession();
    } catch (createError) {
      setTeamError(getErrorMessage(createError, 'Unable to create a team right now.'));
    } finally {
      setTeamLoading(false);
    }
  };

  const handleJoinTeam = async (event) => {
    event.preventDefault();
    setTeamLoading(true);
    setTeamError('');

    try {
      const response = await apiRequest('/api/teams/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode: joinCode }),
      });

      setTeams((current) => {
        const exists = current.some((team) => team.id === response.data.id);
        return exists ? current : [response.data, ...current];
      });
      setJoinCode('');
      await refreshSession();
      await refreshNotifications();
    } catch (joinError) {
      setTeamError(getErrorMessage(joinError, 'Unable to join that team right now.'));
    } finally {
      setTeamLoading(false);
    }
  };

  const workspaceCards = [
    {
      id: WORKSPACE_VIEW.TEAMS,
      eyebrow: 'Collaboration',
      title: 'Teams',
      description:
        'Create shared spaces, invite teammates, and jump into secure snippet libraries together.',
      meta: `${teams.length} team${teams.length === 1 ? '' : 's'} connected`,
      icon: Users,
    },
    {
      id: WORKSPACE_VIEW.CREATE,
      eyebrow: 'Capture',
      title: 'Create a new snippet',
      description:
        'Turn a useful pattern into a reusable snippet with language, tags, visibility, and team access.',
      meta: editingSnippet ? 'Continue editing your draft' : 'Start a fresh code entry',
      icon: Plus,
    },
    {
      id: WORKSPACE_VIEW.BROWSE,
      eyebrow: 'Discovery',
      title: 'Browse snippets',
      description:
        'Search personal, public, and team snippets with filters that help you find code faster.',
      meta:
        loading
          ? 'Loading your library...'
          : `${snippets.length} visible now · ${totalSnippets} total saved`,
      icon: Search,
    },
  ];

  return (
    <div className="dashboard-v2">
      <section className="dashboard-v2__hero">
        <div>
          <span className="dashboard-v2__pill">Workspace</span>
          <h1>{user?.name ? `${user.name.split(' ')[0]}'s vault` : 'Your CodeVault workspace'}</h1>
          <p>
            Search across personal snippets, shared team knowledge, and active reviews without
            leaving the dashboard.
          </p>
        </div>
        <button
          type="button"
          className="dashboard-v2__primary"
          onClick={openNewSnippetEditor}
        >
          <Plus size={18} />
          New snippet
        </button>
      </section>

      <section className="dashboard-v2__stats">
        <article>
          <FolderKanban size={18} />
          <strong>{summary?.snippetCount ?? snippets.length}</strong>
          <span>Personal snippets</span>
        </article>
        <article>
          <Users size={18} />
          <strong>{summary?.teamCount ?? teams.length}</strong>
          <span>Team memberships</span>
        </article>
        <article>
          <Bell size={18} />
          <strong>{unreadCount}</strong>
          <span>Unread notifications</span>
        </article>
      </section>

      <section className="dashboard-v2__hub">
        {workspaceCards.map((card) => {
          const Icon = card.icon;
          const isActive = activeWorkspaceView === card.id;

          return (
            <button
              key={card.id}
              type="button"
              className={`dashboard-v2__hub-card ${isActive ? 'is-active' : ''}`}
              onClick={() => {
                if (card.id === WORKSPACE_VIEW.CREATE) {
                  openNewSnippetEditor();
                  return;
                }

                setActiveWorkspaceView(card.id);
              }}
            >
              <span className="dashboard-v2__hub-icon">
                <Icon size={20} />
              </span>
              <span className="dashboard-v2__hub-eyebrow">{card.eyebrow}</span>
              <strong>{card.title}</strong>
              <p>{card.description}</p>
              <span className="dashboard-v2__hub-meta">{card.meta}</span>
            </button>
          );
        })}
      </section>

      {activeWorkspaceView === WORKSPACE_VIEW.TEAMS ? (
        <section className="dashboard-v2__workspace-shell">
          <div className="dashboard-v2__workspace-banner">
            <span className="dashboard-v2__filters-kicker">Teams</span>
            <h2>Manage collaboration in one place</h2>
            <p>
              Create teams, join with invite codes, and move into shared snippet libraries when
              you want to collaborate with others.
            </p>
          </div>

          <div className="dashboard-v2__workspace-grid">
            <section className="dashboard-v2__panel">
              <div className="dashboard-v2__panel-header">
                <h2>Teams</h2>
                <span>{teams.length}</span>
              </div>

              <div className="dashboard-v2__team-list">
                {teams.length === 0 ? (
                  <p className="dashboard-v2__hint">
                    Create a team or join one with an invite code to unlock shared snippets.
                  </p>
                ) : (
                  teams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      className={`dashboard-v2__team-item ${teamId === team.id ? 'is-active' : ''}`}
                      onClick={() => {
                        setScope('workspace');
                        setTeamId((current) => (current === team.id ? '' : team.id));
                        setActiveWorkspaceView(WORKSPACE_VIEW.BROWSE);
                      }}
                    >
                      <div>
                        <strong>{team.name}</strong>
                        <span>
                          {team.membershipRole} · {team.snippetCount} snippets
                        </span>
                      </div>
                      {team.inviteCode ? <code>{team.inviteCode}</code> : null}
                    </button>
                  ))
                )}
              </div>

              {teamError ? <div className="dashboard-v2__error">{teamError}</div> : null}

              <form className="dashboard-v2__stack-form" onSubmit={handleCreateTeam}>
                <h3>Create team</h3>
                <input
                  type="text"
                  placeholder="Platform engineering"
                  value={createTeamName}
                  onChange={(event) => setCreateTeamName(event.target.value)}
                />
                <textarea
                  rows="3"
                  placeholder="Shared snippets for a specific product or function."
                  value={createTeamDescription}
                  onChange={(event) => setCreateTeamDescription(event.target.value)}
                />
                <button type="submit" disabled={teamLoading}>
                  {teamLoading ? 'Working...' : 'Create team'}
                </button>
              </form>

              <form className="dashboard-v2__stack-form" onSubmit={handleJoinTeam}>
                <h3>Join team</h3>
                <input
                  type="text"
                  placeholder="Invite code"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value)}
                />
                <button type="submit" disabled={teamLoading}>
                  {teamLoading ? 'Working...' : 'Join with code'}
                </button>
              </form>
            </section>

            <section className="dashboard-v2__panel">
              <div className="dashboard-v2__panel-header">
                <h2>Recent alerts</h2>
                <span>{notifications.length}</span>
              </div>
              <div className="dashboard-v2__notification-list">
                {notifications.length === 0 ? (
                  <p className="dashboard-v2__hint">
                    Comments and snippet updates will appear here.
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className="dashboard-v2__notification-item">
                      <strong>{notification.title}</strong>
                      <p>{notification.message}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </section>
      ) : null}

      {activeWorkspaceView === WORKSPACE_VIEW.CREATE ? (
        <section className="dashboard-v2__workspace-shell" ref={editorSectionRef}>
          <div className="dashboard-v2__workspace-banner">
            <span className="dashboard-v2__filters-kicker">Create</span>
            <h2>Capture your next reusable snippet</h2>
            <p>
              Save a useful pattern with the right language, access controls, and team visibility
              so it is easy to reuse later.
            </p>
          </div>

          {editorOpen ? (
            <SnippetEditor
              snippet={editingSnippet}
              teams={teams}
              onSubmit={handleSaveSnippet}
              onCancel={resetEditor}
              submitting={savingSnippet}
              error={editorError}
            />
          ) : (
            <div className="page-panel">
              Open the creator to start a new snippet or jump back to browse if you want to review
              your existing library first.
            </div>
          )}
        </section>
      ) : null}

      {activeWorkspaceView === WORKSPACE_VIEW.BROWSE ? (
        <section className="dashboard-v2__workspace-shell">
          <div className="dashboard-v2__workspace-banner">
            <span className="dashboard-v2__filters-kicker">Browse</span>
            <h2>Find the right snippet quickly</h2>
            <p>
              Search across your vault with team, workspace, language, and visibility filters to
              surface the code you need.
            </p>
          </div>

          <section className="dashboard-v2__panel dashboard-v2__panel--filters">
            <div className="dashboard-v2__filters-header">
              <div>
                <span className="dashboard-v2__filters-kicker">Snippet filters</span>
                <h2>Browse snippets</h2>
                <p>
                  Refine your library by search term, team, language, and access level from this
                  focused browse view.
                </p>
              </div>
            </div>

            <div className="dashboard-v2__filters">
              <label className="dashboard-v2__filter-control dashboard-v2__filter-control--search">
                <Search size={18} />
                <input
                  type="search"
                  placeholder="Search snippets, code fragments, tags, or titles..."
                  aria-label="Search snippets"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <div className="dashboard-v2__filter-control dashboard-v2__filter-control--select">
                <select
                  aria-label="Filter by team"
                  value={teamId}
                  onChange={(event) => setTeamId(event.target.value)}
                >
                  <option value="">All teams</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="dashboard-v2__filter-chevron" />
              </div>

              <div className="dashboard-v2__filter-control dashboard-v2__filter-control--select">
                <select
                  aria-label="Filter workspace scope"
                  value={scope}
                  onChange={(event) => setScope(event.target.value)}
                >
                  <option value="workspace">Workspace</option>
                  <option value="mine">Only mine</option>
                  <option value="shared">Shared with me</option>
                  <option value="team">Team snippets</option>
                </select>
                <ChevronDown size={18} className="dashboard-v2__filter-chevron" />
              </div>

              <div className="dashboard-v2__filter-control dashboard-v2__filter-control--select">
                <select
                  aria-label="Filter by language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                >
                  <option value="">All languages</option>
                  <option value="JAVASCRIPT">JavaScript</option>
                  <option value="TYPESCRIPT">TypeScript</option>
                  <option value="PYTHON">Python</option>
                  <option value="SQL">SQL</option>
                  <option value="HTML">HTML</option>
                  <option value="CSS">CSS</option>
                </select>
                <ChevronDown size={18} className="dashboard-v2__filter-chevron" />
              </div>

              <div className="dashboard-v2__filter-control dashboard-v2__filter-control--select">
                <select
                  aria-label="Filter by visibility"
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value)}
                >
                  <option value="">All visibility</option>
                  <option value="PRIVATE">Private</option>
                  <option value="TEAM">Team</option>
                  <option value="PUBLIC">Public</option>
                </select>
                <ChevronDown size={18} className="dashboard-v2__filter-chevron" />
              </div>
            </div>
          </section>

          {error ? <div className="dashboard-v2__error">{error}</div> : null}

          {loading ? (
            <div className="page-panel">Loading your workspace...</div>
          ) : snippets.length === 0 ? (
            <div className="page-panel">
              No snippets match the current filters. Widen the search or open the create section to
              add something new to your library.
            </div>
          ) : (
            <div className="dashboard-v2__snippet-list">
              {snippets.map((snippet) => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  currentUser={user}
                  onEdit={openSnippetEditorForEdit}
                  onDelete={handleDeleteSnippet}
                  onLoadComments={loadComments}
                  comments={commentsBySnippet[snippet.id] || []}
                  commentsLoaded={snippet.id in commentsBySnippet}
                  commentsLoading={commentLoadingId === snippet.id}
                  commentDraft={commentDrafts[snippet.id] || ''}
                  onCommentDraftChange={(snippetId, value) =>
                    setCommentDrafts((current) => ({
                      ...current,
                      [snippetId]: value,
                    }))
                  }
                  onCommentSubmit={handleCommentSubmit}
                  commentSubmitting={commentSubmittingId === snippet.id}
                  showOwner
                />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
};

export default Dashboard;
