import { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiBriefcase, FiCreditCard, FiSmartphone, FiDollarSign } from "react-icons/fi";
import api from "../api";
import "./Wallets.css";

const WALLET_TYPES = [
    { value: "bank", label: "Bank Account", icon: <FiBriefcase /> },
    { value: "credit_card", label: "Credit Card", icon: <FiCreditCard /> },
    { value: "gpay", label: "Google Pay / UPI", icon: <FiSmartphone /> },
    { value: "cash", label: "Cash", icon: <FiDollarSign /> },
    { value: "other", label: "Other", icon: <FiCreditCard /> },
];

const getWalletIcon = (type) => {
    const found = WALLET_TYPES.find((t) => t.value === type);
    return found ? found.icon : <FiCreditCard />;
};

const getWalletLabel = (type) => {
    const found = WALLET_TYPES.find((t) => t.value === type);
    return found ? found.label : "Wallet";
};

const Wallets = ({ user }) => {
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        type: "bank",
        balance: "",
    });

    useEffect(() => {
        fetchWallets();
    }, [user]);

    const fetchWallets = async () => {
        try {
            const response = await api.get("/wallets");
            setWallets(response.data);
        } catch (error) {
            console.error("Error fetching wallets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (wallet) => {
        setEditingId(wallet.id);
        setFormData({
            name: wallet.name,
            type: wallet.type,
            balance: wallet.balance,
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this wallet? Transactions will keep their record but won't be linked to this wallet anymore.")) {
            try {
                await api.delete(`/wallets/${id}`);
                setWallets(wallets.filter((w) => w.id !== id));
            } catch (error) {
                console.error("Error deleting wallet:", error);
                alert("Couldn't delete wallet. Try again later.");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                const response = await api.put(`/wallets/${editingId}`, formData);
                setWallets(wallets.map((w) => (w.id === editingId ? response.data : w)));
            } else {
                const response = await api.post("/wallets", formData);
                setWallets([...wallets, response.data]);
            }
            closeModal();
        } catch (error) {
            console.error("Error saving wallet:", error);
            alert("Oops! Couldn't save the wallet.");
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: "", type: "bank", balance: "" });
    };

    const totalBalance = wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);

    return (
        <div className="page wallets">
            <header className="page-header flex-between">
                <div>
                    <h1>Wallets 💳</h1>
                    <p>Manage your accounts, cards, and digital wallets.</p>
                </div>
                <button className="btn-primary flex-center" onClick={() => setShowModal(true)}>
                    <FiPlus /> Add Wallet
                </button>
            </header>

            {/* Summary KPI */}
            <div className="wallets-kpi card glass-panel">
                <div className="kpi-label">Total Valid Balance across all Wallets</div>
                <div className="kpi-value text-accent">₹{totalBalance.toLocaleString()}</div>
            </div>

            <div className="wallets-grid">
                {loading ? (
                    <div className="flex-center" style={{ padding: "2rem", width: "100%" }}>
                        Loading your wallets...
                    </div>
                ) : wallets.length === 0 ? (
                    <div className="flex-center text-muted" style={{ padding: "2rem", width: "100%" }}>
                        No wallets yet. Add an account or Google Pay to get started!
                    </div>
                ) : (
                    wallets.map((wallet) => (
                        <div key={wallet.id} className="wallet-card card glass-panel">
                            <div className="wallet-header flex-between">
                                <div className="wallet-icon-title">
                                    <span className="wallet-icon text-accent">{getWalletIcon(wallet.type)}</span>
                                    <div className="wallet-info">
                                        <h3>{wallet.name}</h3>
                                        <span className="text-muted">{getWalletLabel(wallet.type)}</span>
                                    </div>
                                </div>
                                <div className="wallet-actions">
                                    <button className="btn-icon" onClick={() => handleEdit(wallet)}>
                                        <FiEdit2 />
                                    </button>
                                    <button className="btn-icon text-danger" onClick={() => handleDelete(wallet.id)}>
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                            <div className="wallet-balance">
                                <div className="balance-label">Current Balance</div>
                                <div className="balance-amount">₹{Number(wallet.balance).toLocaleString()}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal card glass-panel">
                        <h3>{editingId ? "Edit Wallet" : "Add a Wallet"} 💳</h3>
                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Wallet Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. HDFC Checking, ICICI Credit..."
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Wallet Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    {WALLET_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Current Balance (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.balance}
                                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-text" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wallets;
