import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ConfigureSessionPage from "./pages/ConfigureSessionPage";
import LiveInterviewPage from "./pages/LiveInterviewPage";
import PerformanceReportPage from "./pages/PerformanceReportPage";
import { useAuth } from "./hooks/useAuth";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/configure-session"
        element={
          <RequireAuth>
            <ConfigureSessionPage />
          </RequireAuth>
        }
      />
      <Route
        path="/interview/:sessionId"
        element={
          <RequireAuth>
            <LiveInterviewPage />
          </RequireAuth>
        }
      />
      <Route
        path="/report/:sessionId"
        element={
          <RequireAuth>
            <PerformanceReportPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

