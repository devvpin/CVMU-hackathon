import { useState, useEffect, useRef } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiMic, FiCamera } from "react-icons/fi";
import api from "../api";
import { sendBudgetAlert } from "../utils/notifications";
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
    const [isListening, setIsListening] = useState(false);
    const fileInputRef = useRef(null);

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

    const handleVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Sorry, your browser doesn't support the Speech Recognition API. Try using Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setSmartText(transcript);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
            if (event.error !== 'no-speech') {
                alert(`Microphone error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsAiLoading(true);
        try {
            const { aiScanReceipt } = await import("../api");

            // Read file as Base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Data = reader.result;
                const mimeType = file.type;

                // The API expects just the base64 string, so we split off the "data:image/jpeg;base64," prefix
                const base64Content = base64Data.split(",")[1];

                try {
                    const data = await aiScanReceipt(base64Content, mimeType);

                    // Auto-fill the form with AI results
                    setFormData((prev) => ({
                        ...prev,
                        amount: data.amount !== undefined ? String(data.amount) : prev.amount,
                        category: data.category || prev.category,
                        description: data.description || prev.description,
                        type: data.type || "expense",
                    }));
                } catch (apiError) {
                    console.error("API Error scanning receipt:", apiError);
                    alert("Oops! Couldn't scan that receipt.");
                } finally {
                    setIsAiLoading(false);
                    // Reset file input
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }
            };
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
                alert("Error reading the image file.");
                setIsAiLoading(false);
            };
        } catch (error) {
            console.error("Error handling image upload:", error);
            setIsAiLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post("/transactions", formData);
            setTransactions([response.data, ...transactions]);

            // Trigger local notification if it's a large expense
            if (formData.type === "expense" && Number(formData.amount) >= 500) {
                sendBudgetAlert(formData.amount, formData.category);
            }

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
                        <h3>Log a transaction ✏️</h3>

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
                                        className="btn-icon"
                                        onClick={handleVoiceInput}
                                        style={{
                                            backgroundColor: isListening ? 'var(--color-danger)' : 'var(--color-bg-primary)',
                                            color: isListening ? '#fff' : 'var(--color-text-primary)',
                                            border: '1px solid rgba(100, 116, 139, 0.3)',
                                            transition: 'all 0.2s ease',
                                        }}
                                        title="Use Voice Input"
                                    >
                                        <FiMic />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-icon"
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            backgroundColor: 'var(--color-bg-primary)',
                                            color: 'var(--color-text-primary)',
                                            border: '1px solid rgba(100, 116, 139, 0.3)',
                                            transition: 'all 0.2s ease',
                                        }}
                                        title="Scan Receipt"
                                        disabled={isAiLoading}
                                    >
                                        <FiCamera />
                                    </button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handleImageUpload}
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
                                    Just describe what happened - or tap the mic and speak!
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
                                    <option value="Food">\ud83c\udf54 Food</option>
                                    <option value="Transport">\ud83d\ude97 Transport</option>
                                    <option value="Entertainment">\ud83c\udfac Entertainment</option>
                                    <option value="Salary">\ud83d\udcbc Salary</option>
                                    <option value="Rent/Mortgage">\ud83c\udfe0 Rent/Mortgage</option>
                                    <option value="Utilities">\ud83d\udca1 Utilities</option>
                                    <option value="Shopping">\ud83d\udecd\ufe0f Shopping</option>
                                    <option value="Other">\ud83d\udccc Other</option>
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
