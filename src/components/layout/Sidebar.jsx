import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard,
  LineChart,
  CheckSquare,
  ClipboardList,
  Briefcase,
  Building2,
  Users,
} from "lucide-react";

// -----------------------------
// CONFIG MENÚ
// -----------------------------
const menuSections = [
  {
    title: "Dashboard",
    items: [
      {
        path: "/",
        label: "Dashboard",
        icon: LayoutDashboard,
        roles: ["ADMIN", "LEADER", "EMPLOYEE"],
      },
    ],
  },
  {
    title: "Operación",
    items: [
      {
        path: "/tracking",
        label: "Mi Seguimiento",
        icon: LineChart,
        roles: ["ADMIN", "LEADER", "EMPLOYEE"],
      },
      {
        path: "/team-review",
        label: "Revisar Equipo",
        icon: CheckSquare,
        roles: ["ADMIN", "LEADER"], // 🔥 SOLO líderes y admin
      },
    ],
  },
  {
    title: "Configuración",
    items: [
      {
        path: "/indicators",
        label: "Indicadores",
        icon: ClipboardList,
        roles: ["ADMIN"], // 🔥 SOLO admin
      },
      {
        path: "/positions",
        label: "Cargos / Posiciones",
        icon: Briefcase,
        roles: ["ADMIN"],
      },
      {
        path: "/organization",
        label: "Estructura Organizacional",
        icon: Building2,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    title: "Administración",
    items: [
      {
        path: "/users",
        label: "Usuarios",
        icon: Users,
        roles: ["ADMIN"], // 🔥 SOLO admin
      },
    ],
  },
];

// -----------------------------
// COMPONENTE
// -----------------------------
export default function Sidebar() {
  const location = useLocation();
  const { hasRole, user } = useAuth();

  const canAccess = (roles) => {
    if (!user?.roles || user.roles.length === 0) return false;
    return roles.some((role) => hasRole(role));
  };

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-wide">Productividad</h1>
        <p className="text-xs text-gray-400">Sistema de Evaluación</p>
      </div>

      {/* NAV */}
      <nav className="flex flex-col gap-6">
        {menuSections.map((section) => {
          const visibleItems = section.items.filter((item) =>
            canAccess(item.roles)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              {/* TITLE */}
              <p className="text-xs text-gray-500 uppercase mb-2 px-2">
                {section.title}
              </p>

              {/* ITEMS */}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-medium">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="mt-auto pt-6 border-t border-gray-800">
        <p className="text-xs text-gray-500">{user?.name}</p>
        <p className="text-xs text-gray-400">
          {user?.roles?.join(", ")}
        </p>
      </div>
    </aside>
  );
}