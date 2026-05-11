import { User, Mail, Briefcase, Building, MapPin, Route, UserCheck } from "lucide-react";

export default function UserList({ users, onEdit }) {
  if (!users || users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay usuarios
        </h3>
        <p className="text-gray-500">
          No hay usuarios registrados en el sistema
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="flex flex-col">
        <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-600">
          <div className="w-1/6 px-2 py-2">Usuario</div>
          <div className="w-1/6 px-2 py-2">Cargo</div>
          <div className="w-1/6 px-2 py-2">Vicepresidencia</div>
          <div className="w-1/6 px-2 py-2">Área</div>
          <div className="w-1/6 px-2 py-2">Línea</div>
          <div className="w-1/6 px-2 py-2">Líder</div>
          <div className="w-16 px-2 py-2 text-center">Estado</div>
          <div className="w-12 px-2 py-2"></div>
        </div>
        {users.map((user) => (
          <div key={user.id} className="flex hover:bg-blue-50/50 transition-colors duration-150 text-xs">
            <div className="w-1/6 px-2 py-2 flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="h-3 w-3 text-blue-600" />
              </div>
              <span className="text-gray-700 font-medium truncate">{user.name}</span>
            </div>
            <div className="w-1/6 px-2 py-2 text-gray-500 truncate">{user.position_name || "-"}</div>
            <div className="w-1/6 px-2 py-2 text-gray-500 truncate">{user.area || "-"}</div>
            <div className="w-1/6 px-2 py-2 text-gray-500 truncate">{user.subarea || "-"}</div>
            <div className="w-1/6 px-2 py-2 text-gray-500 truncate">
              {user.linea || "-"}
              {user.numero_linea ? `(${user.numero_linea})` : ""}
            </div>
            <div className="w-1/6 px-2 py-2 text-gray-500 truncate">{user.leader_name || "-"}</div>
            <div className="w-16 px-2 py-2 text-center">
              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${user.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                {user.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="w-12 px-2 py-2 text-center">
              <button onClick={() => onEdit(user)} className="p-1 text-blue-500 hover:bg-blue-100 rounded transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}