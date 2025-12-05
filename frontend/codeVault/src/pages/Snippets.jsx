import React, { useEffect, useState } from 'react';
import './Snippets.css';

const Snippets = () => {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSnippets, setExpandedSnippets] = useState(new Set());

  const backendUrl = import.meta.env.VITE_BACKEND_URL ||
    (import.meta.env.PROD ? 'https://your-backend.onrender.com' : 'http://localhost:3000');

  useEffect(() => {
    fetchPublicSnippets();
  }, []);

  const fetchPublicSnippets = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${backendUrl}/api/snippets/public`);
      
      // If response is not ok, treat as empty state
      if (!res.ok) {
        setSnippets([]);
        setError('');
        setLoading(false);
        return;
      }

      const data = await res.json();

      // If data is not successful or missing, treat as empty state
      if (!data.success) {
        setSnippets([]);
        setError('');
        setLoading(false);
        return;
      }

      // Successfully loaded snippets (could be empty array)
      setSnippets(data.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching public snippets:', err);
      // On error, show empty state instead of error message
      setSnippets([]);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (snippetId) => {
    setExpandedSnippets(prev => {
      const next = new Set(prev);
      if (next.has(snippetId)) {
        next.delete(snippetId);
      } else {
        next.add(snippetId);
      }
      return next;
    });
  };

  const getCodePreview = (code, maxLines = 10) => {
    const lines = code.split('\n');
    if (lines.length <= maxLines) return code;
    return lines.slice(0, maxLines).join('\n');
  };

  const isCodeLong = (code) => code.split('\n').length > 10;

  const filteredSnippets = snippets.filter(snippet =>
    snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (Array.isArray(snippet.tags) && snippet.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  if (loading) {
    return (
      <div className="snippets-page">
        <div className="loading-container">
          <div className="loading-spinner">Loading public snippets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="snippets-page">
      <div className="snippets-header">
        <div>
          <h1 className="snippets-title">Public Snippets</h1>
          <p className="snippets-subtitle">
            Browse snippets shared by the community.
          </p>
        </div>
        <div className="snippet-count">
          {snippets.length} {snippets.length === 1 ? 'snippet' : 'snippets'}
        </div>
      </div>

      <div className="snippets-search">
        <input
          type="text"
          className="search-input"
          placeholder="Search by title, language, or tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="error-message" style={{ margin: '1rem 0', padding: '1rem' }}>
          {error}
        </div>
      )}

      <div className="snippets-list">
        {filteredSnippets.length === 0 ? (
          <div className="empty-state">
            <p>{searchQuery ? 'No snippets found matching your search.' : 'No public snippets available yet.'}</p>
          </div>
        ) : (
          filteredSnippets.map(snippet => (
            <div key={snippet.id} className="snippet-card">
              <div className="snippet-header">
                <div className="snippet-title-section">
                  <h3 className="snippet-title">{snippet.title}</h3>
                  <span className="language-badge">{snippet.language}</span>
                </div>
                <div className="author-info">
                  <span className="author-avatar">
                    {(snippet.user?.name || snippet.user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                  <span className="author-name">
                    {snippet.user?.name || snippet.user?.email || 'Unknown user'}
                  </span>
                </div>
              </div>

              {snippet.description && (
                <p className="snippet-description">{snippet.description}</p>
              )}

              <div className="code-container">
                <pre className="snippet-code">
                  {expandedSnippets.has(snippet.id)
                    ? snippet.code
                    : getCodePreview(snippet.code)}
                </pre>
                {isCodeLong(snippet.code) && (
                  <button
                    className="expand-code-btn"
                    onClick={() => toggleExpand(snippet.id)}
                  >
                    {expandedSnippets.has(snippet.id) ? 'Show Less' : `Show More (${snippet.code.split('\n').length - 10} more lines)`}
                  </button>
                )}
              </div>

              {Array.isArray(snippet.tags) && snippet.tags.length > 0 && (
                <div className="snippet-tags">
                  {snippet.tags.map((tag, index) => (
                    <span key={index} className="tag">#{tag}</span>
                  ))}
                </div>
              )}

              <div className="snippet-footer">
                <span className="snippet-date">
                  {new Date(snippet.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                <span className="visibility-badge public">🌐 Public</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Snippets;
