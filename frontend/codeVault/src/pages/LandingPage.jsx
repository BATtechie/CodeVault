import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="landing-hero">
        <div className="landing-card">
          <h1>CodeVault</h1>
          <p className="subtext">Securely store, organize and share your code snippets and projects.</p>

          <div className="cta-row">
            <button className="primary-cta" onClick={() => navigate('/sign-in')}>Get Started</button>
          </div>
        </div>
      </div>

      <section className="features">
        <div className="features-inner">
          <div className="feature-card">
            <h3>Organize</h3>
            <p>Tag, search and group snippets for fast retrieval.</p>
          </div>

          <div className="feature-card">
            <h3>Secure</h3>
            <p>Encrypted storage and role-based access for teams.</p>
          </div>

          <div className="feature-card">
            <h3>Share</h3>
            <p>Share projects and snippets with collaborators instantly.</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} CodeVault — Built with care.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
