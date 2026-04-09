import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button, Input, Card } from "../components";
import { getApiBaseUrl } from "../lib/config";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("string");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      console.log("Login successful", user);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function onGoogleLogin() {
    window.location.href = `${getApiBaseUrl()}/api/auth/google/start`;
  }

  return (
    <div className="h-screen bg-bg-primary flex items-center justify-center p-6 overflow-hidden">
      <Card className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary-500 text-white flex items-center justify-center font-bold text-lg mb-4">
            AI
          </div>
          <h1 className="text-2xl font-semibold text-text-primary text-center">AI Interview Simulator</h1>
          <p className="text-center text-sm text-text-secondary mt-2">Evaluate your interview performance with AI</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />

          <div className="flex items-center justify-between text-sm text-text-secondary">
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                className="rounded border-border-primary text-primary-500 focus:ring-primary-500 focus:ring-offset-bg-primary" 
                defaultChecked 
              />
              Remember me
            </label>
            <a href="#" className="text-primary-500 hover:text-primary-600 transition-colors">
              Forgot password?
            </a>
          </div>

          {error && (
            <div className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            loading={loading}
            disabled={loading}
            type="submit"
            className="w-full"
          >
            {loading ? "Signing in..." : isAuthenticated ? "Signed in" : "Sign In"}
          </Button>

          <div className="flex items-center gap-3 text-xs text-text-muted mt-6">
            <div className="h-px flex-1 bg-border-primary" />
            <span>OR CONTINUE WITH</span>
            <div className="h-px flex-1 bg-border-primary" />
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={onGoogleLogin}
            className="w-full"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
        </form>
      </Card>
    </div>
  );
}

