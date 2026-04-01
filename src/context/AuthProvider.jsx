import { createContext, useState } from "react";
import { setHydraCookie, clearHydraCookie } from "../api/client";

export const AuthContext = createContext(null);

const SESSION_KEY = "productividad_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });

  const login = (userData, token) => {
    if (token) {
      setHydraCookie(token);
      sessionStorage.setItem("hydra_token", token);
    }
    const sessionData = { ...userData };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setUser(sessionData);
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("hydra_token");
    clearHydraCookie();
    setUser(null);
    const hydraLogoutUrl = import.meta.env.VITE_HYDRA_LOGOUT_URL;
    if (hydraLogoutUrl) {
      window.location.href = hydraLogoutUrl;
    }
  };

  const hasRole = (role) => {
    if (!user?.roles) return false;
    return user.roles.includes(role);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}
