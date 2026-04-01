import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { getCurrentUser } from "../utils/hydra";
import { setHydraCookie } from "../api/client";

export default function ProtectedRoute({ children }) {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const result = getCurrentUser();
      if (result) {
        setHydraCookie(result.token);
        await login(result.user, result.token);
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Debes iniciar sesión</p>
          <a 
            href={import.meta.env.VITE_HYDRA_LOGIN_URL || "/login"} 
            className="text-blue-600 hover:text-blue-800"
          >
            Ir a login
          </a>
        </div>
      </div>
    );
  }

  return children;
}