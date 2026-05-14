import { useEffect } from "react";

export default function SessionExpiredPage() {
  useEffect(() => {
    sessionStorage.removeItem("hydra_token");
    sessionStorage.removeItem("productividad_user");
    sessionStorage.removeItem("session_expired");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <div className="text-amber-500 text-6xl mb-4">⏰</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Sesión Caducada
        </h1>
        <p className="text-gray-600 mb-6">
          Tu sesión ha expirado. Por favor, ingresa nuevamente a través de{" "}
          <a
            href="https://central.impresistem.com"
            className="text-blue-600 hover:underline font-medium"
          >
            central.impresistem.com
          </a>{" "}
          para acceder al portal.
        </p>
      </div>
    </div>
  );
}