import { useEffect, useMemo, useState } from "react";
import api, { aiCategorize, aiGetInsights } from "../api";
import { FiMic } from "react-icons/fi";
import "./AiCoach.css";

const AiCoach = () => {
  const [text, setText] = useState("Bought 2 coffees for ₹120 at Cafe Coffee Day");
  const [isCatLoading, setIsCatLoading] = useState(false);
  const [catError, setCatError] = useState("");
  const [result, setResult] = useState(null);

  const [isInsightLoading, setIsInsightLoading] = useState(true);
  const [insight, setInsight] = useState("");
  const [isListening, setIsListening] = useState(false);

  const canCategorize = useMemo(() => text.trim().length > 0, [text]);

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
      setText(transcript);
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
      const expenseAmount = Number(result.amount);
      await api.post("/transactions", {
        amount: expenseAmount,
        category: result.category || (result.type === "expense" ? "Other" : "Other Income"),
        note: result.note || "",
        type: result.type || "expense",
        date: new Date().toISOString().slice(0, 10),
      });

      if (result.type === "expense" && expenseAmount >= 500) {
        import("../utils/notifications").then(({ sendBudgetAlert }) => {
          sendBudgetAlert(expenseAmount, result.category || "Other");
        });
      }

      setCatError("");
      alert("Transaction successfully logged to your History!");
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
              placeholder='e.g. "Paid ₹4500 rent" or "Got salary ₹52000"'
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-icon"
                onClick={handleVoiceInput}
                disabled={isCatLoading}
                style={{
                  flex: '0 0 auto',
                  backgroundColor: isListening ? 'var(--color-danger)' : 'var(--color-bg-tertiary)',
                  color: isListening ? '#fff' : 'var(--color-text-primary)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'all 0.2s ease',
                  padding: '0 1rem',
                  borderRadius: 'var(--radius-md)'
                }}
                title="Use Voice Input"
              >
                <FiMic size={20} />
              </button>
              <button className="btn-primary" type="submit" disabled={!canCategorize || isCatLoading} style={{ flex: 1 }}>
                {isCatLoading ? "Categorizing..." : "Categorize"}
              </button>
            </div>
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
                <span className="value">₹{Number(result.amount).toLocaleString()}</span>
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


