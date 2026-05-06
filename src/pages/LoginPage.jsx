import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getCurrentUser, getTokenFromUrl } from "../utils/hydra";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const token = getTokenFromUrl();

  console.log("LoginPage render - token:", token ? "present" : "missing", "- user:", user ? "logged in" : "not logged in");

  useEffect(() => {
    console.log("useEffect triggered - token:", token, "- user:", user);

    if (user) {
      console.log("User already logged in, navigating to /");
      navigate("/");
      return;
    }

    if (!token) {
      console.log("No token in URL");
      return;
    }

    console.log("Processing token...");
    const userData = getCurrentUser();
    console.log("User data from token:", userData);

    if (userData) {
      console.log("Login successful, navigating to /");
      login(userData, token);
      navigate("/");
    } else {
      console.log("Failed to get user data from token");
    }
  }, [user, token, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Plataforma de Productividad
        </h1>
        
        {token ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">Validando token...</p>
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-gray-400 text-5xl mb-4">🔐</div>
            <p className="text-gray-800 font-medium mb-2">
              Acceso restringido
            </p>
            <p className="text-sm text-gray-500">
              Esta plataforma requiere autenticación mediante Hydra IAM.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
