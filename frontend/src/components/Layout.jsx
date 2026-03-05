import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { getUserProfile } from "../api";
import {
  FiHome,
  FiPieChart,
  FiList,
  FiLogOut,
  FiSun,
  FiMoon,
  FiUser,
} from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import "./Layout.css";

const Layout = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfile(data);
      } catch (err) {
        console.error("Could not fetch profile:", err);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="layout-container">
      <aside className="sidebar card glass-panel">
        <div className="brand flex-between">
          <h2>
            💰 Money<span className="text-accent">Mate</span>
          </h2>
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <FiSun /> : <FiMoon />}
          </button>
        </div>

        <nav className="nav-menu">
          <Link
            to="/dashboard"
            className={`nav-link ${location.pathname === "/dashboard" ? "active" : ""}`}
          >
            <FiHome /> <span>Home</span>
          </Link>
          <Link
            to="/transactions"
            className={`nav-link ${location.pathname === "/transactions" ? "active" : ""}`}
          >
            <FiList /> <span>Transactions</span>
          </Link>
          <Link
            to="/budgets"
            className={`nav-link ${location.pathname === "/budgets" ? "active" : ""}`}
          >
            <FiPieChart /> <span>Budgets</span>
          </Link>
          <Link
            to="/profile"
            className={`nav-link ${location.pathname === "/profile" ? "active" : ""}`}
          >
            <FiUser /> <span>Profile</span>
          </Link>
        </nav>

        <div className="user-section">
          <div className="user-info">
            <div className="avatar">
              {profile?.profilePictureURL ? (
                <img src={profile.profilePictureURL} alt="Profile" className="avatar-img" />
              ) : (
                profile?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="email">Hey, {profile?.displayUsername || profile?.firstName || user?.email?.split("@")[0]}!</div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <FiLogOut /> <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
