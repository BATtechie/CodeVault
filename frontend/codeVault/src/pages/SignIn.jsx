import { useState, useEffect } from "react";
import "./SignIn.css";
import { Eye, EyeClosed } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../config/api.js";

const SignIn = () => {
  const location = useLocation();
  const initialMode = location.state?.mode === 'signup' ? false : true;
  const [isLogin, setIsLogin] = useState(initialMode);
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

  const handleSubmit = async () => {
    setAuthError("");
    setLoading(true);

    if (isLogin) {
      if (!email.trim() || !password) {
        setAuthError("Please provide both email and password.");
        setLoading(false);
        return;
      }

      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        console.log("Backend URL:", API_BASE_URL);
        console.log("Environment:", import.meta.env.MODE);

        const res = await fetch(
          `${API_BASE_URL}/api/auth/login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!res.ok) {
          let errorMessage = "Invalid email or password. Please try again.";
          try {
            const data = await res.json();
            errorMessage = data.message || errorMessage;
          } catch {
            // If response is not JSON, use status-based messages
            if (res.status === 401) {
              errorMessage = "Invalid email or password. Please try again.";
            } else if (res.status === 500) {
              errorMessage = "Server error. Please try again later.";
            } else if (res.status === 0 || res.status >= 500) {
              errorMessage = "Server is not responding. Please check if the server is running.";
            }
          }
          setAuthError(errorMessage);
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (data.success) {
          // Store token in localStorage as fallback for production
          if (data.data && data.data.token) {
            localStorage.setItem('authToken', data.data.token);
          }
          navigate("/dashboard");
        } else {
          setAuthError(data.message || "Login failed. Please try again.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Login error:", err);
        clearTimeout(timeoutId);
        
        if (err.name === 'AbortError') {
          setAuthError(`Request timed out. The server at ${API_BASE_URL} is taking too long to respond.`);
        } else if (err.name === 'TypeError' && (err.message.includes('fetch') || err.message.includes('Failed to fetch'))) {
          setAuthError(`Cannot connect to server at ${API_BASE_URL}. Please check if the server is running and accessible.`);
        } else {
          setAuthError("Network error. Please check your connection and try again.");
        }
        setLoading(false);
        return;
      }
    }


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

    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      console.log("Backend URL:", API_BASE_URL);
      console.log("Environment:", import.meta.env.MODE);

      const res = await fetch(
        `${API_BASE_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({
            name: fullName,
            email,
            password,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!res.ok) {
        let errorMessage = "Signup failed. Please try again.";
        try {
          const data = await res.json();
          if (data.message) {
            // Handle specific error cases
            if (data.message.includes('already exists') || res.status === 409) {
              errorMessage = "An account with this email already exists. Please sign in instead.";
            } else {
              errorMessage = data.message;
            }
          }
        } catch {
          // If response is not JSON, use status-based messages
          if (res.status === 409) {
            errorMessage = "An account with this email already exists. Please sign in instead.";
          } else if (res.status === 400) {
            errorMessage = "Invalid information. Please check your inputs.";
          } else if (res.status === 500) {
            errorMessage = "Server error. Please try again later.";
          } else if (res.status === 0 || res.status >= 500) {
            errorMessage = "Server is not responding. Please check if the server is running.";
          }
        }
        setAuthError(errorMessage);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        // Store token in localStorage as fallback for production
        if (data.data && data.data.token) {
          localStorage.setItem('authToken', data.data.token);
        }
        alert("Account created successfully! You can now sign in.");
        setIsLogin(true);
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        setAuthError(data.message || "Signup failed. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Signup error:", err);
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
        setAuthError(`Request timed out. The server at ${API_BASE_URL} is taking too long to respond.`);
      } else if (err.name === 'TypeError' && (err.message.includes('fetch') || err.message.includes('Failed to fetch'))) {
        setAuthError(`Cannot connect to server at ${API_BASE_URL}. Please check if the server is running and accessible.`);
      } else {
        setAuthError("Network error. Please check your connection and try again.");
      }
      setLoading(false);
      return;
    }

    setLoading(false);
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
