import { useState, useEffect, useRef } from "react";
import { FiPlus, FiTrash2, FiMic, FiCamera } from "react-icons/fi";
import api from "../api";
import "./Transactions.css"; // Reuse existing css

const INCOME_CATEGORIES = [
    { name: "Paycheck / Salary", icon: "🏢" },
    { name: "Rental Income", icon: "🏠" },
    { name: "Business Profit", icon: "📈" },
    { name: "Investment Income", icon: "📊" },
    { name: "Other Income", icon: "💰" }
];

const Income = ({ user }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        type: "income",
        amount: "",
        category: "Paycheck / Salary",
        subcategory: "",
        note: "",
        date: new Date().toISOString().split("T")[0],
        recurring: false,
        recurringType: "monthly"
    });

    const [extraFields, setExtraFields] = useState({
        employerName: "",
        propertyName: "",
        tenantName: ""
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
                // Filter only income
                setTransactions(response.data.filter(t => t.type === "income"));
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

    const handleCategoryClick = (categoryName) => {
        setFormData(prev => ({ ...prev, category: categoryName }));
        setShowModal(true);
    };

    const handleSmartAdd = async (e) => {
        e.preventDefault();
        if (!smartText.trim()) return;

        setIsAiLoading(true);
        try {
            const { aiCategorize } = await import("../api");
            const data = await aiCategorize(smartText);

            if (data.type === 'expense') {
                alert("AI detected an Expense! Please log this on the Expense page.");
                return;
            }

            setFormData((prev) => ({
                ...prev,
                amount: data.amount !== undefined ? String(data.amount) : prev.amount,
                category: data.category || prev.category,
                note: data.note || prev.note || "",
            }));

            setSmartText("");
            setShowModal(true);
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

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Data = reader.result;
                const mimeType = file.type;
                const base64Content = base64Data.split(",")[1];

                try {
                    const data = await aiScanReceipt(base64Content, mimeType);

                    if (data.type === 'expense') {
                        alert("AI detected an Expense! Please log this on the Expense page.");
                        return;
                    }

                    setFormData((prev) => ({
                        ...prev,
                        amount: data.amount !== undefined ? String(data.amount) : prev.amount,
                        category: data.category || prev.category,
                        note: data.note || prev.note || "",
                    }));
                    setShowModal(true);
                } catch (apiError) {
                    console.error("API Error scanning receipt:", apiError);
                    alert("Oops! Couldn't scan that receipt.");
                } finally {
                    setIsAiLoading(false);
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
        
        let finalSubcategory = formData.subcategory;
        if (formData.category === "Paycheck / Salary") {
            finalSubcategory = extraFields.employerName;
        } else if (formData.category === "Rental Income") {
            finalSubcategory = `Property: ${extraFields.propertyName}, Tenant: ${extraFields.tenantName}`;
        }

        const submitData = {
            ...formData,
            subcategory: finalSubcategory
        };

        try {
            const response = await api.post("/transactions", submitData);
            setTransactions([response.data, ...transactions]);

            setShowModal(false);
            setFormData({
                type: "income",
                amount: "",
                category: "Paycheck / Salary",
                subcategory: "",
                note: "",
                date: new Date().toISOString().split("T")[0],
                recurring: false,
                recurringType: "monthly"
            });
            setExtraFields({ employerName: "", propertyName: "", tenantName: "" });
        } catch (error) {
            console.error("Error adding income:", error);
            alert("Hmm, couldn't save that. Is your backend running?");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this income entry? You can't undo this!")) {
            try {
                await api.delete(`/transactions/${id}`);
                setTransactions(transactions.filter((t) => t.id !== id));
            } catch (error) {
                console.error("Error deleting:", error);
            }
        }
    };

    const totalIncome = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return (
        <div className="page transactions">
            <header className="page-header flex-between">
                <div>
                    <h1>Income 💰</h1>
                    <p>Track your earnings and cash flow</p>
                </div>
            </header>

            {/* Income Summary Card */}
            <div className="card glass-panel" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h3 className="text-muted">Total Managed Income</h3>
                <h2 className="text-success" style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>
                    +${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </h2>
            </div>

            {/* AI Magic Quick Add */}
            <div className="card glass-panel" style={{ marginBottom: '2rem' }}>
                <div className="smart-add-section">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="text-accent flex-center" style={{ justifyContent: "flex-start", gap: "0.5rem", marginBottom: "0.5rem", color: "var(--color-success)" }}>
                            ✨ Quick Add Income (AI magic!)
                        </label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input
                                type="text"
                                placeholder="e.g. Got my $5000 salary today"
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
                                    color: isListening ? '#fff' : 'var(--color-text-primary)'
                                }}
                                title="Use Voice Input"
                            >
                                <FiMic />
                            </button>
                            <button
                                type="button"
                                className="btn-icon"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isAiLoading}
                                title="Scan Receipt/Invoice"
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
                                style={{ backgroundColor: 'var(--color-success)' }}
                            >
                                {isAiLoading ? "Thinking..." : "Fill it in"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Grid */}
            <h3 style={{ marginBottom: '1rem' }}>Add New Income</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {INCOME_CATEGORIES.map(cat => (
                    <button 
                        key={cat.name} 
                        className="card glass-panel flex-center flex-col" 
                        style={{ padding: '1.5rem 1rem', cursor: 'pointer', border: '1px solid var(--border-subtle)', transition: 'all 0.2s ease', background: 'var(--color-bg-secondary)' }}
                        onClick={() => handleCategoryClick(cat.name)}
                    >
                        <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{cat.icon}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{cat.name}</span>
                    </button>
                ))}
            </div>

            <div className="card glass-panel transactions-container">
                <h3 style={{ marginBottom: '1rem' }}>Income History</h3>
                {loading ? (
                    <div className="flex-center" style={{ padding: "2rem" }}>
                        Fetching your income...
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex-center text-muted" style={{ padding: "2rem" }}>
                        🌱 No income logged yet!
                    </div>
                ) : (
                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Source</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((t) => (
                                <tr key={t.id}>
                                    <td>{new Date(t.date).toLocaleDateString()}</td>
                                    <td>
                                        <div>{t.note || t.description || "N/A"}</div>
                                        {t.subcategory && <div style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{t.subcategory}</div>}
                                        {t.recurring && <span className="category-badge" style={{ marginTop: '4px', fontSize: '0.7em', background: 'var(--color-primary-light)', color: 'white' }}>Recurring {t.recurringType}</span>}
                                    </td>
                                    <td>
                                        <span className="category-badge">{t.category}</span>
                                    </td>
                                    <td className="text-success">
                                        +${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
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
                        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                            <h3>Log Income: {formData.category}</h3>
                            <span style={{ fontSize: '2rem' }}>{INCOME_CATEGORIES.find(c => c.name === formData.category)?.icon}</span>
                        </div>

                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Date Received</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Category Specific Fields */}
                            {formData.category === "Paycheck / Salary" && (
                                <div className="form-group">
                                    <label>Employer Name</label>
                                    <input
                                        type="text"
                                        placeholder="Company Inc."
                                        value={extraFields.employerName}
                                        onChange={(e) => setExtraFields({ ...extraFields, employerName: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            {formData.category === "Rental Income" && (
                                <>
                                    <div className="form-group">
                                        <label>Property Name / Address</label>
                                        <input
                                            type="text"
                                            placeholder="123 Main St"
                                            value={extraFields.propertyName}
                                            onChange={(e) => setExtraFields({ ...extraFields, propertyName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Tenant Name</label>
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            value={extraFields.tenantName}
                                            onChange={(e) => setExtraFields({ ...extraFields, tenantName: e.target.value })}
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label>Quick Note / Description</label>
                                <input
                                    type="text"
                                    placeholder="Bonus, rent payment, dividend, etc."
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                />
                            </div>

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.recurring}
                                        onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                                        style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                                    />
                                    This is a recurring income
                                </label>

                                {formData.recurring && (
                                    <select
                                        value={formData.recurringType}
                                        onChange={(e) => setFormData({ ...formData, recurringType: e.target.value })}
                                        style={{ marginLeft: 'auto', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                )}
                            </div>

                            <div className="modal-actions" style={{ marginTop: '2rem' }}>
                                <button
                                    type="button"
                                    className="btn-text"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--color-success)' }}>
                                    Save Income
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Income;
