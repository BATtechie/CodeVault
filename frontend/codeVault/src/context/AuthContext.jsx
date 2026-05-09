import { useEffect, useState } from 'react';
import { apiRequest, ApiError } from '../config/api.js';
import AuthContext from './auth-context.js';

const clearAuthState = (setters) => {
  setters.setUser(null);
  setters.setSummary(null);
  setters.setNotifications([]);
  setters.setUnreadCount(0);
};

const normalizeSessionPayload = (response) => {
  const data = response?.data;

  if (!data) {
    return {
      user: null,
      summary: null,
    };
  }

  if (data.user) {
    return {
      user: data.user,
      summary: data.summary || null,
    };
  }

  return {
    user: data,
    summary: null,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [authLoading, setAuthLoading] = useState(true);

  const refreshNotifications = async () => {
    try {
      const response = await apiRequest('/api/notifications?limit=6');
      setNotifications(response.data || []);
      setUnreadCount(response.meta?.unreadCount || 0);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAuthState({ setUser, setSummary, setNotifications, setUnreadCount });
      }
    }
  };

  const refreshSession = async () => {
    try {
      const response = await apiRequest('/api/auth/me');
      const session = normalizeSessionPayload(response);

      setUser(session.user);
      setSummary(session.summary);
      setAuthLoading(false);
      return session.user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAuthState({ setUser, setSummary, setNotifications, setUnreadCount });
        setAuthLoading(false);
        return null;
      }

      setAuthLoading(false);
      throw error;
    }
  };

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const currentUser = await refreshSession();

        if (active && currentUser) {
          const notificationsResponse = await apiRequest('/api/notifications?limit=6');

          if (!active) {
            return;
          }

          setNotifications(notificationsResponse.data || []);
          setUnreadCount(notificationsResponse.meta?.unreadCount || 0);
        }
      } catch {
        if (active) {
          setAuthLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const login = async (payload) => {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.data?.twoFactorRequired) {
      return response;
    }

    await refreshSession();
    await refreshNotifications();
    return response;
  };

  const signup = async (payload) => {
    const response = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    await refreshSession();
    await refreshNotifications();
    return response;
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      clearAuthState({ setUser, setSummary, setNotifications, setUnreadCount });
    }
  };

  const updateProfile = async (payload) => {
    const response = await apiRequest('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    const session = normalizeSessionPayload(response);

    setUser(session.user);
    setSummary(session.summary);
    await refreshSession();
    return session.user;
  };

  const setupTwoFactor = async () => {
    const response = await apiRequest('/api/auth/2fa/setup', {
      method: 'POST',
    });

    return response.data;
  };

  const enableTwoFactor = async (code) => {
    const response = await apiRequest('/api/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });

    setUser(response.data.user);
    await refreshSession();
    return response.data.user;
  };

  const disableTwoFactor = async (code) => {
    const response = await apiRequest('/api/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });

    setUser(response.data.user);
    await refreshSession();
    return response.data.user;
  };

  const markNotificationRead = async (notificationId) => {
    await apiRequest(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });

    let decremented = false;

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              readAt:
                notification.readAt ||
                (() => {
                  decremented = true;
                  return new Date().toISOString();
                })(),
            }
          : notification,
      ),
    );

    if (decremented) {
      setUnreadCount((current) => Math.max(0, current - 1));
    }
  };

  const markAllNotificationsRead = async () => {
    await apiRequest('/api/notifications/read-all', {
      method: 'PATCH',
    });

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        readAt: notification.readAt || new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        authLoading,
        user,
        summary,
        notifications,
        unreadCount,
        login,
        signup,
        logout,
        refreshSession,
        updateProfile,
        refreshNotifications,
        setupTwoFactor,
        enableTwoFactor,
        disableTwoFactor,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
