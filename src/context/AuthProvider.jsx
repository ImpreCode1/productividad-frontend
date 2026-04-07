import { useState, useEffect } from "react";
import { setHydraCookie, clearHydraCookie } from "../api/client";
import { fetchCurrentUser } from "../api/users.api";
import { AuthContext } from "./AuthContext";


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

  // 🔓 Logout (MOVIDO ARRIBA ✅)
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

  // 🔥 Rehidratación automática
  useEffect(() => {
    const init = async () => {
      const token = sessionStorage.getItem("hydra_token");
      if (!token) return;

      try {
        const backendUser = await fetchCurrentUser();

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
        logout(); // ✅ ahora sí válido
      }
    };

    init();
  }, []);

  // 🔐 Login
  const login = async (userData, token) => {
    if (token) {
      setHydraCookie(token);
    }

    try {
      const backendUser = await fetchCurrentUser();

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
      console.warn("Fallback a userData:", e);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
      setUser(userData);
    }
  };

  // 🔐 Roles
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