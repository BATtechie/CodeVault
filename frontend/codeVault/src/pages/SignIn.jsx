import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../config/api.js';
import useAuth from '../hooks/useAuth.js';
import './SignIn.css';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SNIPPET_CREATION_ROUTE = '/dashboard?create=1';

const SignIn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(location.state?.mode !== 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const postAuthRoute =
    location.state?.from && location.state.from !== '/dashboard'
      ? location.state.from
      : SNIPPET_CREATION_ROUTE;

  useEffect(() => {
    if (user) {
      navigate(postAuthRoute, { replace: true });
    }
  }, [navigate, postAuthRoute, user]);

  const resetForMode = (nextIsLogin) => {
    setIsLogin(nextIsLogin);
    setError('');
    setTwoFactorRequired(false);
    setTwoFactorCode('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!emailPattern.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    if (isLogin) {
      if (!password) {
        setError('Enter your password to continue.');
        return;
      }
    } else {
      if (!fullName.trim()) {
        setError('Full name is required.');
        return;
      }

      if (password.length < 8) {
        setError('Choose a password with at least 8 characters.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (isLogin) {
        const response = await login({
          email,
          password,
          rememberMe,
          twoFactorCode: twoFactorRequired ? twoFactorCode : undefined,
        });

        if (response.data?.twoFactorRequired) {
          setTwoFactorRequired(true);
          setError('');
        } else {
          navigate(postAuthRoute, { replace: true });
        }
      } else {
        await signup({
          name: fullName,
          email,
          password,
          rememberMe,
        });
        navigate(SNIPPET_CREATION_ROUTE, { replace: true });
      }
    } catch (submitError) {
      setError(
        getErrorMessage(
          submitError,
          isLogin ? 'Unable to sign in right now.' : 'Unable to create your account right now.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="signin-v2">
      <section className="signin-v2__hero">
        <span className="signin-v2__pill">Secure code knowledge</span>
        <h1>Make your best snippets findable, shareable, and reviewable.</h1>
        <p>
          CodeVault keeps code snippets organized with team permissions, fuzzy search, comments,
          notifications, and optional two-factor authentication.
        </p>

        <div className="signin-v2__feature">
          <ShieldCheck size={18} />
          <span>JWT sessions, httpOnly cookies, remember-me support, and 2FA setup.</span>
        </div>
      </section>

      <section className="signin-v2__panel">
        <div className="signin-v2__toggle">
          <button
            type="button"
            className={isLogin ? 'is-active' : ''}
            onClick={() => resetForMode(true)}
          >
            Log in
          </button>
          <button
            type="button"
            className={!isLogin ? 'is-active' : ''}
            onClick={() => resetForMode(false)}
          >
            Create account
          </button>
        </div>

        <div className="signin-v2__heading">
          <h2>{isLogin ? 'Welcome back' : 'Start your vault'}</h2>
          <p>
            {isLogin
              ? 'Continue into your workspace and pick up where you left off.'
              : 'Create a secure home for personal snippets and team-shared patterns.'}
          </p>
        </div>

        {error ? <div className="signin-v2__error">{error}</div> : null}

        <form className="signin-v2__form" onSubmit={handleSubmit}>
          {!isLogin ? (
            <label>
              <span>Full Name</span>
              <input
                type="text"
                placeholder="Your name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </label>
          ) : null}

          <label>
            <span>Email address</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="signin-v2__password">
            <span>Password</span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button type="button" onClick={() => setShowPassword((current) => !current)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </label>

          {!isLogin ? (
            <label className="signin-v2__password">
              <span>Confirm password</span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>
          ) : null}

          {twoFactorRequired ? (
            <label>
              <span>Two-factor code</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="123456 or a backup code"
                value={twoFactorCode}
                onChange={(event) => setTwoFactorCode(event.target.value)}
              />
            </label>
          ) : null}

          <label className="signin-v2__check">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span>Remember me on this device</span>
          </label>

          <button type="submit" className="signin-v2__submit" disabled={submitting}>
            {submitting
              ? 'Working...'
              : isLogin
                ? twoFactorRequired
                  ? 'Verify and continue'
                  : 'Log in'
                : 'Create account'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default SignIn;
