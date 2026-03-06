import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { checkUsernameAvailability, createUserProfile } from "../api";
import "./Auth.css";

const Signup = () => {
  const [step, setStep] = useState(1); // Step 1: Account, Step 2: Profile

  // Account info
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Profile info
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: "" });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Debounced username check
  useEffect(() => {
    if (username.length < 3) {
      setUsernameStatus({ checking: false, available: null, message: "" });
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus({ checking: true, available: null, message: "Checking..." });
      try {
        const result = await checkUsernameAvailability(username);
        setUsernameStatus({
          checking: false,
          available: result.available,
          message: result.message
        });
      } catch {
        setUsernameStatus({
          checking: false,
          available: null,
          message: "Couldn't check - try again"
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleStep1 = (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Those passwords don't match - double-check them?");
    }

    if (password.length < 6) {
      return setError("Password needs to be at least 6 characters");
    }

    setStep(2);
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("Image size should be less than 5MB");
        return;
      }
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfilePicture = async (uid) => {
    if (!profilePicture) return null;

    try {
      const storageRef = ref(storage, `profile-pictures/${uid}`);
      await uploadBytes(storageRef, profilePicture);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      return null;
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || usernameStatus.available !== true) {
      return setError("Please choose a valid, available username");
    }

    if (!firstName.trim() || !lastName.trim()) {
      return setError("First name and last name are required");
    }

    setLoading(true);

    try {
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Upload profile picture if provided
      const profilePictureURL = await uploadProfilePicture(userCredential.user.uid);

      // Wait a moment for the auth state to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create user profile in Firestore
      await createUserProfile({
        username,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
        pincode: pincode.trim(),
        district: district.trim(),
        state: state.trim(),
        country: country.trim(),
        profilePictureURL: profilePictureURL || ""
      });

      navigate("/dashboard");
    } catch (err) {
      console.error("Signup error:", err);
      const apiError = err.response?.data?.error;
      const firebaseError = err.message;
      setError(`Signup failed: ${apiError || firebaseError || 'Something went wrong. Give it another shot!'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Decoration Panel */}
      <div className="auth-background">
        <div className="auth-background-content">
          <h1>Start Your Journey</h1>
          <p>Create an account to track your path to financial freedom.</p>
        </div>
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-wrapper">
        <div className="auth-card fade-in" style={{ maxWidth: step === 2 ? "560px" : "440px" }}>
          <div className="auth-logo">
            <div className="logo-icon">💰</div>
            <h2>Money<span className="text-accent">Mate</span></h2>
          </div>

          <div className="auth-header">
            <h3>{step === 1 ? "Create your account 🚀" : "Tell us about yourself 👤"}</h3>
            <p>{step === 1 ? "Start your financial journey today" : "Complete your profile setup"}</p>
            <div className="step-indicator">
              <span className={`step ${step >= 1 ? "active" : ""}`}>1</span>
              <span className="step-line"></span>
              <span className={`step ${step >= 2 ? "active" : ""}`}>2</span>
            </div>
          </div>

          {error && <div className="auth-error slide-down">{error}</div>}

          {step === 1 ? (
            <form onSubmit={handleStep1} className="auth-form">
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
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <button type="submit" className="btn-primary btn-animated">
                Continue →
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="auth-form signup-form">
              <div className="profile-picture-upload">
                <label htmlFor="profile-pic" className="profile-pic-label">
                  {profilePicturePreview ? (
                    <img src={profilePicturePreview} alt="Profile preview" className="profile-pic-preview" />
                  ) : (
                    <div className="profile-pic-placeholder">
                      <span className="upload-icon">📷</span>
                      <span className="upload-text">Add Photo</span>
                    </div>
                  )}
                </label>
                <input
                  id="profile-pic"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="profile-pic-input"
                />
                <span className="form-hint">Optional - Add a profile picture</span>
              </div>

              <div className="form-group">
                <label>Pick a username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  placeholder="cooluser123"
                  required
                  minLength="3"
                  maxLength="20"
                />
                {username.length >= 3 && (
                  <span className={`username-status ${usernameStatus.available === true ? "available" : usernameStatus.available === false ? "taken" : ""}`}>
                    {usernameStatus.checking ? "🔍 Checking..." : usernameStatus.message}
                  </span>
                )}
                <span className="form-hint">You can only change this once a year, so choose wisely!</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main Street, Apt 4B"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="380001"
                  />
                </div>
                <div className="form-group">
                  <label>District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Ahmedabad"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Gujarat"
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="India"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-animated"
                  disabled={loading || usernameStatus.available !== true}
                >
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login" className="highlight-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
