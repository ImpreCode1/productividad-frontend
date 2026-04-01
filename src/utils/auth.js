import { getTokenFromUrl, clearTokenFromUrl } from "./hydra";

export function createAuthHeaders() {
  const token = getTokenFromUrl();
  if (token) {
    clearTokenFromUrl();
    sessionStorage.setItem("hydra_token", token);
  }
  
  const stored = sessionStorage.getItem("hydra_token");
  return stored ? { Authorization: `Bearer ${stored}` } : {};
}

export function getStoredToken() {
  return sessionStorage.getItem("hydra_token");
}
