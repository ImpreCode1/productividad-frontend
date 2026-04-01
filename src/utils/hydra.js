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
        roles: decoded.roles || [],
        positionId: decoded.positionId,
        platform: decoded.platform,
      },
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

export function getCurrentUser() {
  const token = getTokenFromUrl();
  if (!token) return null;

  const result = validateHydraToken(token);
  if (result.valid) {
    clearTokenFromUrl();
    return { user: result.user, token };
  }
  return null;
}
