import { useState } from "react";
import { FiUsers, FiDollarSign, FiShare2 } from "react-icons/fi";
import "./SplitBills.css";

const SplitBills = () => {
    const [total, setTotal] = useState("");
    const [people, setPeople] = useState("2");
    const [tipPercentage, setTipPercentage] = useState("0");
    const [taxAmount, setTaxAmount] = useState("");

    const totalAmount = parseFloat(total) || 0;
    const tax = parseFloat(taxAmount) || 0;
    const peopleCount = parseInt(people) || 1;
    const tip = (totalAmount * (parseFloat(tipPercentage) || 0)) / 100;

    const grandTotal = totalAmount + tax + tip;
    const perPerson = grandTotal / Math.max(1, peopleCount);

    const handleShare = async () => {
        const text = `Hey! Here's the split for our bill:\n\nSubtotal: $${totalAmount.toFixed(2)}\nTax: $${tax.toFixed(2)}\nTip (${tipPercentage}%): $${tip.toFixed(2)}\nGrand Total: $${grandTotal.toFixed(2)}\n\nYour share (${peopleCount} ways): $${perPerson.toFixed(2)}\n\nPlease send it to me soon! 💸`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Bill Split',
                    text: text,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(text);
            alert("Copied to clipboard!");
        }
    };

    return (
        <div className="page split-bills">
            <header className="page-header">
                <div>
                    <h1>Split a Bill 🍕</h1>
                    <p>Calculate exactly who owes what</p>
                </div>
            </header>

            <div className="card glass-panel split-container">
                <div className="split-form">
                    <div className="form-group">
                        <label>Total Bill Amount</label>
                        <div className="input-with-icon">
                            <FiDollarSign className="input-icon" />
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={total}
                                onChange={(e) => setTotal(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Additional Tax</label>
                        <div className="input-with-icon">
                            <FiDollarSign className="input-icon" />
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={taxAmount}
                                onChange={(e) => setTaxAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Tip Percentage: {tipPercentage}%</label>
                        <input
                            type="range"
                            min="0"
                            max="30"
                            step="5"
                            value={tipPercentage}
                            onChange={(e) => setTipPercentage(e.target.value)}
                            className="slider"
                        />
                    </div>

                    <div className="form-group">
                        <label>How many people?</label>
                        <div className="input-with-icon">
                            <FiUsers className="input-icon" />
                            <input
                                type="number"
                                min="1"
                                value={people}
                                onChange={(e) => setPeople(e.target.value)}
                                placeholder="2"
                            />
                        </div>
                    </div>
                </div>

                <div className="split-results text-center">
                    <h3 className="text-secondary">Grand Total</h3>
                    <h2 className="grand-total">${grandTotal.toFixed(2)}</h2>

                    <div className="per-person-box text-accent">
                        <h4>Each Person Pays</h4>
                        <h1 className="highlight">${perPerson.toFixed(2)}</h1>
                    </div>

                    <button
                        className="btn-primary flex-center share-btn"
                        onClick={handleShare}
                        disabled={grandTotal <= 0}
                    >
                        <FiShare2 /> Share Request
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SplitBills;
