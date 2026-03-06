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
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import "./Layout.css";

const Layout = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navItems = [
    { path: "/dashboard", icon: <FiHome />, label: "Home" },
    { path: "/transactions", icon: <FiList />, label: "Transactions" },
    { path: "/budgets", icon: <FiPieChart />, label: "Budgets" },
    { path: "/profile", icon: <FiUser />, label: "Profile" },
  ];

  return (
    <div className="layout-container">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-header-left">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <h2>
            💰 Money<span className="text-accent">Mate</span>
          </h2>
        </div>
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <FiSun /> : <FiMoon />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar (also used as slide-in on mobile) */}
      <aside className={`sidebar card glass-panel ${sidebarOpen ? "sidebar-open" : ""}`}>
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
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
            >
              {item.icon} <span>{item.label}</span>
            </Link>
          ))}
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

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${location.pathname === item.path ? "active" : ""}`}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        ))}
        <button className="bottom-nav-item logout-nav-item" onClick={handleLogout}>
          <span className="bottom-nav-icon"><FiLogOut /></span>
          <span className="bottom-nav-label">Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
