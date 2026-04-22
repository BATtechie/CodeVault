import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api.js';

const ProtectedRoute = ({ children }) => {
  const [status, setStatus] = useState('loading'); // loading | authed | unauthed

  useEffect(() => {
    let alive = true;

    const check = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!alive) return;
        setStatus(res.ok ? 'authed' : 'unauthed');
      } catch {
        if (!alive) return;
        setStatus('unauthed');
      }
    };

    check();

    return () => {
      alive = false;
    };
  }, []);

  if (status === 'loading') return null;
  if (status === 'unauthed') return <Navigate to="/sign-in" replace />;

  return children;
};

export default ProtectedRoute;

