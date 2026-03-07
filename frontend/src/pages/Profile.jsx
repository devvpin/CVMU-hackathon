import { useState, useEffect } from "react";
import { getUserProfile, updateUsername, updateUserProfile } from "../api";
import { updateEmail } from "firebase/auth";
import { auth } from "../firebase";

import { FiEdit2, FiSave, FiX, FiCamera } from "react-icons/fi";
import "./Profile.css";

const Profile = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Editable fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
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

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getUserProfile();
      setProfile(data);
      // Initialize form fields
      setFirstName(data.firstName || "");
      setLastName(data.lastName || "");
      setMobile(data.mobile || "");
      setAddress(data.address || "");
      setPincode(data.pincode || "");
      setDistrict(data.district || "");
      setState(data.state || "");
      setCountry(data.country || "");
      setProfilePicturePreview(data.profilePictureURL || "");
      setUsername(data.displayUsername || "");
      setEmail(user?.email || "");
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
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

  const uploadProfilePicture = async () => {
    if (!profilePicture) return profile.profilePictureURL || "";

    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      const objectUrl = URL.createObjectURL(profilePicture);

      img.onload = () => {
        const MAX = 200;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(profile.profilePictureURL || "");
      };
      img.src = objectUrl;
    });
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Check username change
      if (username !== profile.displayUsername) {
        if (username.length < 3) {
          setError("Username must be at least 3 characters");
          setLoading(false);
          return;
        }
        await updateUsername(username);
      }

      // Update email
      if (email !== user.email) {
        try {
          await updateEmail(auth.currentUser, email);
        } catch (authError) {
          console.error("Email update error:", authError);
          throw new Error("To change your email, please log out and log in again first.");
        }
      }

      // Upload new profile picture if changed
      const profilePictureURL = await uploadProfilePicture();

      // Update profile via API
      await updateUserProfile({
        firstName,
        lastName,
        mobile,
        address,
        pincode,
        district,
        state,
        country,
        profilePictureURL,
      });

      setSuccess("Profile updated successfully!");
      setEditing(false);
      await fetchProfile();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setFirstName(profile.firstName || "");
    setLastName(profile.lastName || "");
    setMobile(profile.mobile || "");
    setAddress(profile.address || "");
    setPincode(profile.pincode || "");
    setDistrict(profile.district || "");
    setState(profile.state || "");
    setCountry(profile.country || "");
    setProfilePicturePreview(profile.profilePictureURL || "");
    setUsername(profile.displayUsername || "");
    setEmail(user?.email || "");
    setProfilePicture(null);
    setEditing(false);
    setError("");
  };

  if (loading && !profile) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        {!editing ? (
          <button className="btn-primary" onClick={() => setEditing(true)}>
            <FiEdit2 /> Edit Profile
          </button>
        ) : (
          <div className="edit-actions">
            <button className="btn-secondary text-danger-btn" onClick={handleCancel}>
              <FiX /> Cancel
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={loading}>
              <FiSave /> {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="profile-content">
        <div className="profile-card glass-panel">
          <div className="profile-picture-section">
            <div className="profile-picture-large">
              {profilePicturePreview ? (
                <img src={profilePicturePreview} alt="Profile" />
              ) : (
                <div className="profile-placeholder">
                  {profile?.firstName?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {editing && (
              <label htmlFor="profile-pic-edit" className="change-photo-btn">
                <FiCamera /> Change Photo
                <input
                  id="profile-pic-edit"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  style={{ display: "none" }}
                />
              </label>
            )}
          </div>

          <div className="profile-info">
            <div className="form-group full-width">
              <label>Username</label>
              {editing ? (
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  className="form-input"
                />
              ) : (
                <div className="info-value">
                  {profile?.displayUsername}
                  <span className="info-hint" style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)" }}>Can be changed once per year</span>
                </div>
              )}
            </div>

            <div className="form-group full-width">
              <label>Email</label>
              {editing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                />
              ) : (
                <div className="info-value">{user?.email}</div>
              )}
            </div>
          </div>
        </div>

        <div className="profile-card glass-panel">
          <h2>Personal Information</h2>

          <div className="form-grid">
            <div className="form-group">
              <label>First Name</label>
              {editing ? (
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="form-input"
                />
              ) : (
                <div className="info-value">{firstName}</div>
              )}
            </div>

            <div className="form-group">
              <label>Last Name</label>
              {editing ? (
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="form-input"
                />
              ) : (
                <div className="info-value">{lastName}</div>
              )}
            </div>

            <div className="form-group full-width">
              <label>Mobile Number</label>
              {editing ? (
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="form-input"
                  placeholder="+91 98765 43210"
                />
              ) : (
                <div className="info-value">{mobile || "Not provided"}</div>
              )}
            </div>

            <div className="form-group full-width">
              <label>Address</label>
              {editing ? (
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="form-input"
                  placeholder="Street address"
                />
              ) : (
                <div className="info-value">{address || "Not provided"}</div>
              )}
            </div>

            <div className="form-group">
              <label>Pincode</label>
              {editing ? (
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="form-input"
                />
              ) : (
                <div className="info-value">{pincode || "Not provided"}</div>
              )}
            </div>

            <div className="form-group">
              <label>District</label>
              {editing ? (
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="form-input"
                />
              ) : (
                <div className="info-value">{district || "Not provided"}</div>
              )}
            </div>

            <div className="form-group">
              <label>State</label>
              {editing ? (
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="form-input"
                />
              ) : (
                <div className="info-value">{state || "Not provided"}</div>
              )}
            </div>

            <div className="form-group">
              <label>Country</label>
              {editing ? (
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="form-input"
                />
              ) : (
                <div className="info-value">{country || "Not provided"}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
