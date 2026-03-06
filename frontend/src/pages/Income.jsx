import { useState, useEffect, useRef } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiMic, FiCamera, FiBriefcase, FiHome, FiTrendingUp, FiDollarSign } from "react-icons/fi";
import api from "../api";
import "./Income.css";

const INCOME_CATEGORIES = [
    { id: "Paycheck", icon: <FiBriefcase />, label: "Paycheck / Salary" },
    { id: "Rental Income", icon: <FiHome />, label: "Rental Income" },
    { id: "Business Profit", icon: <FiTrendingUp />, label: "Business Profit" },
    { id: "Investment Income", icon: <FiTrendingUp />, label: "Investment Income" },
    { id: "Other", icon: <FiDollarSign />, label: "Other Income" }
];

const Income = ({ user }) => {
    const [incomes, setIncomes] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        amount: "",
        category: "Paycheck",
        date: new Date().toISOString().split("T")[0],
        walletId: "",
        note: "",
        recurring: false,
        recurringType: "monthly",
        // Metadata fields
        employerName: "",
        property: "",
        tenant: "",
        source: "",
    });

    // AI Smart Add State
    const [smartText, setSmartText] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch transactions and wallets
                const [transRes, walletsRes] = await Promise.all([
                    api.get("/transactions"),
                    api.get("/wallets")
                ]);

                // Filter only incomes
                const incomeData = transRes.data.filter(t => t.type === "income");
                setIncomes(incomeData);
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

            if (data.type === "expense") {
                alert("AI detected this as an expense! Please log it on the Expense page.");
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
            alert("Oops! Couldn't parse that.");
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

                    if (data.type === "expense") {
                        alert("AI detected this as an expense! Please log it on the Expense page.");
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
                    alert("Couldn't scan that receipt.");
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
                type: "income",
                amount: formData.amount,
                category: formData.category,
                date: formData.date,
                walletId: formData.walletId || null,
                note: formData.note,
                recurring: formData.recurring,
                recurringType: formData.recurring ? formData.recurringType : null,

                // Metadata
                employerName: formData.category === "Paycheck" ? formData.employerName : undefined,
                property: formData.category === "Rental Income" ? formData.property : undefined,
                tenant: formData.category === "Rental Income" ? formData.tenant : undefined,
                source: formData.category === "Business Profit" ? formData.source : undefined,
            };

            const response = await api.post("/transactions", payload);
            setIncomes([response.data, ...incomes]);
            closeModal();
        } catch (error) {
            console.error("Error adding income:", error);
            alert("Couldn't save that income.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this income entry?")) {
            try {
                await api.delete(`/transactions/${id}`);
                setIncomes(incomes.filter((t) => t.id !== id));
            } catch (error) {
                console.error("Error deleting:", error);
            }
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({
            amount: "",
            category: "Paycheck",
            date: new Date().toISOString().split("T")[0],
            walletId: wallets.length > 0 ? wallets[0].id : "",
            note: "",
            recurring: false,
            recurringType: "monthly",
            employerName: "",
            property: "",
            tenant: "",
            source: "",
        });
    };

    const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount), 0);

    return (
        <div className="page income-page">
            <header className="page-header flex-between">
                <div>
                    <h1>Income 💰</h1>
                    <p>Track everything you earn</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowModal(true)}
                    style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <FiPlus /> Log Income
                </button>
            </header>

            <div className="income-summary card glass-panel" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', fontWeight: '600' }}>Total Managed Income</h3>
                <p className="text-success" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>+₹{totalIncome.toLocaleString()}</p>
            </div>

            <div className="ai-quick-add card glass-panel" style={{ marginBottom: "2rem", padding: '1.5rem', border: '1px solid var(--border-subtle)' }}>
                <div className="ai-content">
                    <div className="ai-header">
                        <h3 style={{ color: '#4b9a95', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.5px' }}>
                            ✨ QUICK ADD INCOME (AI MAGIC!)
                        </h3>
                    </div>
                    <div className="ai-input-group">
                        <label className="visually-hidden" htmlFor="ai-input">
                            Describe your earnings
                        </label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input
                                id="ai-input"
                                type="text"
                                placeholder="e.g. Got my ₹5000 salary today"
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

            <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Add New Income</h3>
            </div>
            <div className="income-categories-grid">
                {INCOME_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        className="category-btn"
                        onClick={() => {
                            setFormData({ ...formData, category: cat.id, walletId: wallets.length > 0 ? wallets[0].id : "" });
                            setShowModal(true);
                        }}
                    >
                        <span className="category-icon text-accent">{cat.icon}</span>
                        <span className="category-label">{cat.label}</span>
                    </button>
                ))}
            </div>

            <div className="card glass-panel income-list-container">
                <h3>Income History</h3>
                {loading ? (
                    <div className="flex-center" style={{ padding: "2rem" }}>Loading...</div>
                ) : incomes.length === 0 ? (
                    <div className="flex-center text-muted" style={{ padding: "2rem" }}>No income logged yet.</div>
                ) : (
                    <div className="transaction-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {incomes.map((t) => (
                            <div key={t.id} className="transaction-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', borderRadius: '12px', background: 'var(--color-bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className="category-icon-bg" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        {INCOME_CATEGORIES.find(c => c.id === t.category)?.icon || '💰'}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>{t.category}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                            <span>
                                                {t.category === 'Paycheck / Salary' ? t.metadata?.employerName :
                                                    t.category === 'Rental Income' ? t.metadata?.property :
                                                        t.category === 'Business Profit' ? t.metadata?.source : t.note}
                                            </span>
                                            {t.recurring && <span className="text-accent" style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>↻ {t.recurringType}</span>}
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
                                        <span className="text-success" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>+₹{Number(t.amount).toLocaleString()}</span>
                                    </div>
                                    <button className="btn-icon" onClick={() => handleDelete(t.id)} style={{ color: 'var(--color-text-secondary)', padding: '0.5rem', opacity: 0.6, marginLeft: '0.5rem' }}>
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
                        <h3>Add Income 💰</h3>
                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Category</label>
                                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                    {INCOME_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
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
                                <label>Deposit To</label>
                                <select value={formData.walletId} onChange={(e) => setFormData({ ...formData, walletId: e.target.value })} required>
                                    <option value="" disabled>Select a Wallet</option>
                                    {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>

                            {/* DYNAMIC CATEGORY FIELDS */}
                            {formData.category === "Paycheck" && (
                                <div className="form-group">
                                    <label>Employer / Company Name</label>
                                    <input type="text" value={formData.employerName} onChange={(e) => setFormData({ ...formData, employerName: e.target.value })} required />
                                </div>
                            )}

                            {formData.category === "Rental Income" && (
                                <>
                                    <div className="form-group">
                                        <label>Property Name / Address</label>
                                        <input type="text" value={formData.property} onChange={(e) => setFormData({ ...formData, property: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Tenant Name</label>
                                        <input type="text" value={formData.tenant} onChange={(e) => setFormData({ ...formData, tenant: e.target.value })} />
                                    </div>
                                </>
                            )}

                            {formData.category === "Business Profit" && (
                                <div className="form-group">
                                    <label>Business / Source</label>
                                    <input type="text" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} required />
                                </div>
                            )}

                            <div className="form-group">
                                <label>General Note (Optional)</label>
                                <input type="text" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
                            </div>

                            {/* RECURRING OPTIONS */}
                            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" id="recurring-checkbox" checked={formData.recurring} onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })} style={{ width: 'auto' }} />
                                <label htmlFor="recurring-checkbox" style={{ margin: 0 }}>This is a recurring income</label>
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
                                <button type="button" className="btn-text" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Income</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Income;
