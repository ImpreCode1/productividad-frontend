import { useAuth } from "../../hooks/useAuth";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Plataforma de Productividad
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.name || "Usuario"} 
            ({user?.roles?.join(", ") || "sin roles"})
          </span>
          <button
            onClick={logout}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
