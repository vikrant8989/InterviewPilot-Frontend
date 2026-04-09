import { create } from "zustand";
import { apiFetch } from "../lib/apiClient";

type User = { id: string; email: string; name?: string | null };

type AuthState = {
  accessToken: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string | null, user?: User | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,

  setToken: (token, user = null) =>
    set(() => {
      if (token) localStorage.setItem("accessToken", token);
      else localStorage.removeItem("accessToken");
      if (user) localStorage.setItem("user", JSON.stringify(user));
      else localStorage.removeItem("user");
      return { accessToken: token, user };
    }),

  login: async (email, password) => {
    const res = await apiFetch<{ accessToken: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    set(() => ({ accessToken: res.accessToken, user: res.user }));
    localStorage.setItem("accessToken", res.accessToken);
    localStorage.setItem("user", JSON.stringify(res.user));
  },

  logout: () =>
    set(() => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      return { accessToken: null, user: null };
    }),
}));

// Hydrate token on first load (client-side only)
const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
const userRaw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
if (token) {
  useAuthStore.getState().setToken(token, userRaw ? (JSON.parse(userRaw) as User) : null);
}

