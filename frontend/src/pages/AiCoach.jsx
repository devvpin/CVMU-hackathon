import { useEffect, useMemo, useState } from "react";
import api, { aiCategorize, aiGetInsights } from "../api";
import "./AiCoach.css";

const AiCoach = () => {
  const [text, setText] = useState("Bought 2 coffees for $12 at Starbucks");
  const [isCatLoading, setIsCatLoading] = useState(false);
  const [catError, setCatError] = useState("");
  const [result, setResult] = useState(null);

  const [isInsightLoading, setIsInsightLoading] = useState(true);
  const [insight, setInsight] = useState("");

  const canCategorize = useMemo(() => text.trim().length > 0, [text]);

  useEffect(() => {
    const fetchInsight = async () => {
      setIsInsightLoading(true);
      try {
        const [transRes, budgetsRes] = await Promise.all([
          api.get("/transactions"),
          api.get("/budgets").catch(() => ({ data: [] })),
        ]);
        const transactions = transRes.data || [];
        const budgets = budgetsRes.data || [];
        const aiRes = await aiGetInsights(transactions.slice(0, 50), budgets);
        setInsight(aiRes.insight || "");
      } catch (e) {
        console.error("AI insight failed:", e);
        setInsight("Could not load insight. Please check backend / AI key config.");
      } finally {
        setIsInsightLoading(false);
      }
    };
    fetchInsight();
  }, []);

  const onCategorize = async (e) => {
    e.preventDefault();
    if (!canCategorize) return;

    setIsCatLoading(true);
    setCatError("");
    setResult(null);
    try {
      const data = await aiCategorize(text.trim());
      setResult(data);
    } catch (err) {
      console.error("Categorize failed:", err);
      const msg =
        err?.response?.data?.error ||
        "Could not categorize. Ensure backend is running and GEMINI_API_KEY is configured.";
      setCatError(msg);
    } finally {
      setIsCatLoading(false);
    }
  };

  const onCreateTransaction = async () => {
    if (!result) return;
    try {
      await api.post("/transactions", {
        amount: Number(result.amount),
        category: result.category,
        description: result.description,
        type: result.type,
        date: new Date().toISOString().slice(0, 10),
      });
      setCatError("");
      alert("Transaction created!");
    } catch (e) {
      console.error("Create transaction failed:", e);
      alert("Could not create transaction.");
    }
  };

  return (
    <div className="page ai-coach">
      <header className="page-header">
        <h1>🤖 AI Coach</h1>
        <p>Turn plain English into a transaction and get a quick money tip.</p>
      </header>

      <div className="ai-grid">
        <section className="card glass-panel ai-panel">
          <h3>Auto-categorize a transaction</h3>
          <form onSubmit={onCategorize} className="ai-form">
            <label htmlFor="txText">Describe it</label>
            <textarea
              id="txText"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder='e.g. "Paid $450 rent" or "Got salary 5200"'
            />
            <button className="btn-primary" type="submit" disabled={!canCategorize || isCatLoading}>
              {isCatLoading ? "Categorizing..." : "Categorize"}
            </button>
          </form>

          {catError && <div className="ai-error">{catError}</div>}

          {result && (
            <div className="ai-result">
              <div className="ai-result-row">
                <span className="label">Type</span>
                <span className="value">{result.type}</span>
              </div>
              <div className="ai-result-row">
                <span className="label">Amount</span>
                <span className="value">${Number(result.amount).toLocaleString()}</span>
              </div>
              <div className="ai-result-row">
                <span className="label">Category</span>
                <span className="value">{result.category}</span>
              </div>
              <div className="ai-result-row">
                <span className="label">Description</span>
                <span className="value">{result.description}</span>
              </div>

              <div className="ai-actions">
                <button className="btn-secondary" type="button" onClick={onCreateTransaction}>
                  Create transaction
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="card glass-panel ai-panel">
          <h3>Your quick insight</h3>
          {isInsightLoading ? (
            <p className="text-muted">Thinking…</p>
          ) : (
            <div className="ai-insight">
              <p>{insight}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AiCoach;


