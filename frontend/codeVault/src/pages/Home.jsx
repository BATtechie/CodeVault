import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);

  const checkAuthAndRedirect = async () => {
    setIsChecking(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 
        (import.meta.env.PROD ? 'https://your-backend.onrender.com' : 'http://localhost:3000');
      
      const res = await fetch(
        `${backendUrl}/api/auth/me`,
        {
          method: 'GET',
          credentials: 'include', // Important: include cookies
        }
      );

      if (res.ok) {
        // User is authenticated, redirect to Dashboard
        navigate('/dashboard');
      } else {
        // User is not authenticated, redirect to sign-in page
        navigate('/sign-in');
      }
    } catch (error) {
      // On error, assume not authenticated and redirect to sign-in
      console.error('Auth check failed:', error);
      navigate('/sign-in');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="home">
      <div className="hero-section">
        <div className="badge">
          <span className="badge-dot"></span>
          The #1 Code Snippet Manager
        </div>
        
        <h1 className="hero-title">
          Never Search for Code
          <br />
          <span className="hero-title-accent">Twice Again</span>
        </h1>
        
        <p className="hero-description">
          CodeVault is your personal code library. Save, search, and share
          your most useful code snippets with syntax highlighting, team
          collaboration, and smart organization.
        </p>
        
        <div className="hero-buttons">
          <button 
            className="btn-primary" 
            onClick={checkAuthAndRedirect}
            disabled={isChecking}
          >
            {isChecking ? 'Loading...' : 'Get Started'}
            {!isChecking && <span className="arrow">→</span>}
          </button>
          <button className="btn-secondary">View Demo</button>
        </div>
        
        <div className="preview-card">
          <div className="preview-icon">
            <span>&lt;/&gt;</span>
          </div>
          <p className="preview-text">Dashboard Preview</p>
        </div>
      </div>
      
      <div className="problem-section">
        <h2 className="problem-title">The Problem</h2>
        <p className="problem-description">
          Developers constantly reuse code patterns but waste time
          searching for solutions they've already written.
        </p>
        
        <div className="problem-grid">
          <div className="problem-card">
            <div className="problem-icon">
              <span>✕</span>
            </div>
            <h3 className="problem-card-title">Scattered Snippets</h3>
            <p className="problem-card-description">
              Code scattered across text files, notes apps, and old projects with no organization.
            </p>
          </div>
          
          <div className="problem-card">
            <div className="problem-icon">
              <span>✕</span>
            </div>
            <h3 className="problem-card-title">Lost Knowledge</h3>
            <p className="problem-card-description">
              Teams lose valuable knowledge when members leave. No centralized knowledge base.
            </p>
          </div>
          
          <div className="problem-card">
            <div className="problem-icon">
              <span>✕</span>
            </div>
            <h3 className="problem-card-title">Poor Organization</h3>
            <p className="problem-card-description">
              GitHub Gists lack proper organization. Note apps don't support code highlighting.
            </p>
          </div>
          
          <div className="problem-card">
            <div className="problem-icon">
              <span>✕</span>
            </div>
            <h3 className="problem-card-title">No Collaboration</h3>
            <p className="problem-card-description">
              Difficult to share knowledge with team members and build a shared code library.
            </p>
          </div>
        </div>
      </div>
      
      <div className="solution-section">
        <h2 className="solution-title">The CodeVault Solution</h2>
        <p className="solution-description">
          A centralized platform to save, search, and share code snippets
          with your team.
        </p>
        
        <div className="solution-grid">
          <div className="solution-card">
            <div className="solution-icon">
              <span>✓</span>
            </div>
            <h3 className="solution-card-title">Centralized Storage</h3>
            <p className="solution-card-description">
              All snippets in one place with intelligent tagging and categorization.
            </p>
          </div>
          
          <div className="solution-card">
            <div className="solution-icon">
              <span>✓</span>
            </div>
            <h3 className="solution-card-title">Team Knowledge Base</h3>
            <p className="solution-card-description">
              Build a shared library of solutions that grows with your team.
            </p>
          </div>
          
          <div className="solution-card">
            <div className="solution-icon">
              <span>✓</span>
            </div>
            <h3 className="solution-card-title">Beautiful Formatting</h3>
            <p className="solution-card-description">
              Syntax highlighting for 100+ languages with clean, readable code display.
            </p>
          </div>
          
          <div className="solution-card">
            <div className="solution-icon">
              <span>✓</span>
            </div>
            <h3 className="solution-card-title">Easy Sharing</h3>
            <p className="solution-card-description">
              Share snippets with team members or make them public to help others.
            </p>
          </div>
        </div>
      </div>
      
      <div className="features-section">
        <h2 className="features-title">Powerful Features</h2>
        <p className="features-description">
          Everything you need to manage, organize, and share your code
          snippets efficiently.
        </p>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <span>&lt;/&gt;</span>
            </div>
            <h3 className="feature-card-title">Smart Code Storage</h3>
            <p className="feature-card-description">
              Save and organize all your code snippets in one centralized location with intelligent tagging and organization.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <span>🔍</span>
            </div>
            <h3 className="feature-card-title">Powerful Search</h3>
            <p className="feature-card-description">
              Find exactly what you need with advanced search, filtering, and categorization across all your snippets.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <span>⚡</span>
            </div>
            <h3 className="feature-card-title">Syntax Highlighting</h3>
            <p className="feature-card-description">
              Beautiful code formatting with support for 100+ programming languages using Prism.js.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <span>🔗</span>
            </div>
            <h3 className="feature-card-title">Easy Sharing</h3>
            <p className="feature-card-description">
              Share snippets with team members or make them public to help others with common solutions.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <span>👥</span>
            </div>
            <h3 className="feature-card-title">Team Collaboration</h3>
            <p className="feature-card-description">
              Work together with your team, share knowledge, and build a company-wide code knowledge base.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <span>🔒</span>
            </div>
            <h3 className="feature-card-title">Secure & Private</h3>
            <p className="feature-card-description">
              Your code is encrypted and secure. Control access with granular permissions and privacy settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;