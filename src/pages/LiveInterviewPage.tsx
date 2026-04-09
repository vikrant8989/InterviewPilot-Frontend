import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useSessionStore } from "../store/sessionStore";
import { connectInterviewSocket, WsEvent } from "../lib/wsClient";
import { apiFetch } from "../lib/apiClient";
import { Button, Card } from "../components";

type ChatMessage = {
  turnIndex: number;
  type: "question" | "answer" | "evaluation";
  content: string;
  interviewerType?: string;
  questionType?: string;
  evaluation?: any;
};

export default function LiveInterviewPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  const accessToken = useAuthStore((s) => s.accessToken) || undefined;
  const currentQuestion = useSessionStore((s) => s.currentQuestion);
  const setCurrentQuestion = useSessionStore((s) => s.setCurrentQuestion);
  const conversationHistory = useSessionStore((s) => s.conversationHistory);
  const addToHistory = useSessionStore((s) => s.addToHistory);
  const interviewMode = useSessionStore((s) => s.config.interviewMode);
  const maxTurns = useSessionStore((s) => s.config.maxTurns);
  const [answerText, setAnswerText] = React.useState("");
  const [status, setStatus] = React.useState<string>("Connecting...");
  const [turnIndex, setTurnIndex] = React.useState(0);
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = React.useState(false);
  const [isInterviewEnded, setIsInterviewEnded] = React.useState(false);

  const [wsError, setWsError] = React.useState<string | null>(null);
  const wsRef = React.useRef<WebSocket | null>(null);

  const [questionAudioUrl, setQuestionAudioUrl] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const [recording, setRecording] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const recordedChunksRef = React.useRef<Blob[]>([]);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const previewStreamRef = React.useRef<MediaStream | null>(null);
  const localRecordingRef = React.useRef<MediaRecorder | null>(null);
  const localRecordingChunksRef = React.useRef<Blob[]>([]);
  const [localRecordingUrl, setLocalRecordingUrl] = React.useState<string | null>(null);

  const [proctorTabSwitchCount, setProctorTabSwitchCount] = React.useState(0);
  const [proctorFocusLostCount, setProctorFocusLostCount] = React.useState(0);
  const lastProctorSentAtRef = React.useRef<{ [k: string]: number }>({});

  // Load session history when resuming
  React.useEffect(() => {
    if (!sessionId) return;
    
    async function loadSessionHistory() {
      try {
        const res = await apiFetch<{ sessionId: string; turns: Array<{ turnIndex: number; questionText: string; questionType: string | null; userAnswerText: string | null; evaluationStatus: string }>; maxTurns: number; status: string }>(
          `/api/sessions/${sessionId}/turns`,
          { accessToken, method: "GET" }
        );
        
        // If session is already completed, check for report and redirect
        if (res.status === "COMPLETED") {
          // Try to end session to ensure report is generated
          try {
            await apiFetch(`/api/sessions/${sessionId}/end`, {
              method: "POST",
              accessToken,
            });
          } catch {
            // Ignore error - report may already exist
          }
          // Redirect to report
          navigate(`/report/${sessionId}`, { replace: true });
          return;
        }
        
        if (res.turns && res.turns.length > 0) {
          const loadedMessages: ChatMessage[] = [];
          
          for (const turn of res.turns) {
            // Add question
            loadedMessages.push({
              turnIndex: turn.turnIndex,
              type: "question",
              content: turn.questionText,
              interviewerType: "TECH", // Default, will be updated by WebSocket
              questionType: turn.questionType || "—",
            });
            
            // Add answer if exists
            if (turn.userAnswerText) {
              loadedMessages.push({
                turnIndex: turn.turnIndex,
                type: "answer",
                content: turn.userAnswerText,
              });
            }
          }
          
          setChatMessages(loadedMessages);
          
          // Find the current turn (last turn without answer or with pending evaluation)
          const lastTurn = res.turns[res.turns.length - 1];
          if (lastTurn && !lastTurn.userAnswerText) {
            setTurnIndex(lastTurn.turnIndex);
            setCurrentQuestion({
              question_text: lastTurn.questionText,
              question_type: lastTurn.questionType || undefined,
              turn_index: lastTurn.turnIndex,
            });
          } else if (lastTurn) {
            setTurnIndex(lastTurn.turnIndex + 1);
          }
        }
      } catch (err) {
        // Silent fail - WebSocket will provide current state
      }
    }
    
    loadSessionHistory();
  }, [sessionId, accessToken, setCurrentQuestion, navigate]);

  React.useEffect(() => {
    return () => {
      if (localRecordingUrl) {
        try {
          URL.revokeObjectURL(localRecordingUrl);
        } catch {
          // ignore
        }
      }
    };
  }, [localRecordingUrl]);

  React.useEffect(() => {
    if (!sessionId) return;

    setStatus("Connecting...");
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = connectInterviewSocket({
      sessionId,
      accessToken,
      clientMode: interviewMode as any,
      onEvent: (evt: WsEvent) => {
        if (evt.event === "joined") {
          setStatus("Connected. Interview started.");
          return;
        }

        if (evt.event === "agent_question") {
          setWsError(null);
          setIsAiTyping(false);
          const payload: any = (evt as any).payload;
          const newTurnIndex = Number(payload?.turnIndex ?? 0);
          setTurnIndex(newTurnIndex);
          setQuestionAudioUrl(payload?.question_audio_url || null);
          
          const questionData = {
            question_text: payload?.question_text,
            question_type: payload?.question_type,
            interviewer_type: payload?.interviewer_type,
            follow_up_text: payload?.follow_up_text,
            turn_index: newTurnIndex,
          };
          
          setCurrentQuestion(questionData);
          
          // Add question to chat
          const newMessage: ChatMessage = {
            turnIndex: newTurnIndex,
            type: "question",
            content: payload?.question_text || "",
            interviewerType: payload?.interviewer_type || "TECH",
            questionType: payload?.question_type || "—",
          };
          
          setChatMessages((prev) => {
            const filtered = prev.filter(m => !(m.type === "question" && m.turnIndex === newTurnIndex));
            return [...filtered, newMessage];
          });
          
          // Add to history store
          addToHistory({ turnIndex: newTurnIndex, question: questionData });
          
          setStatus(`Question ${newTurnIndex + 1} of ${maxTurns}`);
          return;
        }

        if (evt.event === "agent_evaluation_ready") {
          setIsAiTyping(false);
          const payload: any = (evt as any).payload;
          const evalTurnIndex = Number(payload?.turnIndex ?? 0);
          
          // Add evaluation to chat
          const evalMessage: ChatMessage = {
            turnIndex: evalTurnIndex,
            type: "evaluation",
            content: `Score: ${payload?.finalScoreJson?.overall ?? "—"}/10`,
            evaluation: payload?.finalScoreJson,
          };
          
          setChatMessages((prev) => [...prev, evalMessage]);
          
          setStatus("Evaluation ready.");
          return;
        }

        if (evt.event === "session_ended") {
          setStatus("Session ended.");
          setIsInterviewEnded(true);
          setTimeout(() => {
            navigate(`/report/${sessionId}`, { replace: true });
          }, 1500);
          return;
        }

        if (evt.event === "error") {
          setWsError(evt.payload?.message || "WebSocket error");
          setStatus("Error");
        }
      },
    });

    wsRef.current = ws;

    return () => {
      try {
        ws.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    };
  }, [accessToken, navigate, sessionId, setCurrentQuestion]);

  React.useEffect(() => {
    function maybeSendProctor(type: "tab_switch" | "focus_lost") {
      const now = Date.now();
      const last = lastProctorSentAtRef.current[type] || 0;
      if (now - last < 5000) return; // throttle
      lastProctorSentAtRef.current[type] = now;

      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      ws.send(
        JSON.stringify({
          event: "client_proctor_event",
          payload: { type, at: now },
        }),
      );

      if (type === "tab_switch") setProctorTabSwitchCount((c) => c + 1);
      if (type === "focus_lost") setProctorFocusLostCount((c) => c + 1);
    }

    const onVisibilityChange = () => {
      if (document.hidden) maybeSendProctor("tab_switch");
    };

    const onBlur = () => {
      maybeSendProctor("focus_lost");
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  React.useEffect(() => {
    if (!questionAudioUrl) return;
    if (!audioRef.current) return;

    const a = audioRef.current;
    a.src = questionAudioUrl;
    a.load();
    // Autoplay may be blocked; provide play button as fallback.
    const p = a.play();
    if (p && typeof (p as any).catch === "function") {
      (p as any).catch(() => {
        // ignore autoplay block
      });
    }
  }, [questionAudioUrl]);

  async function onSubmitAnswer(e: React.FormEvent) {
    e.preventDefault();
    setWsError(null);

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setWsError("WebSocket not connected");
      return;
    }
    if (!answerText.trim()) {
      setWsError("Please enter your answer.");
      return;
    }

    // Add answer to chat immediately
    setIsAiTyping(true);
    const answerMessage: ChatMessage = {
      turnIndex,
      type: "answer",
      content: answerText,
    };
    setChatMessages((prev) => [...prev, answerMessage]);

    ws.send(
      JSON.stringify({
        event: "text_answer_submitted",
        payload: { turnIndex, answerText },
      }),
    );
    setAnswerText("");
    setStatus("Answer sent. Waiting for evaluation...");
  }

  async function uploadVoiceTurnAnswer(chunks: Blob[], mimeType: string) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setWsError("WebSocket not connected");
      return;
    }
    if (!sessionId) return;

    setUploading(true);
    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunkBlob = chunks[i];
        const isFinalChunk = i === chunks.length - 1;

        const presign = await apiFetch<{ uploadUrl: string; r2AudioKey: string }>(
          "/api/uploads/presign",
          {
            method: "POST",
            accessToken,
            body: JSON.stringify({
              sessionId,
              turnIndex,
              chunkIndex: i,
              mimeType,
            }),
          },
        );

        await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": mimeType },
          body: chunkBlob,
        });

        ws.send(
          JSON.stringify({
            event: "answer_chunk_uploaded",
            payload: {
              turnIndex,
              chunkIndex: i,
              r2AudioKey: presign.r2AudioKey,
              mimeType,
              isFinalChunk,
            },
          }),
        );
      }
    } finally {
      setUploading(false);
    }
  }

  async function startRecording() {
    if (!sessionId) return;
    setWsError(null);

    setLocalRecordingUrl(null);
    localRecordingChunksRef.current = [];
    recordedChunksRef.current = [];

    const supportedAudioTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    const audioMimeType =
      supportedAudioTypes.find((t) => (window as any).MediaRecorder?.isTypeSupported?.(t)) || "";

    if (interviewMode === "video") {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      mediaStreamRef.current = stream;
      previewStreamRef.current = stream;

      // Local-only video preview (no streaming to backend).
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // ignore autoplay/permission restrictions
        }
      }

      // Audio-only stream for transcription pipeline (avoid video upload costs).
      const audioTracks = stream.getAudioTracks();
      const audioStream = new MediaStream(audioTracks);
      const recorder = new MediaRecorder(audioStream, audioMimeType ? { mimeType: audioMimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) recordedChunksRef.current.push(ev.data);
      };

      // Optional local record (audio+video) for download later.
      try {
        const localRecorder = new MediaRecorder(stream, undefined);
        localRecordingRef.current = localRecorder;
        localRecorder.ondataavailable = (ev: BlobEvent) => {
          if (ev.data && ev.data.size > 0) localRecordingChunksRef.current.push(ev.data);
        };
        localRecorder.start(5000);
      } catch {
        // Local recording is optional; audio pipeline remains functional.
      }

      recorder.start(4000); // chunk every ~4s
      setRecording(true);
      setStatus("Recording (camera preview + mic). Speak clearly.");
      return;
    }

    // Voice mode (audio only)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    mediaStreamRef.current = stream;
    const recorder = new MediaRecorder(stream, audioMimeType ? { mimeType: audioMimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (ev: BlobEvent) => {
      if (ev.data && ev.data.size > 0) recordedChunksRef.current.push(ev.data);
    };

    recorder.start(4000); // chunk every ~4s
    setRecording(true);
    setStatus("Recording... Speak clearly.");
  }

  async function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    setRecording(false);

    const mimeType = recorder.mimeType || "audio/webm";

    // Stop audio recorder (pipeline)
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      try {
        recorder.stop();
      } catch {
        resolve();
      }
    });

    // Stop optional local recording too.
    const localRecorder = localRecordingRef.current;
    if (localRecorder) {
      await new Promise<void>((resolve) => {
        localRecorder.onstop = () => resolve();
        try {
          localRecorder.stop();
        } catch {
          resolve();
        }
      });
    }

    // Stop tracks after recorders end.
    try {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      // ignore
    }
    try {
      if (videoRef.current) videoRef.current.srcObject = null;
    } catch {
      // ignore
    }
    previewStreamRef.current = null;
    localRecordingRef.current = null;

    const chunks = recordedChunksRef.current.slice();
    if (chunks.length === 0) {
      setStatus("No audio captured. Try again.");
      return;
    }

    setStatus("Uploading audio & transcribing...");
    setIsAiTyping(true);
    await uploadVoiceTurnAnswer(chunks, mimeType);
    setStatus("Audio uploaded. Waiting for next question...");

    // Create local recording download link (video mode only).
    if (interviewMode === "video") {
      const localChunks = localRecordingChunksRef.current.slice();
      if (localChunks.length > 0) {
        const blob = new Blob(localChunks, { type: localChunks[0]?.type || "video/webm" });
        const url = URL.createObjectURL(blob);
        setLocalRecordingUrl(url);
      }
    }
  }

  const scrollRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="h-screen bg-bg-primary flex flex-col overflow-hidden">
      <header className="bg-card-secondary border-b border-border-primary px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <div className="text-sm text-text-secondary">Live Interview</div>
          <div className="font-semibold text-text-primary">Question {Math.min(turnIndex + 1, maxTurns)} of {maxTurns}</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-text-muted">
            {currentQuestion?.interviewer_type || "TECH"} • {currentQuestion?.question_type || "—"}
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")}
          >
            Exit
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Messages - Scrollable */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0"
          >
            {chatMessages.length === 0 && (
              <div className="text-center text-text-muted py-12">
                Connecting to interview... Please wait.
              </div>
            )}
            
            {chatMessages.map((msg, idx) => (
              <div key={`${msg.turnIndex}-${msg.type}-${idx}`} className="animate-fade-in">
                {msg.type === "question" && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary-500">
                        {msg.interviewerType?.charAt(0) || "A"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-card-secondary border border-border-primary rounded-2xl rounded-tl-none px-4 py-3">
                        <div className="text-xs text-text-muted mb-1">
                          AI Interviewer • {msg.questionType}
                        </div>
                        <div className="text-text-primary">{msg.content}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {msg.type === "answer" && (
                  <div className="flex gap-3 justify-end">
                    <div className="flex-1 max-w-[80%]">
                      <div className="bg-primary-500 text-white rounded-2xl rounded-tr-none px-4 py-3">
                        <div className="text-xs text-primary-200 mb-1">You</div>
                        <div>{msg.content}</div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-white">You</span>
                    </div>
                  </div>
                )}
                
                {msg.type === "evaluation" && (
                  <div className="flex justify-center my-2">
                    <div className="bg-status-success/10 border border-status-success/20 rounded-full px-4 py-2">
                      <span className="text-sm text-status-success font-medium">
                        {msg.content}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isAiTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-primary-500">
                    {currentQuestion?.interviewer_type?.charAt(0) || "A"}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="bg-card-secondary border border-border-primary rounded-2xl rounded-tl-none px-4 py-3">
                    <div className="text-xs text-text-muted mb-1">
                      AI Interviewer • Typing...
                    </div>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {isInterviewEnded && (
              <div className="text-center py-4">
                <div className="inline-block bg-card-secondary border border-border-primary rounded-xl px-6 py-3">
                  <div className="text-text-secondary">Interview completed!</div>
                  <div className="text-xs text-text-muted mt-1">Redirecting to report...</div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border-primary bg-card-secondary px-6 py-4 shrink-0">
            {wsError && (
              <div className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-lg p-3 mb-3">
                {wsError}
              </div>
            )}
            
            {interviewMode === "text" ? (
              <form onSubmit={onSubmitAnswer} className="flex gap-3">
                <textarea
                  className="flex-1 border border-border-primary rounded-xl px-4 py-3 h-20 resize-none bg-bg-primary text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-border-accent focus:border-transparent"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Type your answer..."
                  disabled={isInterviewEnded}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSubmitAnswer(e);
                    }
                  }}
                />
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isInterviewEnded || !answerText.trim()}
                  className="self-end"
                >
                  Send
                </Button>
              </form>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  {interviewMode === "video" && (
                    <div className="flex items-center gap-4">
                      <video 
                        ref={videoRef} 
                        className="w-32 h-24 rounded-xl border border-border-primary bg-black object-cover" 
                        playsInline 
                        muted 
                      />
                      <div className="flex-1 text-sm text-text-secondary">
                        {recording ? "Recording... Speak clearly." : "Click Start to begin recording your answer."}
                      </div>
                    </div>
                  )}
                  {interviewMode === "voice" && (
                    <div className="text-sm text-text-secondary">
                      {recording ? "Recording... Speak clearly." : "Click Start to begin recording your answer."}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    disabled={recording || uploading || isInterviewEnded}
                    onClick={startRecording}
                  >
                    {recording ? "Recording..." : "Start Recording"}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={!recording || uploading || isInterviewEnded}
                    onClick={stopRecording}
                  >
                    Stop & Submit
                  </Button>
                </div>
              </div>
            )}
            
            {uploading && (
              <div className="text-sm text-text-secondary mt-2">
                Uploading and transcribing audio...
              </div>
            )}
            
            {questionAudioUrl && (
              <div className="flex items-center gap-3 mt-3">
                <audio ref={audioRef} className="hidden" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const a = audioRef.current;
                    if (!a) return;
                    a.play().catch(() => {});
                  }}
                >
                  🔊 Play Question Audio
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Proctoring & Status */}
        <aside className="w-64 border-l border-border-primary bg-card-secondary p-4 shrink-0 hidden lg:block">
          <div className="mb-6">
            <div className="text-xs uppercase tracking-wide text-text-muted font-semibold mb-3">
              Status
            </div>
            <div className="text-sm text-text-secondary">{status}</div>
          </div>

          <div className="mb-6">
            <div className="text-xs uppercase tracking-wide text-text-muted font-semibold mb-3">
              Proctoring
            </div>
            <div className="text-sm text-text-secondary space-y-2">
              <div className="flex justify-between">
                <span>Tab switches:</span>
                <span className="font-medium text-text-primary">{proctorTabSwitchCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Focus lost:</span>
                <span className="font-medium text-text-primary">{proctorFocusLostCount}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-text-muted font-semibold mb-3">
              Session Info
            </div>
            <div className="text-xs text-text-muted break-all">
              {sessionId}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

