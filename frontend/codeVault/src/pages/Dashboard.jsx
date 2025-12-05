import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { API_BASE_URL } from '../config/api.js';

const Dashboard = () => {
  // const navigate = useNavigate();
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'JavaScript',
    code: '',
    tags: '',
    isPublic: false
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedSnippets, setExpandedSnippets] = useState(new Set());

  useEffect(() => {
    fetchSnippets();
  }, []);

  const fetchSnippets = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/snippets`, {
        method: 'GET',
        credentials: 'include',
        headers: headers,
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        setSnippets([]);
        setError('');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        // If not ok, treat as empty state for unauthenticated users
        setIsAuthenticated(false);
        setSnippets([]);
        setError('');
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setSnippets(data.data || []);
        setError('');
      } else {
        setIsAuthenticated(false);
        setSnippets([]);
        setError('');
      }
    } catch (err) {
      console.error('Error fetching snippets:', err);
      // On error, show empty state instead of error message
      setIsAuthenticated(false);
      setSnippets([]);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCreate = () => {
    if (!isAuthenticated) {
      setError('Please log in or sign up to create snippets.');
      return;
    }
    resetForm();
    setShowCreatePage(true);
  };

  const handleCreateSnippet = async () => {
    if (!formData.title || !formData.code) {
      setError('Please fill in title and code');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/snippets`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          code: formData.code,
          language: formData.language,
          tags: formData.tags,
          isPublic: formData.isPublic
        }),
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        setError('Please log in to create a snippet.');
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to create snippet');
        setSaving(false);
        return;
      }

      if (data.success) {
        setSnippets([data.data, ...snippets]);
        resetForm();
        setShowCreatePage(false);
      }
    } catch (err) {
      console.error('Error creating snippet:', err);
      setError('Server unreachable. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSnippet = async () => {
    if (!formData.title || !formData.code) {
      setError('Please fill in title and code');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/snippets/${editingSnippet.id}`, {
        method: 'PUT',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          code: formData.code,
          language: formData.language,
          tags: formData.tags,
          isPublic: formData.isPublic
        }),
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        setError('Please log in to update a snippet.');
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to update snippet');
        setSaving(false);
        return;
      }

      if (data.success) {
        setSnippets(snippets.map(s => s.id === editingSnippet.id ? data.data : s));
        resetForm();
        setEditingSnippet(null);
      }
    } catch (err) {
      console.error('Error updating snippet:', err);
      setError('Server unreachable. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this snippet?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/snippets/${id}`, {
        method: 'DELETE',
        headers: headers,
        credentials: 'include',
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        setError('Please log in to manage snippets.');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to delete snippet');
      }

      setSnippets(snippets.filter(snippet => snippet.id !== id));
    } catch (err) {
      console.error('Error deleting snippet:', err);
      setError('Failed to delete snippet. Please try again.');
    }
  };

  const handleEdit = (snippet) => {
    setEditingSnippet(snippet);
    setFormData({
      title: snippet.title,
      description: snippet.description || '',
      language: snippet.language,
      code: snippet.code,
      tags: Array.isArray(snippet.tags) ? snippet.tags.join(', ') : '',
      isPublic: snippet.isPublic
    });
    setShowCreatePage(true);
    setError('');
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  const toggleExpand = (snippetId) => {
    setExpandedSnippets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(snippetId)) {
        newSet.delete(snippetId);
      } else {
        newSet.add(snippetId);
      }
      return newSet;
    });
  };

  const getCodePreview = (code, maxLines = 10) => {
    const lines = code.split('\n');
    if (lines.length <= maxLines) {
      return code;
    }
    return lines.slice(0, maxLines).join('\n');
  };

  const isCodeLong = (code) => {
    return code.split('\n').length > 10;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      language: 'JavaScript',
      code: '',
      tags: '',
      isPublic: false
    });
    setError('');
  };

  const handleCancel = () => {
    resetForm();
    setShowCreatePage(false);
    setEditingSnippet(null);
  };

  const filteredSnippets = snippets.filter(snippet =>
    snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (Array.isArray(snippet.tags) && snippet.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const getLanguageColor = (language) => {
    const colors = {
      TYPESCRIPT: '#3178c6',
      JAVASCRIPT: '#f7df1e',
      SQL: '#e535ab',
      PYTHON: '#3776ab',
      JAVA: '#f89820',
      CPP: '#00599c',
      REACT: '#61dafb',
      HTML: '#e34c26',
      CSS: '#264de4',
      NODE: '#339933'
    };
    return colors[language] || '#6c757d';
  };

  if (showCreatePage) {
    return (
      <div className="create-snippet-page">
        <div className="create-snippet-container">
          <button className="back-button" onClick={handleCancel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Dashboard
          </button>

          <h1 className="create-title">
            {editingSnippet ? 'Edit Snippet' : 'Create New Snippet'}
          </h1>

          {error && <div className="error-message">{error}</div>}

          <div className="create-form">
            <div className="form-group">
              <label>Snippet Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., React useLocalStorage Hook"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe what this snippet does..."
              />
            </div>

            <div className="form-row">
              <div className="form-group form-group-half">
                <label>Language *</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({...formData, language: e.target.value})}
                >
                  <option value="JavaScript">JavaScript</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                  <option value="CPP">C++</option>
                  <option value="SQL">SQL</option>
                  <option value="React">React</option>
                  <option value="HTML">HTML</option>
                  <option value="CSS">CSS</option>
                  <option value="Node">Node.js</option>
                </select>
              </div>

              <div className="form-group form-group-half">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="e.g., react, hooks, state"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Code *</label>
              <textarea
                className="code-textarea"
                rows="12"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                placeholder="Paste your code here..."
              />
            </div>

            <div className="form-group-checkbox">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
              />
              <label htmlFor="isPublic">Make this snippet public</label>
            </div>

            <div className="form-actions">
              <button 
                className="btn-create-snippet" 
                onClick={editingSnippet ? handleUpdateSnippet : handleCreateSnippet}
                disabled={saving}
              >
                {saving ? 'Saving...' : (editingSnippet ? 'Update Snippet' : 'Create Snippet')}
              </button>
              <button 
                className="btn-cancel-create" 
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-spinner">Loading snippets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">My Snippets</h1>
          <p className="snippet-count">{snippets.length} {snippets.length === 1 ? 'snippet' : 'snippets'} saved</p>
        </div>
        <button 
          className="btn-new-snippet" 
          onClick={handleStartCreate}
          disabled={!isAuthenticated}
          title={isAuthenticated ? 'Create a new snippet' : 'Log in to create snippets'}
        >
          <span className="plus-icon">+</span> New Snippet
        </button>
      </div>

      {error && !showCreatePage && (
        <div className="error-message" style={{ margin: '1rem 0', padding: '1rem' }}>
          {error}
        </div>
      )}

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search snippets by title, language, or tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="snippets-list">
        {filteredSnippets.length === 0 ? (
          <div className="empty-state">
            <p>
              {searchQuery
                ? 'No snippets found matching your search.'
                : (isAuthenticated
                    ? 'No snippets yet. Create your first snippet!'
                    : 'No snippets to show. Log in or sign up to start saving snippets.')}
            </p>
          </div>
        ) : (
          filteredSnippets.map(snippet => (
            <div key={snippet.id} className="snippet-card">
              <div className="snippet-header">
                <div className="snippet-title-section">
                  <h3 className="snippet-title">{snippet.title}</h3>
                  <span 
                    className="language-badge" 
                    style={{ backgroundColor: getLanguageColor(snippet.language) }}
                  >
                    {snippet.language}
                  </span>
                </div>
                <div className="snippet-actions">
                  <button 
                    className="action-btn edit-btn" 
                    onClick={() => handleEdit(snippet)}
                    title="Edit snippet"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button 
                    className="action-btn" 
                    onClick={() => handleCopy(snippet.code)}
                    title="Copy code"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                  <button 
                    className="action-btn delete-btn" 
                    onClick={() => handleDelete(snippet.id)}
                    title="Delete snippet"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {snippet.description && (
                <p className="snippet-description">{snippet.description}</p>
              )}

              <div className="code-container">
                <pre className="snippet-code">
                  {expandedSnippets.has(snippet.id) 
                    ? snippet.code 
                    : getCodePreview(snippet.code)
                  }
                </pre>
                {isCodeLong(snippet.code) && (
                  <button 
                    className="expand-code-btn"
                    onClick={() => toggleExpand(snippet.id)}
                  >
                    {expandedSnippets.has(snippet.id) ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                        Show Less
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                        Show More ({snippet.code.split('\n').length - 10} more lines)
                      </>
                    )}
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
                <span className={`visibility-badge ${snippet.isPublic ? 'public' : 'private'}`}>
                  {snippet.isPublic ? '🌐 Public' : '🔒 Private'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
