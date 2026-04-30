import { useEffect, useState } from 'react';
import './SnippetEditor.css';

const languageOptions = [
  'JAVASCRIPT',
  'TYPESCRIPT',
  'PYTHON',
  'SQL',
  'HTML',
  'CSS',
  'JAVA',
  'CPP',
  'GO',
  'RUST',
  'BASH',
  'JSON',
];

const createInitialState = (snippet) => ({
  title: snippet?.title || '',
  description: snippet?.description || '',
  language: snippet?.language || 'JAVASCRIPT',
  tags: Array.isArray(snippet?.tags) ? snippet.tags.join(', ') : '',
  visibility: snippet?.visibility || (snippet?.isPublic ? 'PUBLIC' : 'PRIVATE'),
  teamId: snippet?.team?.id || snippet?.teamId || '',
  code: snippet?.code || '',
});

const SnippetEditor = ({
  snippet,
  teams,
  onSubmit,
  onCancel,
  submitting = false,
  error = '',
}) => {
  const [formState, setFormState] = useState(() => createInitialState(snippet));

  useEffect(() => {
    setFormState(createInitialState(snippet));
  }, [snippet]);

  return (
    <section className="snippet-editor">
      <div className="snippet-editor__header">
        <div>
          <p className="snippet-editor__eyebrow">Snippet Studio</p>
          <h2>{snippet ? 'Refine snippet' : 'Create a new snippet'}</h2>
          <p>
            Capture reusable code with the right context, visibility, and team alignment.
          </p>
        </div>
        <button type="button" className="snippet-editor__ghost" onClick={onCancel}>
          Close
        </button>
      </div>

      {error ? <div className="snippet-editor__error">{error}</div> : null}

      <form
        className="snippet-editor__form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(formState);
        }}
      >
        <label>
          <span>Title</span>
          <input
            type="text"
            placeholder="Example: Postgres query helper"
            value={formState.title}
            onChange={(event) =>
              setFormState((current) => ({ ...current, title: event.target.value }))
            }
          />
        </label>

        <label>
          <span>Description</span>
          <textarea
            rows="3"
            placeholder="Explain when to use this snippet and why it exists."
            value={formState.description}
            onChange={(event) =>
              setFormState((current) => ({ ...current, description: event.target.value }))
            }
          />
        </label>

        <div className="snippet-editor__grid">
          <label>
            <span>Language</span>
            <select
              value={formState.language}
              onChange={(event) =>
                setFormState((current) => ({ ...current, language: event.target.value }))
              }
            >
              {languageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Visibility</span>
            <select
              value={formState.visibility}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  visibility: event.target.value,
                  teamId: event.target.value === 'TEAM' ? current.teamId : '',
                }))
              }
            >
              <option value="PRIVATE">Private</option>
              <option value="TEAM">Team</option>
              <option value="PUBLIC">Public</option>
            </select>
          </label>
        </div>

        {formState.visibility === 'TEAM' ? (
          <label>
            <span>Team</span>
            <select
              value={formState.teamId}
              onChange={(event) =>
                setFormState((current) => ({ ...current, teamId: event.target.value }))
              }
            >
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label>
          <span>Tags</span>
          <input
            type="text"
            placeholder="hooks, auth, prisma"
            value={formState.tags}
            onChange={(event) =>
              setFormState((current) => ({ ...current, tags: event.target.value }))
            }
          />
        </label>

        <label>
          <span>Code</span>
          <textarea
            rows="14"
            className="snippet-editor__code"
            placeholder="Paste your snippet here..."
            value={formState.code}
            onChange={(event) =>
              setFormState((current) => ({ ...current, code: event.target.value }))
            }
          />
        </label>

        <div className="snippet-editor__footer">
          <p>
            Private snippets stay with you, team snippets inherit workspace access, and public
            snippets appear in the community library.
          </p>
          <div className="snippet-editor__actions">
            <button type="button" className="snippet-editor__ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="snippet-editor__primary" disabled={submitting}>
              {submitting ? 'Saving...' : snippet ? 'Update snippet' : 'Create snippet'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};

export default SnippetEditor;
