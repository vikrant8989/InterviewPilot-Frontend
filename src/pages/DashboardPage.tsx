import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useSessionStore } from "../store/sessionStore";
import { apiFetch } from "../lib/apiClient";
import { Button, Card, ThemeToggle } from "../components";

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken) || undefined;
  const setSessionId = useSessionStore((s) => s.setSessionId);
  const clearHistory = useSessionStore((s) => s.clearHistory);

  const [items, setItems] = React.useState<
    Array<{
      sessionId: string;
      company: string;
      targetRole: string;
      mode?: string | null;
      difficulty?: string | null;
      date?: string | null;
      overallScore?: number | null;
      startedAt?: string | null;
      endedAt?: string | null;
      status?: string | null;
    }>
  >([]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch<{ items: any[] }>("/api/history", { accessToken, method: "GET" });
        if (alive) setItems(res.items || []);
      } catch {
        // Keep dashboard usable even if history is temporarily unavailable.
      }
    })();
    return () => {
      alive = false;
    };
  }, [accessToken]);

  const completedSessions = items.filter(it => it.endedAt || typeof it.overallScore === "number");
  const inProgressSessions = items.filter(it => !it.endedAt && typeof it.overallScore !== "number" && it.startedAt);

  const totalSessions = completedSessions.length;
  const avgScore =
    completedSessions.length > 0
      ? completedSessions.reduce((acc, it) => acc + (typeof it.overallScore === "number" ? it.overallScore : 0), 0) /
        Math.max(1, completedSessions.filter((it) => typeof it.overallScore === "number").length || 1)
      : 0;
  const improvementPct =
    completedSessions.length >= 2 &&
    typeof completedSessions[0]?.overallScore === "number" &&
    typeof completedSessions[completedSessions.length - 1]?.overallScore === "number"
      ? ((completedSessions[0].overallScore! - completedSessions[completedSessions.length - 1].overallScore!) / Math.max(0.01, completedSessions[completedSessions.length - 1].overallScore!)) *
        100
      : null;

  const hoursPracticed = completedSessions.reduce((acc, it) => {
    if (!it.startedAt || !it.endedAt) return acc;
    const s = new Date(it.startedAt).getTime();
    const e = new Date(it.endedAt).getTime();
    if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return acc;
    return acc + (e - s) / (1000 * 60 * 60);
  }, 0);

  async function resumeSession(sessionId: string) {
    clearHistory();
    setSessionId(sessionId);
    navigate(`/interview/${sessionId}`);
  }

  return (
    <div className="h-screen bg-bg-primary flex flex-col overflow-hidden">
      <header className="bg-card-secondary border-b border-border-primary px-6 py-4 flex items-center justify-between shrink-0">
        <div className="font-semibold text-text-primary text-lg">
          AI Interview Pro
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            onClick={() => navigate("/configure-session")}
          >
            New Interview
          </Button>
          <ThemeToggle />
          <div className="text-sm text-text-secondary">{user?.name ? `Welcome back, ${user.name}` : "Welcome!"}</div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="text-sm text-text-secondary mb-2">Total Sessions</div>
            <div className="text-3xl font-semibold text-text-primary">{totalSessions}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-text-secondary mb-2">In Progress</div>
            <div className="text-3xl font-semibold text-status-warning">{inProgressSessions.length}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-text-secondary mb-2">Avg Score</div>
            <div className="text-3xl font-semibold text-primary-500">{avgScore ? avgScore.toFixed(1) : "0.0"}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-text-secondary mb-2">Hours Practiced</div>
            <div className="text-3xl font-semibold text-text-primary">{hoursPracticed.toFixed(1)}h</div>
          </Card>
        </div>

        {/* In Progress Sessions */}
        {inProgressSessions.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-warning animate-pulse"></span>
                In Progress
              </h2>
            </div>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-tertiary border-b border-border-primary">
                    <tr className="text-left">
                      <th className="p-4 font-medium text-text-secondary">Company & Role</th>
                      <th className="p-4 font-medium text-text-secondary">Mode</th>
                      <th className="p-4 font-medium text-text-secondary">Difficulty</th>
                      <th className="p-4 font-medium text-text-secondary">Started</th>
                      <th className="p-4 font-medium text-text-secondary">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inProgressSessions.map((s) => (
                      <tr key={s.sessionId} className="border-b border-border-primary hover:bg-bg-tertiary transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-text-primary">{s.company}</div>
                          <div className="text-text-secondary">{s.targetRole}</div>
                        </td>
                        <td className="p-4 text-text-secondary">{s.mode || "—"}</td>
                        <td className="p-4">
                          <span
                            className={
                              s.difficulty === "Hard"
                                ? "text-xs px-2 py-1 rounded-lg bg-status-error/10 text-status-error border border-status-error/20"
                                : s.difficulty === "Medium"
                                  ? "text-xs px-2 py-1 rounded-lg bg-status-warning/10 text-status-warning border border-status-warning/20"
                                  : "text-xs px-2 py-1 rounded-lg bg-status-success/10 text-status-success border border-status-success/20"
                            }
                          >
                            {s.difficulty || "—"}
                          </span>
                        </td>
                        <td className="p-4 text-text-secondary">
                          {s.startedAt ? new Date(s.startedAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="p-4">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => resumeSession(s.sessionId)}
                          >
                            Resume Interview
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary">Completed Sessions</h2>
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-tertiary border-b border-border-primary">
                  <tr className="text-left">
                    <th className="p-4 font-medium text-text-secondary">Company & Role</th>
                    <th className="p-4 font-medium text-text-secondary">Mode</th>
                    <th className="p-4 font-medium text-text-secondary">Difficulty</th>
                    <th className="p-4 font-medium text-text-secondary">Date</th>
                    <th className="p-4 font-medium text-text-secondary">Score</th>
                    <th className="p-4 font-medium text-text-secondary">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {completedSessions.map((s) => (
                    <tr key={s.sessionId} className="border-b border-border-primary hover:bg-bg-tertiary transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-text-primary">{s.company}</div>
                        <div className="text-text-secondary">{s.targetRole}</div>
                      </td>
                      <td className="p-4 text-text-secondary">{s.mode || "—"}</td>
                      <td className="p-4">
                        <span
                          className={
                            s.difficulty === "Hard"
                              ? "text-xs px-2 py-1 rounded-lg bg-status-error/10 text-status-error border border-status-error/20"
                              : s.difficulty === "Medium"
                                ? "text-xs px-2 py-1 rounded-lg bg-status-warning/10 text-status-warning border border-status-warning/20"
                                : "text-xs px-2 py-1 rounded-lg bg-status-success/10 text-status-success border border-status-success/20"
                          }
                        >
                          {s.difficulty || "—"}
                        </span>
                      </td>
                      <td className="p-4 text-text-secondary">{s.date ? s.date.slice(0, 10) : "—"}</td>
                      <td className="p-4">
                        <span className="font-medium text-text-primary">
                          {typeof s.overallScore === "number" ? s.overallScore.toFixed(1) : "—"}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/report/${s.sessionId}`)}
                          disabled={typeof s.overallScore !== "number"}
                        >
                          View Feedback
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {completedSessions.length === 0 && (
                    <tr>
                      <td className="p-4 text-text-muted" colSpan={6}>
                        No completed sessions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}

