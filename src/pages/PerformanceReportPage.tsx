import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { apiFetch } from "../lib/apiClient";
import { Button, Card, RadarChartComponent } from "../components";

function getPerformanceLabel(score: number): string {
  if (score >= 4.5) return "High Potential";
  if (score >= 3.5) return "Strong";
  if (score >= 3.0) return "Good";
  if (score >= 2.0) return "Developing";
  return "Needs Improvement";
}

export default function PerformanceReportPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const accessToken = useAuthStore((s) => s.accessToken) || undefined;

  const [report, setReport] = React.useState<{
    overallScore: number;
    keyStrengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
    skillBreakdownJson: Record<string, any>;
  } | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!sessionId) return;
        const res = await apiFetch<any>(`/api/history/${sessionId}`, { accessToken, method: "GET" });
        if (alive) {
          setReport({
            overallScore: res.overallScore,
            keyStrengths: res.keyStrengths || [],
            areasForImprovement: res.areasForImprovement || [],
            recommendations: res.recommendations || [],
            skillBreakdownJson: res.skillBreakdownJson || {},
          });
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [accessToken, sessionId]);

  return (
    <div className="h-screen bg-bg-primary flex flex-col overflow-hidden">
      <header className="bg-card-secondary border-b border-border-primary px-6 py-4 flex items-center justify-between shrink-0">
        <div className="font-semibold text-text-primary text-lg">Interview Performance</div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (!report || !sessionId) return;

              // Generate CSS-based radar chart for download
              const skills = Object.entries(report.skillBreakdownJson);
              const hasSkills = skills.length > 0;
              const svgSize = 400;
              const center = svgSize / 2;
              const radius = 100;
              const maxScore = 5;

              let radarSvg = '';
              if (hasSkills) {
                const angleStep = (2 * Math.PI) / skills.length;
                const points = skills.map(([skill, score], i) => {
                  const angle = i * angleStep - Math.PI / 2;
                  const r = (typeof score === 'number' ? score : 0) / maxScore * radius;
                  return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                }).join(' ');

                const gridCircles = [20, 40, 60, 80, 100].map(r =>
                  `<circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`
                ).join('');

                const axisLines = skills.map((_, i) => {
                  const angle = i * angleStep - Math.PI / 2;
                  const x2 = center + radius * Math.cos(angle);
                  const y2 = center + radius * Math.sin(angle);
                  return `<line x1="${center}" y1="${center}" x2="${x2}" y2="${y2}" stroke="#e2e8f0" stroke-width="1"/>`;
                }).join('');

                const labels = skills.map(([skill], i) => {
                  const angle = i * angleStep - Math.PI / 2;
                  const x = center + (radius + 25) * Math.cos(angle);
                  const y = center + (radius + 25) * Math.sin(angle);
                  const textAnchor = Math.abs(x - center) < 5 ? 'middle' : x > center ? 'start' : 'end';
                  const displaySkill = skill.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  return `<text x="${x}" y="${y}" text-anchor="${textAnchor}" font-size="11" fill="#64748b">${displaySkill}</text>`;
                }).join('');

                radarSvg = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">${gridCircles}${axisLines}<polygon points="${points}" fill="rgba(59,130,246,0.3)" stroke="#3b82f6" stroke-width="2"/>${labels}</svg>`;
              } else {
                radarSvg = '<div style="text-align:center;color:#94a3b8;padding:40px;">No skill data available</div>';
              }

              const html = `<!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="UTF-8">
                <title>Performance Report - ${sessionId}</title>
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; padding: 40px 20px; }
                  .container { max-width: 900px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); padding: 40px; }
                  .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 32px; }
                  .header h1 { font-size: 28px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
                  .header p { color: #64748b; font-size: 14px; }
                  .score-section { display: flex; align-items: center; justify-content: center; gap: 48px; margin-bottom: 32px; flex-wrap: wrap; }
                  .score-circle { width: 140px; height: 140px; border-radius: 50%; border: 6px solid #3b82f6; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                  .score-value { font-size: 36px; font-weight: 700; color: #3b82f6; }
                  .score-label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; }
                  .performance-badge { background: #dbeafe; color: #1d4ed8; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
                  .section { margin-bottom: 24px; }
                  .section-title { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 12px; }
                  .card { background: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0; }
                  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                  ul { list-style: none; }
                  li { padding: 8px 0; padding-left: 20px; position: relative; }
                  li::before { content: "•"; position: absolute; left: 0; color: #3b82f6; font-weight: bold; }
                  .strength li::before { color: #22c55e; }
                  .improvement li::before { color: #f59e0b; }
                  .recommendation li::before { color: #3b82f6; }
                  .empty { color: #94a3b8; font-style: italic; }
                  .radar-container { display: flex; justify-content: center; padding: 20px; }
                  @media print { body { background: #fff; padding: 0; } .container { box-shadow: none; } }
                  @media (max-width: 600px) { .two-col { grid-template-columns: 1fr; } .score-section { gap: 24px; } }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Interview Performance Report</h1>
                    <p>Session: ${sessionId}</p>
                  </div>
                  <div class="score-section">
                    <div class="score-circle">
                      <div class="score-value">${report.overallScore.toFixed(1)}</div>
                      <div class="score-label">Overall Score</div>
                    </div>
                    <div class="performance-badge">${getPerformanceLabel(report.overallScore)}</div>
                  </div>
                  <div class="section">
                    <div class="section-title">Skill Breakdown</div>
                    <div class="card">
                      <div class="radar-container">${radarSvg}</div>
                    </div>
                  </div>
                  <div class="two-col">
                    <div class="section">
                      <div class="section-title">Key Strengths</div>
                      <div class="card">
                        ${report.keyStrengths.length ? `<ul class="strength">${report.keyStrengths.map(s => `<li>${s}</li>`).join('')}</ul>` : '<p class="empty">No strengths recorded.</p>'}
                      </div>
                    </div>
                    <div class="section">
                      <div class="section-title">Areas for Improvement</div>
                      <div class="card">
                        ${report.areasForImprovement.length ? `<ul class="improvement">${report.areasForImprovement.map(s => `<li>${s}</li>`).join('')}</ul>` : '<p class="empty">No improvements recorded.</p>'}
                      </div>
                    </div>
                  </div>
                  ${report.recommendations.length ? `<div class="section"><div class="section-title">Recommendations</div><div class="card"><ul class="recommendation">${report.recommendations.map(r => `<li>${r}</li>`).join('')}</ul></div></div>` : ''}
                </div>
              </body>
              </html>`;
              const blob = new Blob([html], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `performance-report-${sessionId}.html`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            Download Report
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 max-w-5xl mx-auto w-full">
        <div className="text-sm text-text-muted mb-6">Evaluation for session: {sessionId}</div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="p-6">
            <div className="text-xs uppercase tracking-wide text-text-muted font-semibold">Overall Score</div>
            <div className="mt-4 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full border-4 border-primary-200 flex items-center justify-center">
                <div className="text-3xl font-bold text-primary-500">
                  {report ? report.overallScore.toFixed(1) : "—"}
                </div>
              </div>
            </div>
            <div className="text-center mt-2 text-sm text-primary-500 font-semibold">
              {report ? getPerformanceLabel(report.overallScore) : "—"}
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <div className="text-xs uppercase tracking-wide text-text-muted font-semibold">Skill Breakdown</div>
            <div className="mt-4 flex items-center justify-center h-56">
              {report?.skillBreakdownJson && Object.keys(report.skillBreakdownJson).length > 0 ? (
                <RadarChartComponent data={report.skillBreakdownJson} width={320} height={220} />
              ) : (
                <div className="text-text-muted">No skill data available</div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="text-xs uppercase tracking-wide text-text-muted font-semibold">Key Strengths</div>
            <ul className="mt-3 text-sm text-text-primary space-y-2">
              {(report?.keyStrengths || []).length ? (
                report!.keyStrengths.map((s, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-primary-500 mr-2">•</span>
                    <span>{s}</span>
                  </li>
                ))
              ) : (
                <li className="text-text-muted">• No strengths yet.</li>
              )}
            </ul>
          </Card>
          <Card className="p-6">
            <div className="text-xs uppercase tracking-wide text-text-muted font-semibold">Areas for Improvement</div>
            <ul className="mt-3 text-sm text-text-primary space-y-2">
              {(report?.areasForImprovement || []).length ? (
                report!.areasForImprovement.map((s, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-status-warning mr-2">•</span>
                    <span>{s}</span>
                  </li>
                ))
              ) : (
                <li className="text-text-muted">• No improvements yet.</li>
              )}
            </ul>
          </Card>
        </div>

        {report?.recommendations && report.recommendations.length > 0 && (
          <Card className="p-6 mt-6">
            <div className="text-xs uppercase tracking-wide text-text-muted font-semibold">Recommendations</div>
            <ul className="mt-3 text-sm text-text-primary space-y-2">
              {report.recommendations.map((s, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-info mr-2">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
    </div>
  );
}

