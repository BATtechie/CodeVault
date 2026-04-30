import { useState } from 'react';
import {
  Edit3,
  Globe2,
  Lock,
  MessageSquareMore,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
import CodeBlock from './CodeBlock';
import './SnippetCard.css';

const visibilityConfig = {
  PRIVATE: {
    label: 'Private',
    Icon: Lock,
  },
  TEAM: {
    label: 'Team',
    Icon: Users,
  },
  PUBLIC: {
    label: 'Public',
    Icon: Globe2,
  },
};

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

const getInitials = (name, email) => {
  const source = name || email || 'U';
  return source
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

const canManageSnippet = (snippet, currentUser) => {
  if (!currentUser) {
    return false;
  }

  if (snippet.user?.id === currentUser.id || currentUser.role === 'ADMIN') {
    return true;
  }

  return snippet.collaborators?.some(
    (collaborator) =>
      collaborator.user.id === currentUser.id && collaborator.role === 'EDITOR',
  );
};

const SnippetCard = ({
  snippet,
  currentUser,
  onEdit,
  onDelete,
  onLoadComments,
  comments = [],
  commentsLoaded = false,
  commentsLoading = false,
  commentDraft = '',
  onCommentDraftChange,
  onCommentSubmit,
  commentSubmitting = false,
  readOnly = false,
  showOwner = true,
  allowComments = true,
}) => {
  const [showComments, setShowComments] = useState(false);
  const visibility = visibilityConfig[snippet.visibility] || visibilityConfig.PRIVATE;
  const VisibilityIcon = visibility.Icon;
  const canManage = !readOnly && canManageSnippet(snippet, currentUser);

  const handleToggleComments = () => {
    const nextValue = !showComments;
    setShowComments(nextValue);

    if (nextValue && !commentsLoaded && onLoadComments) {
      onLoadComments(snippet.id);
    }
  };

  return (
    <article className="snippet-card-v2">
      <div className="snippet-card-v2__topline">
        <span className="snippet-card-v2__badge">
          <VisibilityIcon size={14} />
          {visibility.label}
        </span>
        <span className="snippet-card-v2__date">Updated {formatDate(snippet.updatedAt)}</span>
      </div>

      <div className="snippet-card-v2__header">
        <div className="snippet-card-v2__title-group">
          <h3>{snippet.title}</h3>
          <p>{snippet.description || 'Reusable code, organized for quick discovery.'}</p>
        </div>

        {canManage ? (
          <div className="snippet-card-v2__actions">
            <button type="button" onClick={() => onEdit(snippet)}>
              <Edit3 size={16} />
              Edit
            </button>
            <button type="button" className="danger" onClick={() => onDelete(snippet.id)}>
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <div className="snippet-card-v2__meta">
        <span>{snippet.language}</span>
        {showOwner && snippet.user ? (
          <span className="snippet-card-v2__owner">
            <span className="snippet-card-v2__owner-avatar">
              {getInitials(snippet.user.name, snippet.user.email)}
            </span>
            {snippet.user.name || snippet.user.email}
          </span>
        ) : null}
        {snippet.team ? <span>Team: {snippet.team.name}</span> : null}
        <span>{snippet._count?.comments || 0} comments</span>
      </div>

      <CodeBlock
        code={snippet.code}
        language={snippet.language}
        title={snippet.team ? `${snippet.team.name} workspace` : 'Snippet'}
      />

      {snippet.tags?.length ? (
        <div className="snippet-card-v2__tags">
          {snippet.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      ) : null}

      {allowComments ? (
        <div className="snippet-card-v2__comments">
          <button type="button" className="snippet-card-v2__comment-toggle" onClick={handleToggleComments}>
            <MessageSquareMore size={16} />
            {showComments ? 'Hide discussion' : 'Open discussion'}
          </button>

          {showComments ? (
            <div className="snippet-card-v2__comment-panel">
              {commentsLoading ? <p className="snippet-card-v2__hint">Loading comments...</p> : null}

              {!commentsLoading && comments.length === 0 ? (
                <p className="snippet-card-v2__hint">No comments yet. Start the review thread.</p>
              ) : null}

              {comments.map((comment) => (
                <div key={comment.id} className="snippet-card-v2__comment">
                  <div className="snippet-card-v2__comment-avatar">
                    {getInitials(comment.user?.name, comment.user?.email)}
                  </div>
                  <div className="snippet-card-v2__comment-body">
                    <div className="snippet-card-v2__comment-meta">
                      <strong>{comment.user?.name || comment.user?.email}</strong>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                    <p>{comment.body}</p>
                  </div>
                </div>
              ))}

              {currentUser ? (
                <form
                  className="snippet-card-v2__comment-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    onCommentSubmit(snippet.id);
                  }}
                >
                  <textarea
                    rows="3"
                    placeholder="Add a review comment or implementation note..."
                    value={commentDraft}
                    onChange={(event) => onCommentDraftChange(snippet.id, event.target.value)}
                  />
                  <button type="submit" disabled={commentSubmitting}>
                    <Send size={16} />
                    {commentSubmitting ? 'Sending...' : 'Comment'}
                  </button>
                </form>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};

export default SnippetCard;
