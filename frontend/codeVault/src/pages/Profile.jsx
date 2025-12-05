import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import { API_BASE_URL } from '../config/api.js';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          navigate('/sign-in');
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        setFormData({
          name: data.data.name || '',
          email: data.data.email || ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to update profile');
        setSaving(false);
        return;
      }

      if (data.success) {
        setUser(data.data);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Server unreachable. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      // Even if logout fails, redirect to home
      navigate('/');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || ''
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p className="error-message">Failed to load profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>Profile</h1>
          {!isEditing && (
            <button 
              className="btn-edit"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>

        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="profile-content">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div className="avatar-info">
              <h2>{user.name || 'User'}</h2>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="profile-details">
            {isEditing ? (
              <>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="btn-save"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="detail-item">
                  <label>Full Name</label>
                  <p>{user.name || 'Not set'}</p>
                </div>

                <div className="detail-item">
                  <label>Email Address</label>
                  <p>{user.email}</p>
                </div>

                <div className="detail-item">
                  <label>Member Since</label>
                  <p>{new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="profile-actions">
          <button
            className="btn-logout"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

