export function getApiBaseUrl() {
  // Configure in Vercel as: `VITE_API_BASE_URL="https://your-api-domain.com"`
  return  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
}

export function getWsBaseUrl() {
  const base = getApiBaseUrl().replace(/^http/, "ws");
  return base;
}

