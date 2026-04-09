import React from "react";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "../store/sessionStore";
import { Button, Card } from "../components";

const roles = ["SDE", "Frontend", "Backend", "Data Science", "Product Manager", "ML Engineer", "DevOps", "Designer"] as const;
const companies = ["Google", "Amazon", "Stripe", "Early Startup", "Late Startup", "Open Source", "Consultancy", "Custom"] as const;
const modes = [
  { id: "text", label: "Text Chat" },
  { id: "voice", label: "Voice Call" },
  { id: "video", label: "Video Call" },
] as const;
const difficulties = ["Easy", "Medium", "Hard"] as const;
const questionCountOptions = [5, 10, 15, 20] as const;

function Tile({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "border rounded-xl px-4 py-4 text-left transition-all duration-200",
        selected 
          ? "border-primary-500 ring-2 ring-primary-500/20 bg-primary-500/5" 
          : "border-border-primary hover:bg-bg-tertiary",
      ].join(" ")}
    >
      <div className={`text-sm font-semibold ${selected ? 'text-primary-500' : 'text-text-primary'}`}>
        {label}
      </div>
    </button>
  );
}

export default function ConfigureSessionPage() {
  const navigate = useNavigate();
  const config = useSessionStore((s) => s.config);
  const setConfig = useSessionStore((s) => s.setConfig);
  const createSession = useSessionStore((s) => s.createSession);
  const startSession = useSessionStore((s) => s.startSession);
  const sessionId = useSessionStore((s) => s.sessionId);
  const clearHistory = useSessionStore((s) => s.clearHistory);

  const [loading, setLoading] = React.useState(false);

  async function onStart() {
    setLoading(true);
    try {
      clearHistory();
      await createSession();
      await startSession();
      const id = useSessionStore.getState().sessionId;
      if (id) navigate(`/interview/${id}`, { replace: true });
    } catch (error) {
      console.error("Error starting interview:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen bg-bg-primary flex flex-col overflow-hidden">
      <header className="bg-card-secondary border-b border-border-primary px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-text-primary text-lg">Configure Your Session</h1>
            <p className="text-sm text-text-secondary mt-1">Personalize the AI to match your upcoming interview.</p>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 max-w-6xl mx-auto w-full">
        <Card className="p-6 mb-8">
          <section>
            <div className="text-xs uppercase tracking-wide text-text-muted font-semibold mb-4">Interview Mode</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {modes.map((m) => (
                <Tile key={m.id} label={m.label} selected={config.interviewMode === m.id} onClick={() => setConfig({ interviewMode: m.id })} />
              ))}
            </div>
          </section>
        </Card>

        <Card className="p-6 mb-8">
          <section>
            <div className="text-xs uppercase tracking-wide text-text-muted font-semibold mb-4">Target Role</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {roles.map((r) => (
                <Tile key={r} label={r} selected={config.targetRole === r} onClick={() => setConfig({ targetRole: r })} />
              ))}
            </div>
          </section>
        </Card>

        <Card className="p-6 mb-8">
          <section>
            <div className="text-xs uppercase tracking-wide text-text-muted font-semibold mb-4">Target Company Style</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {companies.map((c) => (
                <Tile key={c} label={c} selected={config.company === c} onClick={() => setConfig({ company: c })} />
              ))}
            </div>
          </section>
        </Card>

        <Card className="p-6 mb-8">
          <section>
            <div className="text-xs uppercase tracking-wide text-text-muted font-semibold mb-4">Difficulty Level</div>
            <div className="flex gap-4">
              {difficulties.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setConfig({ difficulty: d })}
                  className={[
                    "px-6 py-2 rounded-full border text-sm font-semibold transition-all duration-200",
                    config.difficulty === d
                      ? d === "Hard"
                        ? "border-status-error bg-status-error/10 text-status-error"
                        : d === "Medium"
                          ? "border-status-warning bg-status-warning/10 text-status-warning"
                          : "border-status-success bg-status-success/10 text-status-success"
                      : "border-border-primary bg-card-secondary text-text-primary hover:bg-bg-tertiary",
                  ].join(" ")}
                >
                  {d}
                </button>
              ))}
            </div>
          </section>
        </Card>

        <Card className="p-6 mb-8">
          <section>
            <div className="text-xs uppercase tracking-wide text-text-muted font-semibold mb-4">Number of Questions</div>
            <div className="flex gap-3 flex-wrap">
              {questionCountOptions.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setConfig({ maxTurns: count })}
                  className={[
                    "px-5 py-3 rounded-xl border text-sm font-semibold transition-all duration-200",
                    config.maxTurns === count
                      ? "border-primary-500 bg-primary-500/5 text-primary-500"
                      : "border-border-primary bg-card-secondary text-text-primary hover:bg-bg-tertiary",
                  ].join(" ")}
                >
                  {count} Questions
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-3">
              {config.maxTurns <= 5 ? "Quick practice session" : 
               config.maxTurns <= 10 ? "Standard interview length" : 
               "Comprehensive full interview"}
            </p>
          </section>
        </Card>

        <Card className="p-6 mb-8">
          <section>
            <div className="text-xs uppercase tracking-wide text-text-muted font-semibold mb-4">Interview Rounds</div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => setConfig({ multiAgent: true })}
                className={[
                  "px-6 py-3 rounded-xl border text-sm font-semibold text-left transition-all duration-200",
                  config.multiAgent
                    ? "border-primary-500 bg-primary-500/5 text-primary-500"
                    : "border-border-primary bg-card-secondary text-text-primary hover:bg-bg-tertiary",
                ].join(" ")}
              >
                HR + Tech + Hiring Manager
              </button>
              <button
                type="button"
                onClick={() => setConfig({ multiAgent: false })}
                className={[
                  "px-6 py-3 rounded-xl border text-sm font-semibold text-left transition-all duration-200",
                  !config.multiAgent
                    ? "border-primary-500 bg-primary-500/5 text-primary-500"
                    : "border-border-primary bg-card-secondary text-text-primary hover:bg-bg-tertiary",
                ].join(" ")}
              >
                Single Dynamic Agent
              </button>
            </div>
          </section>
        </Card>

        <div className="mt-10">
          <Button
            variant="primary"
            size="lg"
            onClick={onStart}
            loading={loading}
            disabled={loading}
            className="w-full"
          >
            {loading
              ? "Starting..."
              : config.interviewMode === "text"
                ? "Start Text Interview →"
                : config.interviewMode === "voice"
                  ? "Start Voice Interview →"
                  : "Start Video Interview →"}
          </Button>
          {sessionId && (
            <div className="text-xs text-text-muted mt-2 text-center">Session ready: {sessionId}</div>
          )}
        </div>
      </main>
    </div>
  );
}

