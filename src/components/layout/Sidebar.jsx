import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  Target,
  UserCog,
  FileText,
  Paperclip,
} from "lucide-react";

const menuSections = [
  {
    title: "General",
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
        path: "/evidence",
        label: "Evidencias",
        icon: Paperclip,
        roles: ["ADMIN", "LEADER", "EMPLOYEE"],
      },
      {
        path: "/action-plan",
        label: "Planes de Acción",
        icon: FileText,
        roles: ["ADMIN", "LEADER", "EMPLOYEE"],
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        path: "/leader",
        label: "Equipo",
        icon: Users,
        roles: ["ADMIN", "LEADER"],
      },
    ],
  },
  {
    title: "Administración",
    items: [
      {
        path: "/assignments",
        label: "Indicadores",
        icon: Target,
        roles: ["ADMIN"],
      },
      {
        path: "/teams",
        label: "Equipos",
        icon: Users,
        roles: ["ADMIN"],
      },
      {
        path: "/users",
        label: "Usuarios",
        icon: UserCog,
        roles: ["ADMIN"],
      },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const canAccess = (roles) => {
    if (!user?.roles || user.roles.length === 0) return true;
    return roles.some((role) => user.roles.includes(role));
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
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/" && location.pathname.startsWith(item.path));

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
        <p className="text-xs text-gray-500 truncate">
          {user?.name || "Cargando..."}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {user?.roles?.join(", ") || ""}
        </p>
      </div>
    </aside>
  );
}