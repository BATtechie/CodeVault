import { ArrowRight, Search, ShieldCheck, Sparkles, Users2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CodeBlock from '../components/CodeBlock';
import useAuth from '../hooks/useAuth.js';
import './Home.css';

const featureCards = [
  {
    title: 'Searchable by intent',
    description: 'Find snippets by title, tags, language, code fragments, visibility, or team context.',
    icon: Search,
  },
  {
    title: 'Built for real teams',
    description: 'Private, public, and team-scoped snippets make sharing precise instead of risky.',
    icon: Users2,
  },
  {
    title: 'Security-first sessions',
    description: 'Remember-me sessions, JWT hardening, notifications, and optional two-factor auth are built in.',
    icon: ShieldCheck,
  },
  {
    title: 'Review-ready workflow',
    description: 'Comments and update alerts turn saved code into a lightweight collaboration system.',
    icon: Sparkles,
  },
];

const heroCode = `export async function saveSnippet(snippet) {
  const response = await apiRequest('/api/snippets', {
    method: 'POST',
    body: JSON.stringify({
      title: snippet.title,
      language: snippet.language,
      visibility: snippet.visibility,
      tags: snippet.tags,
      code: snippet.code,
    }),
  });

  return response.data;
}`;

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="home-v2">
      <section className="home-v2__hero">
        <div className="home-v2__hero-copy">
          <span className="home-v2__pill">Market-ready snippet workflow</span>
          <h1>
            Organize every useful
            <span>code snippet like product knowledge.</span>
          </h1>
          <p>
            CodeVault gives developers a polished place to capture snippets, search them fast,
            collaborate with comments, and share safely across private, public, and team
            workspaces.
          </p>

          <div className="home-v2__hero-actions">
            <button
              type="button"
              className="home-v2__primary"
              onClick={() => navigate(user ? '/dashboard' : '/sign-in', { state: { mode: 'signup' } })}
            >
              {user ? 'Open workspace' : 'Start organizing'}
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              className="home-v2__secondary"
              onClick={() => navigate('/snippets')}
            >
              Browse community snippets
            </button>
          </div>

          <div className="home-v2__stats">
            <div>
              <strong>3 views</strong>
              <span>Private, team, public</span>
            </div>
            <div>
              <strong>2FA-ready</strong>
              <span>Remember-me sessions included</span>
            </div>
            <div>
              <strong>Fast discovery</strong>
              <span>Fuzzy search and structured filters</span>
            </div>
          </div>
        </div>

        <div className="home-v2__hero-preview">
          <CodeBlock
            code={heroCode}
            language="TYPESCRIPT"
            title="Snippet save flow"
          />
        </div>
      </section>

      <section className="home-v2__story">
        <div className="home-v2__story-card">
          <h2>Why teams outgrow notes and gists</h2>
          <p>
            Reusable code becomes hard to trust when it lives in Slack threads, personal files,
            and half-remembered repos. CodeVault turns those fragments into a curated workspace
            with ownership, permissions, and search that scales with your team.
          </p>
        </div>
        <div className="home-v2__story-grid">
          {featureCards.map((feature) => {
            const IconComponent = feature.icon;

            return (
              <article key={feature.title} className="home-v2__feature-card">
                <span className="home-v2__feature-icon">
                  <IconComponent size={18} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="home-v2__cta">
        <div>
          <p className="home-v2__pill home-v2__pill--dark">Ready to ship</p>
          <h2>Set up once, then let your snippet library compound.</h2>
          <p>
            From personal workflow to team collaboration, the platform is prepared for production
            deployment with Prisma, Express, React, and environment-specific configuration.
          </p>
        </div>
        <button
          type="button"
          className="home-v2__primary"
          onClick={() => navigate(user ? '/dashboard' : '/sign-in', { state: { mode: 'signup' } })}
        >
          Launch CodeVault
          <ArrowRight size={18} />
        </button>
      </section>
    </div>
  );
};

export default Home;
