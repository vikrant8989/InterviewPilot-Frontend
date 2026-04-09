export function getApiBaseUrl() {
  // Configure in Vercel as: `VITE_API_BASE_URL="https://your-api-domain.com"`
  return  "http://localhost:8000";
}

export function getWsBaseUrl() {
  const base = getApiBaseUrl().replace(/^http/, "ws");
  return base;
}

