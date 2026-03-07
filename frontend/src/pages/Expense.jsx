import { useState, useEffect, useRef } from "react";
import { FiTrash2, FiMic, FiCamera, FiCoffee, FiMapPin, FiShoppingBag, FiFileText, FiHome, FiCreditCard, FiTv, FiMoreHorizontal, FiTrendingDown, FiPlus } from "react-icons/fi";
import api from "../api";
import "./Expense.css";

const EXPENSE_CATEGORIES = [
    { id: "Food", icon: <FiCoffee />, label: "Food" },
    { id: "Travel", icon: <FiMapPin />, label: "Travel" },
    { id: "Shopping", icon: <FiShoppingBag />, label: "Shopping" },
    { id: "Bills", icon: <FiFileText />, label: "Bills" },
    { id: "Rent", icon: <FiHome />, label: "Rent" },
    { id: "EMI / Loan", icon: <FiCreditCard />, label: "EMI / Loan" },
    { id: "Entertainment", icon: <FiTv />, label: "Entertainment" },
    { id: "Other", icon: <FiMoreHorizontal />, label: "Other" }
];

const Expense = ({ user }) => {
    const [expenses, setExpenses] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        amount: "",
        category: "Food",
        date: new Date().toISOString().split("T")[0],
        walletId: "",
        note: "",
        recurring: false,
        recurringType: "monthly",
        // Metadata fields
        restaurant: "",
        transportType: "uber",
        destination: "",
        billProvider: "",
    });

    // AI Smart Add State
    const [smartText, setSmartText] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [transRes, walletsRes] = await Promise.all([
                    api.get("/transactions"),
                    api.get("/wallets")
                ]);

                // Filter only expenses
                const expenseData = transRes.data.filter(t => t.type === "expense");
                setExpenses(expenseData);
                setWallets(walletsRes.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    const handleSmartAdd = async (e) => {
        if (e.type === "keydown" && e.key !== "Enter") return;

        if (!smartText.trim()) return;

        setIsAiLoading(true);
        try {
            const { aiCategorize } = await import("../api");
            const data = await aiCategorize(smartText);

            if (data.type === "income") {
                alert("AI detected this as an income! Please log it on the Income page.");
                return;
            }

            setFormData((prev) => ({
                ...prev,
                amount: data.amount !== undefined ? String(data.amount) : prev.amount,
                category: data.category || prev.category,
                note: data.note || prev.note,
            }));
            setShowModal(true);
        } catch (error) {
            console.error("API Error categorization:", error);
            const msg = error.response?.data?.error || "Oops! Couldn't parse that.";
            alert(msg);
        } finally {
            setIsAiLoading(false);
            setSmartText("");
        }
    };

    const handleVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Sorry, your browser doesn't support the Speech Recognition API.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => setSmartText(event.results[0][0].transcript);
        recognition.onerror = (event) => {
            console.error("Speech error:", event.error);
            setIsListening(false);
            if (event.error !== 'no-speech') alert(`Microphone error: ${event.error}`);
        };
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsAiLoading(true);
        try {
            const { aiScanReceipt } = await import("../api");
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Content = reader.result.split(",")[1];
                try {
                    const data = await aiScanReceipt(base64Content, file.type);

                    if (data.type === "income") {
                        alert("AI detected this as an income! Please log it on the Income page.");
                        return;
                    }

                    setFormData((prev) => ({
                        ...prev,
                        amount: data.amount !== undefined ? String(data.amount) : prev.amount,
                        category: data.category || prev.category,
                        note: data.note || prev.note,
                    }));
                    setShowModal(true);
                } catch (apiError) {
                    console.error("API Error:", apiError);
                    const msg = apiError.response?.data?.error || "Couldn't scan that receipt.";
                    alert(msg);
                } finally {
                    setIsAiLoading(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }
            };
        } catch (error) {
            console.error("Image upload error:", error);
            setIsAiLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                type: "expense",
                amount: formData.amount,
                category: formData.category,
                date: formData.date,
                walletId: formData.walletId || null,
                note: formData.note,
                recurring: formData.recurring,
                recurringType: formData.recurring ? formData.recurringType : null,

                // Metadata
                restaurant: formData.category === "Food" ? formData.restaurant : undefined,
                transportType: formData.category === "Travel" ? formData.transportType : undefined,
                destination: formData.category === "Travel" ? formData.destination : undefined,
                billProvider: (formData.category === "Bills" || formData.category === "EMI / Loan") ? formData.billProvider : undefined,
            };

            const response = await api.post("/transactions", payload);
            setExpenses([response.data, ...expenses]);

            // Trigger local notification if it's a large expense
            if (Number(formData.amount) >= 500) {
                const { sendBudgetAlert } = await import("../utils/notifications");
                sendBudgetAlert(formData.amount, formData.category);
            }

            closeModal();
        } catch (error) {
            console.error("Error adding expense:", error);
            alert("Couldn't save that expense.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this expense entry?")) {
            try {
                await api.delete(`/transactions/${id}`);
                setExpenses(expenses.filter((t) => t.id !== id));
            } catch (error) {
                console.error("Error deleting:", error);
            }
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({
            amount: "",
            category: "Food",
            date: new Date().toISOString().split("T")[0],
            walletId: wallets.length > 0 ? wallets[0].id : "",
            note: "",
            recurring: false,
            recurringType: "monthly",
            restaurant: "",
            transportType: "uber",
            destination: "",
            billProvider: "",
        });
    };

    const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

    return (
        <div className="page expense-page">
            <header className="page-header flex-between">
                <div>
                    <h1>Expenses 💸</h1>
                    <p>Track where your money goes</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowModal(true)}
                    style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <FiPlus /> Log Expense
                </button>
            </header>

            <div className="expense-summary card glass-panel" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', fontWeight: '600' }}>Total Managed Expense</h3>
                <p className="text-danger" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>₹{totalExpense.toLocaleString()}</p>
            </div>

            <div className="ai-quick-add card glass-panel" style={{ marginBottom: "2rem", padding: '1.5rem', border: '1px solid var(--border-subtle)' }}>
                <div className="ai-content">
                    <div className="ai-header">
                        <h3 style={{ color: '#e14d4d', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.5px' }}>
                            ✨ QUICK ADD EXPENSE (AI MAGIC!)
                        </h3>
                    </div>
                    <div className="ai-input-group">
                        <label className="visually-hidden" htmlFor="ai-input">
                            Describe your expense
                        </label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input
                                id="ai-input"
                                type="text"
                                placeholder="e.g. Spent ₹500 on an Uber to the office"
                                value={smartText}
                                onChange={(e) => setSmartText(e.target.value)}
                                onKeyDown={handleSmartAdd}
                                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                            />
                            <button
                                type="button"
                                className="btn-icon"
                                onClick={handleVoiceInput}
                                style={{ color: isListening ? 'var(--color-danger)' : 'var(--color-text-secondary)', background: 'transparent' }}
                            ><FiMic size={18} /></button>
                            <button
                                type="button"
                                className="btn-icon"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isAiLoading}
                                style={{ color: 'var(--color-text-secondary)', background: 'transparent' }}
                            ><FiCamera size={18} /></button>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
                            <button
                                type="button"
                                className="btn-ai-fill"
                                onClick={handleSmartAdd}
                                disabled={isAiLoading || !smartText.trim()}
                            >
                                {isAiLoading ? "Thinking..." : "Fill it in"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category selection - horizontal scroll row */}
            <h3 style={{ marginBottom: '1rem', marginTop: '2rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Add New Expense</h3>
            <div className="expense-categories-grid">
                {EXPENSE_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        className="category-btn glass-panel"
                        onClick={() => {
                            setFormData({ ...formData, category: cat.id, walletId: wallets.length > 0 ? wallets[0].id : "" });
                            setShowModal(true);
                        }}
                    >
                        <span className="category-icon text-danger">{cat.icon}</span>
                        <span className="category-label">{cat.label}</span>
                    </button>
                ))}
            </div>

            <div className="card glass-panel expense-list-container">
                <h3>Expense History</h3>
                {loading ? (
                    <div className="flex-center" style={{ padding: "2rem" }}>Loading...</div>
                ) : expenses.length === 0 ? (
                    <div className="flex-center text-muted" style={{ padding: "2rem" }}>No expenses logged yet.</div>
                ) : (
                    <div className="transaction-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {expenses.map((t) => (
                            <div key={t.id} className="transaction-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderRadius: '12px', background: 'var(--color-bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className="category-icon-bg" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        {EXPENSE_CATEGORIES.find(c => c.id === t.category)?.icon || '💸'}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>{t.category}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                            <span>
                                                {t.category === 'Food' && t.metadata?.restaurant ? t.metadata.restaurant :
                                                    t.category === 'Travel' && t.metadata?.destination ? `${t.metadata.transportType} to ${t.metadata.destination}` :
                                                        (t.category === 'Bills' || t.category === 'EMI / Loan') && t.metadata?.billProvider ? t.metadata.billProvider : t.note}
                                            </span>
                                            {t.recurring && <span className="text-danger" style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>↻ {t.recurringType}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1, justifyContent: 'flex-end' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: '100px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</span>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{new Date(t.date).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wallet</span>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{t.walletId ? wallets.find(w => w.id === t.walletId)?.name || 'Unknown' : '-'}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px', alignItems: 'flex-end' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</span>
                                        <span className="text-danger" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>-₹{Number(t.amount).toLocaleString()}</span>
                                    </div>
                                    <button className="btn-icon text-danger" onClick={() => handleDelete(t.id)} style={{ padding: '0.5rem', opacity: 0.8, marginLeft: '0.5rem' }}>
                                        <FiTrash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal card glass-panel">
                        <h3>Add Expense 💸</h3>
                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Category</label>
                                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                    {EXPENSE_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Amount (₹)</label>
                                <input type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                            </div>

                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                            </div>

                            <div className="form-group">
                                <label>Paid From</label>
                                <select value={formData.walletId} onChange={(e) => setFormData({ ...formData, walletId: e.target.value })} required>
                                    <option value="" disabled>Select a Wallet</option>
                                    {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>

                            {/* DYNAMIC CATEGORY FIELDS */}
                            {formData.category === "Food" && (
                                <div className="form-group">
                                    <label>Restaurant / Store</label>
                                    <input type="text" value={formData.restaurant} onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })} required />
                                </div>
                            )}

                            {formData.category === "Travel" && (
                                <>
                                    <div className="form-group">
                                        <label>Transport Type</label>
                                        <select value={formData.transportType} onChange={(e) => setFormData({ ...formData, transportType: e.target.value })}>
                                            <option value="uber">Uber / Cab</option>
                                            <option value="bus">Bus</option>
                                            <option value="train">Train</option>
                                            <option value="flight">Flight</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Destination</label>
                                        <input type="text" value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} required />
                                    </div>
                                </>
                            )}

                            {(formData.category === "Bills" || formData.category === "EMI / Loan" || formData.category === "Rent") && (
                                <div className="form-group">
                                    <label>Provider / Name</label>
                                    <input type="text" value={formData.billProvider} onChange={(e) => setFormData({ ...formData, billProvider: e.target.value })} required />
                                </div>
                            )}

                            <div className="form-group">
                                <label>General Note (Optional)</label>
                                <input type="text" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
                            </div>

                            {/* RECURRING OPTIONS */}
                            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" id="recurring-checkbox" checked={formData.recurring} onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })} style={{ width: 'auto' }} />
                                <label htmlFor="recurring-checkbox" style={{ margin: 0 }}>This is a recurring expense</label>
                            </div>

                            {formData.recurring && (
                                <div className="form-group">
                                    <label>Repeats every</label>
                                    <select value={formData.recurringType} onChange={(e) => setFormData({ ...formData, recurringType: e.target.value })}>
                                        <option value="weekly">Week</option>
                                        <option value="monthly">Month</option>
                                        <option value="yearly">Year</option>
                                    </select>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn-text text-danger-btn" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expense;