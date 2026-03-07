import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSend } from "react-icons/fi";
import api from "../api";
import PasswordGate from "../components/PasswordGate";
import "./Transfers.css";

const Transfers = ({ user }) => {
    const navigate = useNavigate();
    const [unlocked, setUnlocked] = useState(false);
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const [formData, setFormData] = useState({
        fromWalletId: "",
        toWalletId: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        note: "",
    });

    useEffect(() => {
        fetchWallets();
    }, [user]);

    const fetchWallets = async () => {
        try {
            const response = await api.get("/wallets");
            setWallets(response.data);
            if (response.data.length >= 2) {
                setFormData((prev) => ({
                    ...prev,
                    fromWalletId: response.data[0].id,
                    toWalletId: response.data[1].id,
                }));
            }
        } catch (error) {
            console.error("Error fetching wallets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        if (formData.fromWalletId === formData.toWalletId) {
            setErrorMsg("Cannot transfer to the same wallet");
            return;
        }

        if (Number(formData.amount) <= 0) {
            setErrorMsg("Amount must be greater than 0");
            return;
        }

        setSubmitting(true);
        try {
            await api.post("/wallets/transfer", formData);
            setSuccessMsg(`Successfully transferred ₹${formData.amount}!`);
            setFormData((prev) => ({ ...prev, amount: "", note: "" }));
            // Optionally refresh wallets or show new balances
            fetchWallets();
        } catch (error) {
            console.error("Error transferring money:", error);
            setErrorMsg(error.response?.data?.error || "Failed to transfer money. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!unlocked) {
        return (
            <PasswordGate
                title="Wallet Transfers"
                onSuccess={() => setUnlocked(true)}
                onCancel={() => navigate(-1)}
            />
        );
    }

    if (loading) {
        return (
            <div className="page flex-center">
                Loading...
            </div>
        );
    }

    if (wallets.length < 2) {
        return (
            <div className="page transfers">
                <header className="page-header">
                    <h1>Wallet Transfers 🔄</h1>
                    <p>Move money between your checking, credit cards, or digital wallets.</p>
                </header>
                <div className="card glass-panel flex-center" style={{ padding: "3rem", flexDirection: "column", gap: "1rem" }}>
                    <h3>Not enough wallets</h3>
                    <p className="text-muted">You need at least 2 wallets to make a transfer. Go to the Wallets page to add them.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page transfers">
            <header className="page-header">
                <h1>Wallet Transfers 🔄</h1>
                <p>Move money between your accounts instantly.</p>
            </header>

            <div className="transfer-container">
                <div className="card glass-panel transfer-card">
                    {successMsg && <div className="transfer-alert success">{successMsg}</div>}
                    {errorMsg && <div className="transfer-alert error">{errorMsg}</div>}

                    <form className="transfer-form" onSubmit={handleSubmit}>
                        <div className="transfer-row">
                            <div className="form-group flex-1">
                                <label>From</label>
                                <select
                                    value={formData.fromWalletId}
                                    onChange={(e) => setFormData({ ...formData, fromWalletId: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>Select Source Wallet</option>
                                    {wallets.map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.name} (₹{Number(w.balance).toLocaleString()})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="transfer-icon flex-center">
                                <FiSend />
                            </div>

                            <div className="form-group flex-1">
                                <label>To</label>
                                <select
                                    value={formData.toWalletId}
                                    onChange={(e) => setFormData({ ...formData, toWalletId: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>Select Destination Wallet</option>
                                    {wallets
                                        .filter((w) => w.id !== formData.fromWalletId)
                                        .map((w) => (
                                            <option key={w.id} value={w.id}>
                                                {w.name} (₹{Number(w.balance).toLocaleString()})
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Amount to Transfer (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Note (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Paid off credit card balance"
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary transfer-submit"
                            disabled={submitting}
                        >
                            {submitting ? "Processing..." : "Transfer Funds"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Transfers;
