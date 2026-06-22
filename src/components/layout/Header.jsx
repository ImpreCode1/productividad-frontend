import { Menu } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { translateRoles } from "../../utils/auth";

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden text-gray-700 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-sm md:text-lg font-semibold text-gray-800">
            Plataforma de Productividad
          </h2>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.name || "Usuario"}
            ({translateRoles(user?.roles) || "sin roles"})
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
