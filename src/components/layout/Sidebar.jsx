import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  Target,
  UserCog,
  FileText,
  Paperclip,
  User,
} from "lucide-react";

const getMenuSections = (roles = []) => {
  const isAdmin = roles.includes("ADMIN");
  const isLeader = roles.includes("LEADER");
  const isEmployee = roles.includes("EMPLOYEE");
  const isLeaderAndEmployee = isLeader && isEmployee;
  
  const sections = [];

  // Dashboard section
  if (isAdmin) {
    sections.push({
      title: "Dashboard",
      items: [
        { path: "/admin", label: "Dashboard General", icon: LayoutDashboard },
      ],
    });
  } 
  if (isEmployee || isLeaderAndEmployee) {
    sections.push({
      title: "Dashboard",
      items: [
        { path: "/employee", label: "Mi Dashboard", icon: User },
      ],
    });
  }

  // Operación - siempre visibles para employee o leader+employee
  if (isEmployee || isLeaderAndEmployee) {
    sections.push({
      title: "Operación",
      items: [
        { path: "/evidence", label: "Evidencias", icon: Paperclip },
        { path: "/action-plan", label: "Planes de Acción", icon: FileText },
      ],
    });
  } else if (isLeader && !isAdmin) {
    sections.push({
      title: "Operación",
      items: [
        { path: "/action-plan", label: "Planes de Acción", icon: FileText },
      ],
    });
  } else if (isAdmin) {
    sections.push({
      title: "Operación",
      items: [
        { path: "/evidence", label: "Evidencias", icon: Paperclip },
        { path: "/action-plan", label: "Planes de Acción", icon: FileText },
      ],
    });
  }

  // Gestión
  if (isLeader || isAdmin) {
    sections.push({
      title: "Gestión",
      items: [
        { path: "/leader", label: "Equipo", icon: Users },
      ],
    });
  }

  // Administración (solo admins)
  if (isAdmin) {
    sections.push({
      title: "Administración",
      items: [
        { path: "/assignments", label: "Indicadores", icon: Target },
        { path: "/teams", label: "Equipos", icon: Users },
        { path: "/users", label: "Usuarios", icon: UserCog },
      ],
    });
  }

  return sections;
};

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const menuSections = getMenuSections(user?.roles || []);

  return (
    <aside className="w-64 bg-gray-900 text-white h-full flex-shrink-0 p-4 flex flex-col overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-wide">Productividad</h1>
        <p className="text-xs text-gray-400">Sistema de Evaluación</p>
      </div>

      <nav className="flex flex-col gap-6">
        {menuSections.map((section) => (
          <div key={section.title}>
            <p className="text-xs text-gray-500 uppercase mb-2 px-2">
              {section.title}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
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
        ))}
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