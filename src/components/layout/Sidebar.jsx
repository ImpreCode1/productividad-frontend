import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { translateRoles } from "../../utils/auth";
import {
  LayoutDashboard,
  Users,
  Target,
  UserCog,
  FileText,
  Paperclip,
  User,
  Mail,
  Settings,
  Building2,
} from "lucide-react";

const getMenuSections = (roles = []) => {
  const isAdmin = roles.includes("ADMIN");
  const isLeader = roles.includes("LEADER");
  const isEmployee = roles.includes("EMPLOYEE");
  const isLeaderAndEmployee = isLeader && isEmployee;
  
  const sections = [];

  // Organización - visible para todos los roles
  sections.push({
    title: "Organización",
    items: [
      { path: "/position-groups", label: "Jerarquía", icon: Building2 },
    ],
  });

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
  } else if (isLeader) {
    sections.push({
      title: "Operación",
      items: [
        { path: "/action-plan", label: "Planes de Acción", icon: FileText },
      ],
    });
  }

  // Gestión
  if (isLeader) {
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
        { path: "/notifications", label: "Notificaciones", icon: Mail },
        { path: "/approval-config", label: "Config. Carga", icon: Settings },
      ],
    });
  }

  return sections;
};

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user } = useAuth();

  const menuSections = getMenuSections(user?.roles || []);

  return (
    <aside className={`w-64 bg-gray-900 text-white h-full flex-shrink-0 p-4 flex flex-col overflow-y-auto fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
      <div className="mb-8 flex items-center gap-3">
        <img 
          src="/impresistem_logo.png" 
          alt="Logo" 
          className="h-14 w-14 object-contain"
        />
        <div>
          <h1 className="text-lg font-bold tracking-wide">Productividad</h1>
          <p className="text-xs text-gray-400">Sistema de Evaluación</p>
        </div>
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
                    onClick={onClose}
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
          {translateRoles(user?.roles) || ""}
        </p>
      </div>
    </aside>
  );
}