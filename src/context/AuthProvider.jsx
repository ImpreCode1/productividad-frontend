import { useState, useEffect } from "react";
import { setHydraCookie, clearHydraCookie } from "../api/client";
import { getMe } from "../api/users.api";
import { AuthContext } from "./AuthContext";


const SESSION_KEY = "productividad_user";

const SESSION_EXPIRED_KEY = "session_expired";

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

  const [sessionExpired, setSessionExpired] = useState(() => {
    return sessionStorage.getItem(SESSION_EXPIRED_KEY) === "true";
  });

  const markSessionExpired = () => {
    sessionStorage.setItem(SESSION_EXPIRED_KEY, "true");
    setSessionExpired(true);
  };

  const clearSessionExpired = () => {
    sessionStorage.removeItem(SESSION_EXPIRED_KEY);
    setSessionExpired(false);
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("hydra_token");
    sessionStorage.removeItem(SESSION_EXPIRED_KEY);
    clearHydraCookie();
    setUser(null);
    setSessionExpired(false);

    const hydraLogoutUrl = import.meta.env.VITE_HYDRA_LOGOUT_URL;
    if (hydraLogoutUrl) {
      window.location.href = hydraLogoutUrl;
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = sessionStorage.getItem("hydra_token");
      if (!token) return;

      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.id && parsed.name) {
            setUser(parsed);
            return;
          }
        } catch {
          // ignore parse errors
        }
      }

      try {
        const { data: backendUser } = await getMe();

        const userWithRoles = {
          id: backendUser.id,
          name: backendUser.name,
          email: backendUser.email,
          position: backendUser.position_name,
          area: backendUser.area,
          subarea: backendUser.subarea,
          roles: (backendUser.roles || []).map((r) =>
            typeof r === "string" ? r : r.name
          ),
        };

        sessionStorage.setItem(SESSION_KEY, JSON.stringify(userWithRoles));
        setUser(userWithRoles);
      } catch (e) {
        console.error("Error rehidratando sesión:", e);
      }
    };

    init();
  }, []);

  const login = async (userData, token) => {
    if (token) {
      setHydraCookie(token);
    }

    try {
      const { data: backendUser } = await getMe();

      const userWithRoles = {
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        position: backendUser.position_name,
        area: backendUser.area,
        subarea: backendUser.subarea,
        roles: (backendUser.roles || []).map((r) =>
          typeof r === "string" ? r : r.name
        ),
      };

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(userWithRoles));
      setUser(userWithRoles);
    } catch (e) {
      console.warn("Fallback a userData del token:", e);
      if (userData) {
        const fallbackUser = {
          id: userData.id || userData.sub,
          name: userData.name,
          email: userData.email,
          position: userData.position || null,
          area: null,
          subarea: null,
          roles: userData.roles || [],
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(fallbackUser));
        setUser(fallbackUser);
      }
    }
  };

  const hasRole = (role) => {
    if (!user?.roles) return false;
    return user.roles.includes(role);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole, sessionExpired, markSessionExpired, clearSessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
}