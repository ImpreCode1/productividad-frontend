import { Target, User, Edit, Trash2 } from "lucide-react";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function AssignmentList({ assignments, users, onEdit, onDelete }) {
  const getUserName = (userId) => {
    const user = users?.find((u) => u.id === userId);
    return user?.name || "Sin usuario";
  };

  if (!assignments || assignments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-10 text-center">
        <Target className="h-14 w-14 mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-semibold text-gray-700">Sin Indicadores</h3>
        <p className="text-gray-400 text-sm mt-1">No hay indicadores para este período</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
      <table className="min-w-full text-sm table-fixed">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 tracking-wide w-48">Usuario</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 tracking-wide w-56">Indicador</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 tracking-wide w-16">Mes</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 tracking-wide w-14">Meta</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 tracking-wide w-14">Peso</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 tracking-wide w-20">Estado</th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600 tracking-wide w-20"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {assignments.map((a) => (
            <tr key={a.id} className="hover:bg-blue-50/50 transition-colors duration-150">
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="text-gray-700 font-medium" title={getUserName(a.user_id)}>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}