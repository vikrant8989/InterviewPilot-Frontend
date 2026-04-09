
import { getApiBaseUrl } from "../lib/config";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('accessToken', token);
  }

  getToken(): string | null {
    if (this.token) return this.token;
    return localStorage.getItem('accessToken');
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('accessToken');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${getApiBaseUrl()}${endpoint}`;
    const token = this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    this.setToken(response.accessToken);
    return response;
  }

  async getCurrentUser() {
    return this.request('/api/users/me');
  }

  async logout() {
    this.clearToken();
  }
}

export const apiClient = new ApiClient();
