import { Bell, ChevronRight, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import './Navbar.css';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Community', to: '/snippets' },
  { label: 'Workspace', to: '/dashboard' },
];

const getInitials = (name, email) => {
  const source = name || email || 'U';
  return source
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    authLoading,
    user,
    notifications,
    unreadCount,
    logout,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="navbar-v2">
      <div className="navbar-v2__inner">
        <Link className="navbar-v2__brand" to="/">
          <span className="navbar-v2__brand-mark">&lt;/&gt;</span>
          <span>
            CodeVault
            <small>Build once. Find forever.</small>
          </span>
        </Link>

        <nav className="navbar-v2__links">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={location.pathname === link.to ? 'is-active' : ''}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="navbar-v2__actions">
          {authLoading ? null : user ? (
            <>
              <div className="navbar-v2__notification-wrap">
                <button
                  type="button"
                  className="navbar-v2__icon-button"
                  onClick={() => setNotificationsOpen((current) => !current)}
                >
                  <Bell size={18} />
                  {unreadCount > 0 ? <span className="navbar-v2__count">{unreadCount}</span> : null}
                </button>

                {notificationsOpen ? (
                  <div className="navbar-v2__panel">
                    <div className="navbar-v2__panel-header">
                      <div>
                        <strong>Notifications</strong>
                        <p>{unreadCount > 0 ? `${unreadCount} unread` : 'You’re caught up'}</p>
                      </div>
                      {notifications.length > 0 ? (
                        <button type="button" onClick={markAllNotificationsRead}>
                          Mark all read
                        </button>
                      ) : null}
                    </div>

                    <div className="navbar-v2__panel-list">
                      {notifications.length === 0 ? (
                        <p className="navbar-v2__panel-empty">
                          Comments, updates, and team activity will show up here.
                        </p>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            className={`navbar-v2__panel-item ${notification.readAt ? 'is-read' : ''}`}
                            onClick={() => markNotificationRead(notification.id)}
                          >
                            <strong>{notification.title}</strong>
                            <span>{notification.message}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <Link className="navbar-v2__profile" to="/profile">
                <span className="navbar-v2__avatar">{getInitials(user.name, user.email)}</span>
                <span>{user.name || user.email}</span>
              </Link>

              <button type="button" className="navbar-v2__ghost" onClick={handleLogout}>
                <LogOut size={16} />
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="navbar-v2__ghost"
                onClick={() => navigate('/sign-in', { state: { mode: 'login' } })}
              >
                Log in
              </button>
              <button
                type="button"
                className="navbar-v2__primary"
                onClick={() => navigate('/sign-in', { state: { mode: 'signup' } })}
              >
                Get started
                <ChevronRight size={16} />
              </button>
            </>
          )}

          <button
            type="button"
            className="navbar-v2__menu"
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="navbar-v2__mobile">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}

          {!authLoading && !user ? (
            <button
              type="button"
              className="navbar-v2__primary navbar-v2__primary--mobile"
              onClick={() => navigate('/sign-in', { state: { mode: 'signup' } })}
            >
              Create an account
            </button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;
