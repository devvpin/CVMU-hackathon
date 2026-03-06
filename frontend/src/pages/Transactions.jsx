import { useState, useEffect } from "react";
import { FiPlus, FiTrash2, FiEdit2 } from "react-icons/fi";
import api from "../api";
import "./Transactions.css";

const Transactions = ({ user }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        type: "expense",
        amount: "",
        category: "Food",
        description: "",
        date: new Date().toISOString().split("T")[0],
    });

    // AI Smart Add State
    const [smartText, setSmartText] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await api.get("/transactions");
                setTransactions(response.data);
            } catch (error) {
                console.error("Error fetching transactions:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchTransactions();
        }
    }, [user]);

    const handleSmartAdd = async (e) => {
        e.preventDefault();
        if (!smartText.trim()) return;

        setIsAiLoading(true);
        try {
            const { aiCategorize } = await import("../api");
            const data = await aiCategorize(smartText);

            // Auto-fill the form with AI results
            setFormData((prev) => ({
                ...prev,
                amount: data.amount !== undefined ? String(data.amount) : prev.amount,
                category: data.category || prev.category,
                description: data.description || prev.description,
                type: data.type || "expense",
            }));

            setSmartText("");
        } catch (error) {
            console.error("Error with Smart Add:", error);
            alert("Oops! Couldn't analyze that. Check your AI setup.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post("/transactions", formData);
            setTransactions([response.data, ...transactions]);
            setShowModal(false);
            // Reset form
            setFormData({
                type: "expense",
                amount: "",
                category: "Food",
                description: "",
                date: new Date().toISOString().split("T")[0],
            });
        } catch (error) {
            console.error("Error adding transaction:", error);
            alert("Hmm, couldn't save that. Is your backend running?");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this one? You can't undo this!")) {
            try {
                await api.delete(`/transactions/${id}`);
                setTransactions(transactions.filter((t) => t.id !== id));
            } catch (error) {
                console.error("Error deleting:", error);
            }
        }
    };

    return (
        <div className="page transactions">
            <header className="page-header flex-between">
                <div>
                    <h1>Transactions 📝</h1>
                    <p>All your comings and goings, in one place</p>
                </div>
                <button
                    className="btn-primary flex-center"
                    onClick={() => setShowModal(true)}
                >
                    <FiPlus /> Log something
                </button>
            </header>

            <div className="card glass-panel transactions-container">
                {loading ? (
                    <div className="flex-center" style={{ padding: "2rem" }}>
                        Fetching your transactions...
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex-center text-muted" style={{ padding: "2rem" }}>
                        🌱 Nothing here yet! Add your first transaction to get started.
                    </div>
                ) : (
                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((t) => (
                                <tr key={t.id}>
                                    <td>{new Date(t.date).toLocaleDateString()}</td>
                                    <td>{t.description}</td>
                                    <td>
                                        <span className="category-badge">{t.category}</span>
                                    </td>
                                    <td
                                        className={
                                            t.type === "income" ? "text-success" : "text-danger"
                                        }
                                    >
                                        {t.type === "income" ? "+" : "-"}${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            className="btn-icon text-danger"
                                            onClick={() => handleDelete(t.id)}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal card glass-panel">
                        <h3>Insert transaction ✏️</h3>

                        {/* Smart Add AI Section */}
                        <div className="smart-add-section" style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                            <div className="form-group">
                                <label
                                    className="text-accent flex-center"
                                    style={{
                                        justifyContent: "flex-start",
                                        gap: "0.5rem",
                                        marginBottom: "0.5rem",
                                        color: "var(--color-primary)",
                                    }}
                                >
                                    ✨ Quick Add (AI magic!)
                                </label>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <input
                                        type="text"
                                        placeholder="e.g. Grabbed a $5 latte this morning"
                                        value={smartText}
                                        onChange={(e) => setSmartText(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSmartAdd(e)}
                                    />
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={handleSmartAdd}
                                        disabled={isAiLoading || !smartText.trim()}
                                    >
                                        {isAiLoading ? "Thinking..." : "Fill it in"}
                                    </button>
                                </div>
                                <p
                                    className="text-muted"
                                    style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}
                                >
                                    Just describe what happened - I'll figure out the rest!
                                </p>
                            </div>
                        </div>

                        <hr
                            style={{
                                margin: "1.5rem 0",
                                borderColor: "var(--border-subtle)",
                                opacity: 0.5,
                            }}
                        />

                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>When?</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, date: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Money in or out?</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) =>
                                        setFormData({ ...formData, type: e.target.value })
                                    }
                                >
                                    <option value="expense">Spent it 💸</option>
                                    <option value="income">Earned it 💰</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>How much?</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={(e) =>
                                        setFormData({ ...formData, amount: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>What's it for?</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) =>
                                        setFormData({ ...formData, category: e.target.value })
                                    }
                                >
                                    <option value="Food">Food</option>
                                    <option value="Transport">Transport</option>
                                    <option value="Entertainment">Entertainment</option>
                                    <option value="Salary">Salary</option>
                                    <option value="Rent/Mortgage">Rent/Mortgage</option>
                                    <option value="Utilities">Utilities</option>
                                    <option value="Shopping">Shopping</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Quick note</label>
                                <input
                                    type="text"
                                    placeholder="Morning coffee, groceries, etc."
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
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
                                    Save it!
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;
