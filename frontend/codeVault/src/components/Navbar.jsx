import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { Link, useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Re-check auth when location changes (e.g., after login)
    checkAuth();
  }, [location.pathname]);

  const checkAuth = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 
        (import.meta.env.PROD ? 'https://your-backend.onrender.com' : 'http://localhost:3000');

      const res = await fetch(`${backendUrl}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsAuthenticated(true);
          setUser(data.data);
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 
        (import.meta.env.PROD ? 'https://your-backend.onrender.com' : 'http://localhost:3000');

      await fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      navigate('/');
    }
  };

  const handleLoginClick = () => {
    navigate('/sign-in', { state: { mode: 'login' } });
  };

  const handleSignUpClick = () => {
    navigate('/sign-in', { state: { mode: 'signup' } });
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  if (checkingAuth) {
    return null; // Don't show navbar while checking auth
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="logo-icon">
              <span>&lt;/&gt;</span>
            </div>
            <span className="logo-text">CodeVault</span>
          </Link>
        </div>
        
        <div className="navbar-links">
          <Link 
            to="/" 
            className={isActive('/') ? 'nav-link active' : 'nav-link'}
          >
            Home
          </Link>
          <Link 
            to="/snippets" 
            className={isActive('/snippets') ? 'nav-link active' : 'nav-link'}
          >
            Snippets
          </Link>
          <Link 
            to="/dashboard" 
            className={isActive('/dashboard') ? 'nav-link active' : 'nav-link'}
          >
            Dashboard
          </Link>
        </div>
        
        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <div className="user-avatar-nav" title={user?.name || user?.email || 'User'}>
                {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
              </div>
              <button className="btn-logout-nav" onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <button className="btn-login" onClick={handleLoginClick}>Login</button>
              <button className="btn-signup" onClick={handleSignUpClick}>Sign Up</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;