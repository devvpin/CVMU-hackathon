import { useState, useEffect } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import api from "../api";
import "./Budgets.css";

const Budgets = ({ user }) => {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category: "Food",
    amount: "",
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch budgets and transactions to calculate spent amounts
        const [budgetsRes, transRes] = await Promise.all([
          api.get("/budgets"),
          api.get("/transactions"),
        ]);

        setBudgets(budgetsRes.data);
        setTransactions(transRes.data);
      } catch (error) {
        console.error("Error fetching budget data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/budgets", formData);

      // Check if it's an update to an existing budget
      const existingIndex = budgets.findIndex(
        (b) =>
          b.category === response.data.category &&
          b.month === response.data.month,
      );

      if (existingIndex >= 0) {
        const updatedBudgets = [...budgets];
        updatedBudgets[existingIndex] = response.data;
        setBudgets(updatedBudgets);
      } else {
        setBudgets([...budgets, response.data]);
      }

      setShowModal(false);
      setFormData({ ...formData, amount: "" });
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("Couldn't save that budget. Mind trying again?");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remove this budget? You can always add it back later!")) {
      try {
        await api.delete(`/budgets/${id}`);
        setBudgets(budgets.filter((b) => b.id !== id));
      } catch (error) {
        console.error("Error deleting budget:", error);
        alert("Hmm, couldn't delete that. Try again?");
      }
    }
  };

  // Calculate spent amount for a specific category and month
  const getSpentAmount = (category, monthText) => {
    return transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.category === category &&
          t.date.startsWith(monthText),
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="page budgets">
      <header className="page-header flex-between">
        <div>
          <h1>Budgets 🎯</h1>
          <p>Keep your spending in check - future you will thank you!</p>
        </div>
        <button
          className="btn-primary flex-center"
          onClick={() => setShowModal(true)}
        >
          <FiPlus /> Set a limit
        </button>
      </header>

      {loading ? (
        <div className="flex-center" style={{ padding: "2rem" }}>
          Loading your budgets...
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex-center text-muted" style={{ padding: "2rem" }}>
          💡 No budgets yet! Set one up to stay on top of your spending.
        </div>
      ) : (
        <div className="budgets-grid">
          {budgets.map((budget) => {
            const spent = getSpentAmount(budget.category, budget.month);
            const percent = Math.min((spent / budget.amount) * 100, 100);
            const isOver = spent > budget.amount;

            return (
              <div key={budget.id} className="budget-card card glass-panel">
                <div className="budget-header flex-between">
                  <h3>{budget.category}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span
                      className={`status-badge ${isOver ? "danger" : "safe"}`}
                    >
                      {isOver ? "Oops, over budget!" : "Looking good!"}
                    </span>
                    <button
                      className="btn-icon text-danger"
                      onClick={() => handleDelete(budget.id)}
                      title="Delete Budget"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                <div className="budget-amounts flex-between">
                  <div>
                    <span className="spent">${spent.toLocaleString()}</span>
                    <span className="text-muted">
                      {" "}
                      / ${budget.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="remaining text-muted">
                    ${Math.max(budget.amount - spent, 0).toLocaleString()} left
                  </div>
                </div>

                <div className="progress-bar-container">
                  <div
                    className={`progress-bar ${isOver ? "danger" : "safe"}`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div >
      )}

      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal card glass-panel">
              <h3>Set a spending limit 📊</h3>
              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Which month?</label>
                  <input
                    type="month"
                    value={formData.month}
                    onChange={(e) =>
                      setFormData({ ...formData, month: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Spending category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    <option value="Food">\ud83c\udf54 Food</option>
                    <option value="Transport">\ud83d\ude97 Transport</option>
                    <option value="Entertainment">\ud83c\udfac Entertainment</option>
                    <option value="Rent/Mortgage">\ud83c\udfe0 Rent/Mortgage</option>
                    <option value="Utilities">\ud83d\udca1 Utilities</option>
                    <option value="Shopping">\ud83d\udecd\ufe0f Shopping</option>
                    <option value="Other">\ud83d\udccc Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Max you want to spend ($)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="e.g. 500"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-text"
                    onClick={() => setShowModal(false)}
                  >
                    Never mind
                  </button>
                  <button type="submit" className="btn-primary">
                    Set it!
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Budgets;
