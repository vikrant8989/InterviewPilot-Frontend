import { create } from "zustand";
import { apiFetch } from "../lib/apiClient";
import { useAuthStore } from "./authStore";

type InterviewConfig = {
  company: string;
  targetRole: string;
  difficulty: "Easy" | "Medium" | "Hard";
  interviewMode: "text" | "voice" | "video";
  multiAgent: boolean;
  maxTurns: number;
};

type Question = {
  question_text: string;
  question_type?: string;
  question_audio_url?: string | null;
  follow_up_text?: string | null;
  difficulty_next?: string | null;
  interviewer_type?: string;
  turn_index?: number;
};

type SessionState = {
  config: InterviewConfig;
  sessionId: string | null;
  currentQuestion: Question | null;
  conversationHistory: Array<{ turnIndex: number; question: Question; answer?: string; evaluation?: any }>;
  setConfig: (partial: Partial<InterviewConfig>) => void;
  setSessionId: (id: string | null) => void;
  createSession: () => Promise<void>;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  setCurrentQuestion: (q: Question | null) => void;
  addToHistory: (item: { turnIndex: number; question: Question; answer?: string; evaluation?: any }) => void;
  clearHistory: () => void;
};

const defaultConfig: InterviewConfig = {
  company: "Google",
  targetRole: "SDE",
  difficulty: "Medium",
  interviewMode: "text",
  multiAgent: true,
  maxTurns: 10,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  config: defaultConfig,
  sessionId: null,
  currentQuestion: null,
  conversationHistory: [],

  setConfig: (partial) => set((s) => ({ config: { ...s.config, ...partial } })),

  setSessionId: (id) => set({ sessionId: id }),

  createSession: async () => {
    const { accessToken } = useAuthStore.getState();
    const res = await apiFetch<{ sessionId: string }>("/api/sessions", {
      method: "POST",
      accessToken: accessToken || undefined,
      body: JSON.stringify({
        company: get().config.company,
        targetRole: get().config.targetRole,
        difficulty: get().config.difficulty,
        interviewMode: get().config.interviewMode,
        multiAgent: get().config.multiAgent,
        maxTurns: get().config.maxTurns,
      }),
    });
    set({ sessionId: res.sessionId, conversationHistory: [] });
  },

  startSession: async () => {
    const { accessToken } = useAuthStore.getState();
    const sessionId = get().sessionId;
    if (!sessionId) throw new Error("No sessionId");

    const res = await apiFetch<{ sessionId: string; firstQuestion: Question; maxTurns: number }>(`/api/sessions/${sessionId}/start`, {
      method: "POST",
      accessToken: accessToken || undefined,
    });

    const questionWithTurn = { ...res.firstQuestion, turn_index: 0 };
    set({ 
      currentQuestion: questionWithTurn,
      conversationHistory: [{ turnIndex: 0, question: questionWithTurn }]
    });
  },

  endSession: async () => {
    const { accessToken } = useAuthStore.getState();
    const sessionId = get().sessionId;
    if (!sessionId) return;
    await apiFetch(`/api/sessions/${sessionId}/end`, {
      method: "POST",
      accessToken: accessToken || undefined,
    });
  },

  setCurrentQuestion: (q) => set({ currentQuestion: q }),

  addToHistory: (item) => set((s) => ({ 
    conversationHistory: [...s.conversationHistory, item] 
  })),

  clearHistory: () => set({ conversationHistory: [] }),
}));

