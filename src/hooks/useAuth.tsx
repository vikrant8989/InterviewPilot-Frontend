import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient, AuthResponse, LoginRequest, RegisterRequest } from '../api/client';
import { useAuthStore } from '../store/authStore';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = apiClient.getToken();
    if (token) {
      apiClient.getCurrentUser()
        .then(userData => setUser(userData))
        .catch(() => apiClient.clearToken())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (data: LoginRequest) => {
    const response = await apiClient.login(data);
    setUser(response.user);
    // Sync with authStore
    useAuthStore.getState().setToken(response.accessToken, response.user);
  };

  const register = async (data: RegisterRequest) => {
    const response = await apiClient.register(data);
    setUser(response.user);
    // Sync with authStore
    useAuthStore.getState().setToken(response.accessToken, response.user);
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
    // Sync with authStore
    useAuthStore.getState().logout();
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
