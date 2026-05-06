import { jwtDecode } from "jwt-decode";

export function getTokenFromUrl() {
  const fullUrl = window.location.href;
  const url = new URL(fullUrl);
  return url.searchParams.get("token");
}

export function clearTokenFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("token");
  window.history.replaceState({}, "", url.pathname);
}

export function validateHydraToken(token) {
  try {
    const decoded = jwtDecode(token);
    
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return { valid: false, error: "Token expired" };
    }

    return {
      valid: true,
      user: {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        positionId: decoded.positionId,
        roles: decoded.roles || [],
      },
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

export function getCurrentUser() {
  const token = getTokenFromUrl() || sessionStorage.getItem("hydra_token");
  if (!token) return null;

  const result = validateHydraToken(token);
  if (result.valid) {
    if (getTokenFromUrl()) {
      clearTokenFromUrl();
      sessionStorage.setItem("hydra_token", token);
    }
    return { user: result.user, token };
  }
  sessionStorage.removeItem("hydra_token");
  return null;
}

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
