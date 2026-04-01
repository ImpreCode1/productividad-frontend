import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const menuItems = [
  { path: "/", label: "Dashboard", icon: "📊", roles: ["ADMIN", "LEADER", "EMPLOYEE"] },
  { path: "/tracking", label: "Seguimiento", icon: "📈", roles: ["ADMIN", "LEADER", "EMPLOYEE"] },
  { path: "/team-review", label: "Revisar Equipo", icon: "✅", roles: ["ADMIN", "LEADER"] },
  { path: "/indicators", label: "Indicadores", icon: "📋", roles: ["ADMIN"] },
  { path: "/positions", label: "Cargos", icon: "💼", roles: ["ADMIN"] },
  { path: "/organization", label: "Organización", icon: "🏢", roles: ["ADMIN"] },
  { path: "/users", label: "Usuarios", icon: "👥", roles: ["ADMIN"] },
];

export default function Sidebar() {
  const location = useLocation();
  const { hasRole, user } = useAuth();

  const visibleItems = menuItems.filter((item) => {
    if (!user?.roles || user.roles.length === 0) return true;
    return item.roles.some((role) => hasRole(role));
  });

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Productividad</h1>
      </div>
      <nav className="space-y-1">
        {visibleItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              location.pathname === item.path
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
