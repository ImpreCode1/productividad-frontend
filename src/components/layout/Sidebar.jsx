import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard,
  LineChart,
  Users,
  Target,
  UserCog,
} from "lucide-react";

const menuSections = [
  {
    title: "General",
    items: [
      {
        path: "/dashboard",
        label: "Mi Dashboard",
        icon: LayoutDashboard,
        roles: ["EMPLOYEE"],
      },
      {
        path: "/dashboard/team",
        label: "Dashboard Equipo",
        icon: LayoutDashboard,
        roles: ["LEADER"],
      },
      {
        path: "/dashboard/admin",
        label: "Dashboard Global",
        icon: LayoutDashboard,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    title: "Operación",
    items: [
      {
        path: "/tracking",
        label: "Mis Indicadores",
        icon: LineChart,
        roles: ["EMPLOYEE"],
      },
      {
        path: "/tracking/team",
        label: "Seguimiento Equipo",
        icon: LineChart,
        roles: ["LEADER"],
      },
      {
        path: "/evidence",
        label: "Evidencias",
        icon: LineChart,
        roles: ["EMPLOYEE", "LEADER"],
      },
      {
        path: "/action-plan",
        label: "Planes de Acción",
        icon: LineChart,
        roles: ["EMPLOYEE", "LEADER"],
      },
    ],
  },
  {
    title: "Administración",
    items: [
      {
        path: "/assignments",
        label: "Asignaciones",
        icon: Target,
        roles: ["ADMIN"],
      },
      {
        path: "/users",
        label: "Usuarios",
        icon: UserCog,
        roles: ["ADMIN"],
      },
      {
        path: "/roles",
        label: "Roles",
        icon: UserCog,
        roles: ["ADMIN"],
      },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { hasRole, user } = useAuth();

  const canAccess = (roles) => {
    if (!user?.roles || user.roles.length === 0) return true;
    return roles.some((role) => hasRole(role));
  };

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-wide">Productividad</h1>
        <p className="text-xs text-gray-400">Sistema de Evaluación</p>
      </div>

      <nav className="flex flex-col gap-6">
        {menuSections.map((section) => {
          const visibleItems = section.items.filter((item) =>
            canAccess(item.roles)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              <p className="text-xs text-gray-500 uppercase mb-2 px-2">
                {section.title}
              </p>

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

      <div className="mt-auto pt-6 border-t border-gray-800">
        <p className="text-xs text-gray-500">{user?.name || "Cargando..."}</p>
        <p className="text-xs text-gray-400">
          {user?.roles?.join(", ") || ""}
        </p>
      </div>
    </aside>
  );
}