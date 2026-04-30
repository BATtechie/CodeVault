import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => (
  <footer className="footer-v2">
    <div className="footer-v2__inner">
      <div className="footer-v2__brand">
        <div className="footer-v2__mark">&lt;/&gt;</div>
        <div>
          <strong>CodeVault</strong>
          <p>
            A polished snippet workspace for personal libraries, shared team knowledge, and
            searchable code you can trust.
          </p>
        </div>
      </div>

      <div className="footer-v2__links">
        <div>
          <span>Explore</span>
          <Link to="/">Home</Link>
          <Link to="/snippets">Community snippets</Link>
          <Link to="/dashboard">Workspace</Link>
        </div>
        <div>
          <span>Build</span>
          <a href="https://vercel.com" target="_blank" rel="noreferrer">
            Vercel-ready frontend
          </a>
          <a href="https://render.com" target="_blank" rel="noreferrer">
            Render or Railway backend
          </a>
          <a href="https://www.prisma.io" target="_blank" rel="noreferrer">
            Prisma + PostgreSQL
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
