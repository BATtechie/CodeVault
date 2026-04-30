import { ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../config/api.js';
import useAuth from '../hooks/useAuth.js';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const {
    user,
    summary,
    updateProfile,
    logout,
    setupTwoFactor,
    enableTwoFactor,
    disableTwoFactor,
  } = useAuth();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    rememberMeDefault: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [twoFactorSetup, setTwoFactorSetup] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setFormState({
        name: user.name || '',
        email: user.email || '',
        rememberMeDefault: user.rememberMeDefault ?? true,
      });
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const initials = (user.name || user.email)
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(formState);
      setSuccess('Profile updated successfully.');
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Unable to update your profile right now.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSetupTwoFactor = async () => {
    setError('');
    setSuccess('');
    setTwoFactorBusy(true);

    try {
      const data = await setupTwoFactor();
      setTwoFactorSetup(data);
      setSuccess('Two-factor setup generated. Verify one code to enable it.');
    } catch (setupError) {
      setError(getErrorMessage(setupError, 'Unable to start two-factor setup right now.'));
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const handleEnableTwoFactor = async () => {
    setError('');
    setSuccess('');
    setTwoFactorBusy(true);

    try {
      await enableTwoFactor(twoFactorCode);
      setTwoFactorSetup(null);
      setTwoFactorCode('');
      setSuccess('Two-factor authentication enabled.');
    } catch (setupError) {
      setError(getErrorMessage(setupError, 'Unable to enable two-factor authentication.'));
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    setError('');
    setSuccess('');
    setTwoFactorBusy(true);

    try {
      await disableTwoFactor(twoFactorCode);
      setTwoFactorCode('');
      setTwoFactorSetup(null);
      setSuccess('Two-factor authentication disabled.');
    } catch (disableError) {
      setError(getErrorMessage(disableError, 'Unable to disable two-factor authentication.'));
    } finally {
      setTwoFactorBusy(false);
    }
  };

  return (
    <div className="profile-v2">
      <section className="profile-v2__hero">
        <div className="profile-v2__identity">
          <div className="profile-v2__avatar">{initials}</div>
          <div>
            <span className="profile-v2__pill">Account</span>
            <h1>{user.name || 'CodeVault user'}</h1>
            <p>{user.email}</p>
          </div>
        </div>

        <div className="profile-v2__summary">
          <div>
            <strong>{summary?.snippetCount ?? 0}</strong>
            <span>Snippets saved</span>
          </div>
          <div>
            <strong>{summary?.teamCount ?? 0}</strong>
            <span>Team memberships</span>
          </div>
          <div>
            <strong>{summary?.unreadNotifications ?? 0}</strong>
            <span>Unread alerts</span>
          </div>
        </div>
      </section>

      <div className="profile-v2__layout">
        <section className="profile-v2__card">
          <div className="profile-v2__card-header">
            <UserRound size={18} />
            <div>
              <h2>Profile details</h2>
              <p>Keep your identity and session defaults up to date.</p>
            </div>
          </div>

          {error ? <div className="profile-v2__error">{error}</div> : null}
          {success ? <div className="profile-v2__success">{success}</div> : null}

          <form className="profile-v2__form" onSubmit={handleSave}>
            <label>
              <span>Full name</span>
              <input
                type="text"
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>

            <label>
              <span>Email address</span>
              <input
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, email: event.target.value }))
                }
              />
            </label>

            <label className="profile-v2__check">
              <input
                type="checkbox"
                checked={formState.rememberMeDefault}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    rememberMeDefault: event.target.checked,
                  }))
                }
              />
              <span>Remember me by default on trusted devices</span>
            </label>

            <div className="profile-v2__actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                className="is-secondary"
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
              >
                Log out
              </button>
            </div>
          </form>
        </section>

        <section className="profile-v2__card">
          <div className="profile-v2__card-header">
            <ShieldCheck size={18} />
            <div>
              <h2>Security</h2>
              <p>Enable stronger sign-in protection and keep recovery codes close.</p>
            </div>
          </div>

          <div className="profile-v2__security-status">
            <strong>{user.twoFactorEnabled ? 'Two-factor enabled' : 'Two-factor disabled'}</strong>
            <span>
              {user.twoFactorEnabled
                ? 'Your account currently requires a verification code at sign-in.'
                : 'Add an authenticator app for extra account protection.'}
            </span>
          </div>

          {twoFactorSetup ? (
            <div className="profile-v2__setup">
              <p>
                Add this secret to your authenticator app, then enter one 6-digit code to enable
                two-factor authentication.
              </p>
              <code>{twoFactorSetup.secret}</code>
              <div className="profile-v2__backup">
                {twoFactorSetup.backupCodes.map((backupCode) => (
                  <span key={backupCode}>{backupCode}</span>
                ))}
              </div>
            </div>
          ) : null}

          <label>
            <span>Verification code</span>
            <input
              type="text"
              placeholder="123456 or backup code"
              value={twoFactorCode}
              onChange={(event) => setTwoFactorCode(event.target.value)}
            />
          </label>

          <div className="profile-v2__actions">
            {!user.twoFactorEnabled ? (
              <>
                <button type="button" className="is-secondary" onClick={handleSetupTwoFactor}>
                  {twoFactorBusy ? 'Working...' : 'Generate setup'}
                </button>
                <button type="button" onClick={handleEnableTwoFactor} disabled={twoFactorBusy}>
                  Enable 2FA
                </button>
              </>
            ) : (
              <button type="button" onClick={handleDisableTwoFactor} disabled={twoFactorBusy}>
                {twoFactorBusy ? 'Working...' : 'Disable 2FA'}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
