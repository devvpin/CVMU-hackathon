import { useState, useEffect } from "react";
import { FiDollarSign, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api, { aiGetInsights } from "../api";
import "./Dashboard.css";
import { FiCpu } from "react-icons/fi";

const Dashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    balance: 0,
    totalIncome: 0,
    totalExpense: 0,
    categoryBreakdown: [],
  });
  const [totalWalletBalance, setTotalWalletBalance] = useState(0);

  const [monthlyData, setMonthlyData] = useState([]);
  const [aiInsight, setAiInsight] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch Aggregated Summary
        const summaryRes = await api.get("/reports/summary");
        const data = summaryRes.data;

        // Convert categoryBreakdown object to array for PieChart
        const formattedBreakdown = Object.keys(data.categoryBreakdown).map(
          (key) => ({
            name: key,
            value: data.categoryBreakdown[key],
          }),
        );

        setSummary({
          balance: data.balance,
          totalIncome: data.totalIncome,
          totalExpense: data.totalExpense,
          categoryBreakdown: formattedBreakdown,
        });

        // 2. Fetch all transactions to build the monthly trend BarChart
        const [transRes, walletsRes] = await Promise.all([
          api.get("/transactions"),
          api.get("/wallets")
        ]);
        const transactions = transRes.data;
        const totalW = walletsRes.data.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
        setTotalWalletBalance(totalW);

        // Group by month
        const monthlyMap = {};
        transactions.forEach((t) => {
          // Get 'YYYY-MM'
          const monthKey = t.date.slice(0, 7);
          if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = { name: monthKey, income: 0, expense: 0 };
          }
          if (t.type === "income") {
            monthlyMap[monthKey].income += t.amount;
          } else {
            monthlyMap[monthKey].expense += t.amount;
          }
        });

        // Convert map to sorted array (oldest to newest)
        const formattedMonthly = Object.values(monthlyMap).sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        // Optional: slice to keep only last 6 months so chart doesn't crowd
        setMonthlyData(formattedMonthly.slice(-6));

        // Fetch budgets
        let budgets = [];
        try {
          const budgetsRes = await api.get("/budgets");
          budgets = budgetsRes.data;
        } catch (e) {
          console.error("Could not fetch budgets", e);
        }

        // Fetch AI Insight
        try {
          const aiResponse = await aiGetInsights(transactions.slice(0, 50), budgets);
          setAiInsight(aiResponse.insight);
        } catch (aiErr) {
          console.error("Error fetching AI insight:", aiErr);
          setAiInsight("I'm taking a quick coffee break ☕ - check that your backend is running and API key is set up!");
        } finally {
          setIsAiLoading(false);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setIsAiLoading(false);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (loading) {
    return (
      <div className="page dashboard flex-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page dashboard">
      <header className="page-header">
        <h1>👋 Hey there!</h1>
        <p>Here's what's happening with your money</p>
      </header>

      <div className="dashboard-summary">
        <div className="summary-card card glass-panel">
          <div className="summary-icon balance">
            <FiDollarSign />
          </div>
          <div className="summary-details">
            <h3>Total Balance</h3>
            <p>₹{totalWalletBalance.toLocaleString()}</p>
          </div>
        </div>

        <div className="summary-card card glass-panel">
          <div className="summary-icon income">
            <FiTrendingUp />
          </div>
          <div className="summary-details">
            <h3>Money in 💰</h3>
            <p>₹{summary.totalIncome.toLocaleString()}</p>
          </div>
        </div>

        <div className="summary-card card glass-panel">
          <div className="summary-icon expense">
            <FiTrendingDown />
          </div>
          <div className="summary-details">
            <h3>Money out 💸</h3>
            <p>₹{summary.totalExpense.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="ai-coach-widget card glass-panel" style={{ margin: "2rem 0", background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <div className="flex-center" style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--color-primary)", color: "white", fontSize: "1.2rem", boxShadow: "0 0 15px rgba(99, 102, 241, 0.5)" }}>
            <FiCpu />
          </div>
          <h3 style={{ margin: 0, color: "var(--color-primary)" }}>Your Money Buddy 🤖</h3>
        </div>
        {isAiLoading ? (
          <div className="flex-center" style={{ padding: "1.5rem" }}>
            <p className="text-muted" style={{ fontStyle: "italic", animation: "pulse 1.5s infinite" }}>Crunching the numbers... give me a sec!</p>
          </div>
        ) : (
          <div style={{ padding: "1.25rem", background: "rgba(255, 255, 255, 0.05)", borderRadius: "var(--radius-md)", borderLeft: "4px solid var(--color-primary)" }}>
            <p style={{ margin: 0, lineHeight: 1.6, color: "var(--color-text-primary)", fontSize: "1.05rem" }}>✨ {aiInsight}</p>
          </div>
        )}
      </div>

      <div className="dashboard-charts">
        <div className="chart-card card glass-panel">
          <div className="chart-header">
            <h3>Income & Expenses Trend</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                  vertical={false}
                />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                  itemStyle={{ color: "#f8fafc" }}
                />
                <Legend />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="var(--color-success)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  name="Expense"
                  fill="var(--color-danger)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card card glass-panel">
          <div className="chart-header">
            <h3>Expense Breakdown</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {summary.categoryBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
