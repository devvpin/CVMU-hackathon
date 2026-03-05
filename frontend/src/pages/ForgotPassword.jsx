import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import "./Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch {
      setError("Couldn't find an account with that email. Double-check it?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <h2>Forgot your password? 🔐</h2>
          <p>No worries, it happens to the best of us!</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        
        {success ? (
          <div className="auth-success">
            <p>📧 Check your inbox! We've sent you a link to reset your password.</p>
            <p style={{ marginTop: "1rem", fontSize: "0.9rem", opacity: 0.8 }}>
              Didn't get it? Check your spam folder or try again.
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="auth-form">
            <div className="form-group">
              <label>What's your email?</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Remember it now? <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
