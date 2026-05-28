import { useState, useMemo } from "react";
import { User, Search, X } from "lucide-react";

export default function UserList({ users, onEdit }) {
  const [filters, setFilters] = useState({
    name: "",
    position_name: "",
    area: "",
    subarea: "",
    linea: "",
    leader_name: "",
    is_active: "",
  });

  const updateFilter = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      position_name: "",
      area: "",
      subarea: "",
      linea: "",
      leader_name: "",
      is_active: "",
    });
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => {
      if (filters.name && !user.name?.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.position_name && !user.position_name?.toLowerCase().includes(filters.position_name.toLowerCase())) return false;
      if (filters.area && !user.area?.toLowerCase().includes(filters.area.toLowerCase())) return false;
      if (filters.subarea && !user.subarea?.toLowerCase().includes(filters.subarea.toLowerCase())) return false;
      if (filters.linea) {
        const lineaStr = `${user.linea || ""} ${user.numero_linea || ""}`.toLowerCase();
        if (!lineaStr.includes(filters.linea.toLowerCase())) return false;
      }
      if (filters.leader_name && !user.leader_name?.toLowerCase().includes(filters.leader_name.toLowerCase())) return false;
      if (filters.is_active === "active" && !user.is_active) return false;
      if (filters.is_active === "inactive" && user.is_active) return false;
      return true;
    });
  }, [users, filters]);

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  if (!users || users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios</h3>
        <p className="text-gray-500">No hay usuarios registrados en el sistema</p>
      </div>
    );
  }

  const filterInput = (field, placeholder, widthClass) => (
    <div className={`${widthClass} px-1 py-1`}>
      <input
        type="text"
        value={filters[field]}
        onChange={(e) => updateFilter(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-1.5 py-1 text-[10px] border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
      />
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md">
      {hasActiveFilters && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-xs">
          <span className="text-blue-700">
            {filteredUsers.length} de {users.length} usuarios {filteredUsers.length !== 1 ? "filtrados" : "filtrado"}
          </span>
          <button onClick={clearFilters} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
            <X className="h-3 w-3" />
            Limpiar filtros
          </button>
        </div>
      )}

      <div className="flex flex-col">
        <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 text-[11px] font-semibold text-gray-600">
          <div className="w-1/6 px-2 py-2">Usuario</div>
          <div className="w-1/6 px-2 py-2">Cargo</div>
          <div className="w-1/6 px-2 py-2">Vicepresidencia</div>
          <div className="w-1/6 px-2 py-2">Área</div>
          <div className="w-1/6 px-2 py-2">Línea</div>
          <div className="w-1/6 px-2 py-2">Líder</div>
          <div className="w-16 px-2 py-2 text-center">Estado</div>
          <div className="w-12 px-2 py-2"></div>
        </div>

        <div className="flex border-b border-gray-200 bg-gray-50/50">
          {filterInput("name", "Filtrar...", "w-1/6")}
          {filterInput("position_name", "Filtrar...", "w-1/6")}
          {filterInput("area", "Filtrar...", "w-1/6")}
          {filterInput("subarea", "Filtrar...", "w-1/6")}
          {filterInput("linea", "Filtrar...", "w-1/6")}
          {filterInput("leader_name", "Filtrar...", "w-1/6")}
          <div className="w-16 px-1 py-1">
            <select
              value={filters.is_active}
              onChange={(e) => updateFilter("is_active", e.target.value)}
              className="w-full px-1 py-1 text-[10px] border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
            >
              <option value="">Todos</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          <div className="w-12 px-2 py-1"></div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Search className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Ningún usuario coincide con los filtros</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
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
          ))
        )}
      </div>
    </div>
  );
}