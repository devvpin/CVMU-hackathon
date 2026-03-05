import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import "./Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch {
      setError("That email/password combo didn't work. Mind trying again?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Decoration Panel */}
      <div className="auth-background">
        <div className="auth-background-content">
          <h1>Welcome to MoneyMate</h1>
          <p>The smartest and simplest way to manage your personal finances, track your budgets, and achieve your goals.</p>
        </div>
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-wrapper">
        <div className="auth-card fade-in">
          <div className="auth-logo">
            <div className="logo-icon">💰</div>
            <h2>Money<span className="text-accent">Mate</span></h2>
          </div>

          <div className="auth-header">
            <h3>Welcome back! 👋</h3>
            <p>Log in to manage your finances</p>
          </div>

          {error && <div className="auth-error slide-down">{error}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-footer-link">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="btn-primary btn-animated" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-footer">
            <p>
              New to MoneyMate? <Link to="/signup" className="highlight-link">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
