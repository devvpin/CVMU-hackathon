import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Expense from "./pages/Expense";
import Budgets from "./pages/Budgets";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import AiCoach from "./pages/AiCoach";
import SplitBills from "./pages/SplitBills";
import Layout from "./components/Layout";
import { ThemeProvider } from "./context/ThemeContext";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="full-page-loader">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="app-container">
          <Routes>
            <Route
              path="/login"
              element={!user ? <Login /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/signup"
              element={!user ? <Signup /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/forgot-password"
              element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" />}
            />

            <Route
              path="/"
              element={user ? <Layout user={user} /> : <Navigate to="/login" />}
            >
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard user={user} />} />
              <Route path="income" element={<Income user={user} />} />
              <Route path="expense" element={<Expense user={user} />} />
              <Route path="budgets" element={<Budgets user={user} />} />
              <Route path="split-bills" element={<SplitBills />} />
              <Route path="reports" element={<Reports />} />
              <Route path="ai" element={<AiCoach />} />
              <Route path="profile" element={<Profile user={user} />} />
            </Route>

            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
