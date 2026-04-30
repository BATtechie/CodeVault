import { useDeferredValue, useEffect, useState } from 'react';
import SnippetCard from '../components/SnippetCard';
import { apiRequest, buildQueryString, getErrorMessage } from '../config/api.js';
import useAuth from '../hooks/useAuth.js';
import './Snippets.css';

const Snippets = () => {
  const { user } = useAuth();
  const [snippets, setSnippets] = useState([]);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    const controller = new AbortController();

    const loadSnippets = async () => {
      setLoading(true);
      setError('');

      try {
        const query = buildQueryString({
          q: deferredSearch,
          language,
          tag,
        });
        const response = await apiRequest(`/api/snippets/public${query}`, {
          signal: controller.signal,
        });

        setSnippets(response.data || []);
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(getErrorMessage(loadError, 'Unable to load community snippets right now.'));
        }
      } finally {
        setLoading(false);
      }
    };

    loadSnippets();

    return () => controller.abort();
  }, [deferredSearch, language, tag]);

  return (
    <div className="snippets-v2">
      <section className="snippets-v2__hero">
        <div>
          <span className="snippets-v2__pill">Community library</span>
          <h1>Browse public snippets from the wider CodeVault workspace.</h1>
          <p>
            Search by intent, filter by language or tag, and explore the snippets other developers
            chose to share publicly.
          </p>
        </div>
      </section>

      <section className="snippets-v2__toolbar">
        <input
          type="search"
          placeholder="Search titles, tags, languages, or code fragments..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={language} onChange={(event) => setLanguage(event.target.value)}>
          <option value="">All languages</option>
          <option value="JAVASCRIPT">JavaScript</option>
          <option value="TYPESCRIPT">TypeScript</option>
          <option value="PYTHON">Python</option>
          <option value="SQL">SQL</option>
          <option value="HTML">HTML</option>
          <option value="CSS">CSS</option>
        </select>
        <input
          type="text"
          placeholder="Tag filter, for example auth"
          value={tag}
          onChange={(event) => setTag(event.target.value)}
        />
      </section>

      {error ? <div className="snippets-v2__error">{error}</div> : null}

      {loading ? (
        <div className="page-panel">Loading public snippets...</div>
      ) : snippets.length === 0 ? (
        <div className="page-panel">
          No public snippets match the current filters yet. Try a broader search or share a few from
          your own workspace.
        </div>
      ) : (
        <section className="snippets-v2__list">
          {snippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              currentUser={user}
              readOnly
              allowComments={false}
              showOwner
            />
          ))}
        </section>
      )}
    </div>
  );
};

export default Snippets;
