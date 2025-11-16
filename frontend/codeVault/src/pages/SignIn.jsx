// ...existing code...
import { useState, useEffect } from "react";
import "./SignIn.css";
import { Eye, EyeClosed } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (!isLogin && confirmPassword) {
      setPasswordMismatch(password !== confirmPassword);
    } else {
      setPasswordMismatch(false);
    }
  }, [password, confirmPassword, isLogin]);

  const handleSubmit = () => {
    setAuthError("");
    setLoading(true);

    if (isLogin) {
      if (!email.trim() || !password) {
        setAuthError("Please provide both email and password.");
        setLoading(false);
        return;
      }

      // Simulate successful sign in and navigate to dashboard
      setTimeout(() => {
        setLoading(false);
        navigate("/dashboard");
      }, 600);
    } else {
      if (passwordMismatch || !isEmailValid) {
        setAuthError("Please fix the highlighted issues before signing up.");
        setLoading(false);
        return;
      }

      if (!email.trim() || !password || !fullName.trim()) {
        setAuthError("Full name, email and password are required for sign up.");
        setLoading(false);
        return;
      }

      // Simulate successful sign up (no backend)
      setTimeout(() => {
        setLoading(false);
        alert("Account created. You can now sign in.");
        setIsLogin(true);
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }, 600);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
        <p className="subtext">
          {isLogin
            ? "Log in to access your dashboard"
            : "Sign up to start using the dashboard"}
        </p>

        <div className="auth-toggle">
          <div className={`slider ${isLogin ? "left" : "right"}`} />
          <button
            className={isLogin ? "active" : ""}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={!isLogin ? "active" : ""}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        {!isLogin && (
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              const value = e.target.value;
              setEmail(value);

              if (value.trim() === "") {
                setIsEmailValid(true);
              } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                setIsEmailValid(emailRegex.test(value));
              }
            }}
          />
          {email.trim() !== "" && !isEmailValid && (
            <p className="warning-text">Enter a valid email address</p>
          )}
        </div>

        <div className="form-group password-input">
          <label>Password</label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="eye-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? <Eye size={18} /> : <EyeClosed size={18} />}
          </button>
        </div>

        {!isLogin && (
          <div className="form-group password-input">
            <label>Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              className="eye-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <Eye size={18} /> : <EyeClosed size={18} />}
            </button>
          </div>
        )}
        {passwordMismatch && (
          <p className="warning-text">Passwords do not match</p>
        )}
        {authError && <p className="warning-text">{authError}</p>}

        <button
          className="signin-submit"
          disabled={loading || (!isLogin && (passwordMismatch || !isEmailValid))}
          onClick={handleSubmit}
        >
          {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
        </button>
      </div>
    </div>
  );
};

export default SignIn;
// ...existing code...