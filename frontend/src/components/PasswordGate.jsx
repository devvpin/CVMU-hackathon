import { useState } from "react";
import { reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";

/**
 * PasswordGate — verifies the user's Firebase login password before allowing an action.
 * Props:
 *   title    – heading shown in the gate (optional)
 *   onSuccess – called when password is confirmed
 *   onCancel  – called when user dismisses/cancels
 */
const PasswordGate = ({ title = "Password Required", onSuccess, onCancel }) => {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const user = auth.currentUser;
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);
            onSuccess();
        } catch {
            setError("Incorrect password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal card glass-panel" style={{ maxWidth: "420px", width: "90%" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "2rem" }}>🔒</div>
                    <h3 style={{ margin: 0 }}>{title}</h3>
                    <p className="text-muted" style={{ margin: 0, textAlign: "center", fontSize: "0.9rem" }}>
                        Enter your login password to continue.
                    </p>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Password</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Your login password"
                                required
                                autoFocus
                                style={{ paddingRight: "2.8rem" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute",
                                    right: "0.75rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "inherit",
                                    padding: 0,
                                    display: "flex",
                                    alignItems: "center",
                                }}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                        {error && (
                            <p style={{ color: "var(--danger, #e74c3c)", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-text text-danger-btn" onClick={onCancel}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "Verifying…" : "Unlock"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordGate;
