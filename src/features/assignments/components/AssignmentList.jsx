import { useState, useMemo } from "react";
import { Target, User, Edit, Trash2, Search, X } from "lucide-react";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function AssignmentList({ assignments, users, onEdit, onDelete }) {
  const FREQ_LABELS = {
    MONTHLY: "Mensual",
    BIMONTHLY: "Bimestral",
    QUARTERLY: "Trimestral",
    SEMIANNUAL: "Semestral",
    ANNUAL: "Anual",
  };

  const [filters, setFilters] = useState({
    user_name: "",
    indicator_name: "",
    month: "",
    target_value: "",
    weight: "",
    frequency: "",
    is_active: "",
  });

  const updateFilter = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      user_name: "",
      indicator_name: "",
      month: "",
      target_value: "",
      weight: "",
      frequency: "",
      is_active: "",
    });
  };

  const getUserName = (userId) => {
    const user = users?.find((u) => u.id === userId);
    return user?.name || "Sin usuario";
  };

  const filteredAssignments = useMemo(() => {
    if (!assignments) return [];
    return assignments.filter(a => {
      const userName = getUserName(a.user_id);
      if (filters.user_name && !userName.toLowerCase().includes(filters.user_name.toLowerCase())) return false;
      if (filters.indicator_name && !a.indicator_name?.toLowerCase().includes(filters.indicator_name.toLowerCase())) return false;
      if (filters.month && a.month !== Number(filters.month)) return false;
      if (filters.target_value && !String(a.target_value).includes(filters.target_value)) return false;
      if (filters.weight && !String(a.weight).includes(filters.weight)) return false;
      if (filters.frequency && a.frequency !== filters.frequency) return false;
      if (filters.is_active === "active" && !a.is_active) return false;
      if (filters.is_active === "inactive" && a.is_active) return false;
      return true;
    });
  }, [assignments, filters]);

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  if (!assignments || assignments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-10 text-center">
        <Target className="h-14 w-14 mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-semibold text-gray-700">Sin Indicadores</h3>
        <p className="text-gray-400 text-sm mt-1">No hay indicadores para este período</p>
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
    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
      {hasActiveFilters && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-xs">
          <span className="text-blue-700">
            {filteredAssignments.length} de {assignments.length} {filteredAssignments.length !== 1 ? "indicadores filtrados" : "indicador filtrado"}
          </span>
          <button onClick={clearFilters} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
            <X className="h-3 w-3" />
            Limpiar filtros
          </button>
        </div>
      )}

      <table className="min-w-full text-sm table-fixed">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 tracking-wide w-48">Usuario</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 tracking-wide w-56">Indicador</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 tracking-wide w-16">Mes</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 tracking-wide w-14">Meta</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 tracking-wide w-14">Peso</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 tracking-wide w-22">Frecuencia</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 tracking-wide w-20">Estado</th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600 tracking-wide w-20"></th>
          </tr>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            <td className="px-1 py-1">{filterInput("user_name", "Filtrar...", "")}</td>
            <td className="px-1 py-1">{filterInput("indicator_name", "Filtrar...", "")}</td>
            <td className="px-1 py-1">
              <select
                value={filters.month}
                onChange={(e) => updateFilter("month", e.target.value)}
                className="w-full px-1 py-1 text-[10px] border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
              >
                <option value="">Todos</option>
                {MONTHS.map((name, i) => (
                  <option key={i} value={i + 1}>{name}</option>
                ))}
              </select>
            </td>
            <td className="px-1 py-1">{filterInput("target_value", "Filtrar...", "")}</td>
            <td className="px-1 py-1">{filterInput("weight", "Filtrar...", "")}</td>
            <td className="px-1 py-1">
              <select
                value={filters.frequency}
                onChange={(e) => updateFilter("frequency", e.target.value)}
                className="w-full px-1 py-1 text-[10px] border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
              >
                <option value="">Todas</option>
                {Object.entries(FREQ_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </td>
            <td className="px-1 py-1">
              <select
                value={filters.is_active}
                onChange={(e) => updateFilter("is_active", e.target.value)}
                className="w-full px-1 py-1 text-[10px] border border-gray-200 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
              >
                <option value="">Todos</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </td>
            <td className="px-1 py-1"></td>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filteredAssignments.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-8 text-center">
                <Search className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Ningún indicador coincide con los filtros</p>
              </td>
            </tr>
          ) : (
            filteredAssignments.map((a) => (
              <tr key={a.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <span className="text-gray-700 font-medium truncate block max-w-[10rem]" title={getUserName(a.user_id)}>
                      {getUserName(a.user_id)}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-gray-700 font-medium" title={a.indicator_name}>
                    {a.indicator_name}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                    {MONTHS[a.month - 1]}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="text-gray-600 font-semibold">{a.target_value}</span>
                  <span className="text-gray-400 text-xs">%</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="text-gray-600 font-semibold">{a.weight}</span>
                  <span className="text-gray-400 text-xs">%</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="text-gray-600 text-xs">{FREQ_LABELS[a.frequency] || a.frequency}</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                    a.is_active 
                      ? "bg-emerald-100 text-emerald-700" 
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {a.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button 
                      onClick={() => onEdit(a)} 
                      className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => onDelete(a.id)} 
                      className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}