import { useEffect, useMemo, useState } from "react";
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
import api from "../api";
import "./Reports.css";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

const monthKey = (d) => (typeof d === "string" ? d.slice(0, 7) : "");

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [months, setMonths] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); // eslint-disable-line no-unused-vars
  const [summary, setSummary] = useState({
    balance: 0,
    totalIncome: 0,
    totalExpense: 0,
    categoryBreakdown: [],
  });
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [error, setError] = useState("");

  const monthQuery = useMemo(() => {
    if (!selectedMonth || selectedMonth === "all") return "";
    return `?month=${encodeURIComponent(selectedMonth)}`;
  }, [selectedMonth]);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError("");

      try {
        const [summaryRes, transRes] = await Promise.all([
          api.get(`/reports/summary${monthQuery}`),
          api.get("/transactions"),
        ]);

        const data = summaryRes.data;
        const transactions = transRes.data || [];
        setAllTransactions(transactions);

        // Extract unique categories
        const uniqueCategories = [...new Set(transactions.map((t) => t.category))].sort();
        setCategories(uniqueCategories);

        // Filter transactions by selected category
        const filteredTransactions = selectedCategory === "all"
          ? transactions
          : transactions.filter((t) => t.category === selectedCategory);

        // If category filter is applied, recalculate summary from filtered transactions
        if (selectedCategory !== "all") {
          const filteredIncome = filteredTransactions
            .filter((t) => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0);
          const filteredExpense = filteredTransactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0);

          const catBreakdown = {};
          filteredTransactions
            .filter((t) => t.type === "expense")
            .forEach((t) => {
              catBreakdown[t.category] = (catBreakdown[t.category] || 0) + t.amount;
            });

          const formattedBreakdown = Object.keys(catBreakdown).map((key) => ({
            name: key,
            value: catBreakdown[key],
          }));

          setSummary({
            balance: filteredIncome - filteredExpense,
            totalIncome: filteredIncome,
            totalExpense: filteredExpense,
            categoryBreakdown: formattedBreakdown,
          });
        } else {
          const formattedBreakdown = Object.keys(data.categoryBreakdown || {}).map((key) => ({
            name: key,
            value: data.categoryBreakdown[key],
          }));

          setSummary({
            balance: data.balance ?? 0,
            totalIncome: data.totalIncome ?? 0,
            totalExpense: data.totalExpense ?? 0,
            categoryBreakdown: formattedBreakdown,
          });
        }

        // Build monthly trend from filtered transactions
        const byMonth = {};
        filteredTransactions.forEach((t) => {
          const mk = monthKey(t.date);
          if (!mk) return;
          if (!byMonth[mk]) byMonth[mk] = { name: mk, income: 0, expense: 0 };
          if (t.type === "income") byMonth[mk].income += t.amount;
          else byMonth[mk].expense += t.amount;
        });
        const trend = Object.values(byMonth).sort((a, b) => a.name.localeCompare(b.name));
        setMonthlyTrend(trend);

        const uniqueMonths = [...new Set(trend.map((x) => x.name))].sort((a, b) => b.localeCompare(a));
        setMonths(uniqueMonths);
      } catch (e) {
        console.error("Reports fetch failed:", e);
        setError("Could not load reports. Please ensure the backend is running and you're logged in.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [monthQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="page reports flex-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page reports">
      <header className="page-header">
        <h1>📊 Reports</h1>
        <p>Understand your cashflow and spending patterns.</p>
      </header>

      <div className="reports-toolbar card glass-panel">
        <div className="toolbar-item">
          <label htmlFor="month">Month</label>
          <select
            id="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="all">All time</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-item">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="card glass-panel reports-error">
          <p>{error}</p>
        </div>
      )}

      <div className="reports-kpis">
        <div className="kpi card glass-panel">
          <div className="kpi-label">Balance</div>
          <div className="kpi-value">₹{Number(summary.balance).toLocaleString()}</div>
        </div>
        <div className="kpi card glass-panel">
          <div className="kpi-label">Income</div>
          <div className="kpi-value">₹{Number(summary.totalIncome).toLocaleString()}</div>
        </div>
        <div className="kpi card glass-panel">
          <div className="kpi-label">Expense</div>
          <div className="kpi-value">₹{Number(summary.totalExpense).toLocaleString()}</div>
        </div>
      </div>

      <div className="reports-charts">
        <div className="chart-card card glass-panel">
          <div className="chart-header">
            <h3>Monthly trend</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card card glass-panel">
          <div className="chart-header">
            <h3>Spending breakdown</h3>
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
                  {(summary.categoryBreakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

export default Reports;
