import { useEffect, useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { getCurrentUser } from "../utils/auth";
import { setHydraCookie } from "../api/client";

export default function ProtectedRoute({ children }) {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const loginRef = useRef(login);
  const initRef = useRef(false);

  useEffect(() => {
    loginRef.current = login;
  }, [login]);

  useEffect(() => {
    const initAuth = async () => {
      if (initRef.current) return;
      initRef.current = true;

      try {
        if (user) {
          setLoading(false);
          return;
        }

        const result = getCurrentUser();

        if (result?.token) {
          setHydraCookie(result.token);
          await loginRef.current(result.user, result.token);
        }
      } catch (error) {
        console.error("Error inicializando auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Cargando sesión...</div>
      </div>
    );
  }

  if (!user) {
    window.location.href =
      import.meta.env.VITE_HYDRA_LOGIN_URL || "/login";
    return null;
  }

  return children;
}
