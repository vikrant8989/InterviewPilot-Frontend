import { getWsBaseUrl } from "./config";

export type WsEvent =
  | { event: "agent_question"; payload: any }
  | { event: "joined"; payload: any }
  | { event: "transcript_ready"; payload: any }
  | { event: "agent_evaluation_ready"; payload: any }
  | { event: "agent_followup_question"; payload: any }
  | { event: "session_ended"; payload: any }
  | { event: "error"; payload: { code?: string; message: string } }
  | { event: string; payload: any };

export function connectInterviewSocket(opts: {
  sessionId: string;
  accessToken?: string;
  clientMode?: "text" | "voice" | "video";
  onEvent: (evt: WsEvent) => void;
}) {
  const { sessionId, accessToken, clientMode, onEvent } = opts;
  const wsBase = getWsBaseUrl();
  const url = new URL(`${wsBase}/ws/interview`);
  url.searchParams.set("sessionId", sessionId);
  if (accessToken) url.searchParams.set("token", accessToken);

  const ws = new WebSocket(url.toString());
  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        event: "join_session",
        payload: { clientCapabilities: { mode: clientMode ?? "text" } },
      }),
    );
  };
  ws.onmessage = (m) => {
    try {
      const data = JSON.parse(m.data) as WsEvent;
      onEvent(data);
    } catch {
      onEvent({ event: "error", payload: { message: "Invalid WS message" } });
    }
  };
  return ws;
}

