import { useState } from "react";
import { FileText, Filter, X, ChevronDown, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../hooks/useAuth";
import * as actionPlanApi from "../../../api/actionPlan.api";

const getMonthName = (month) => {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return months[month - 1] || month;
};

export default function ActionPlanPage() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const isLeaderOrAdmin = user?.roles?.some(r => ["LEADER", "ADMIN"].includes(r));

  const { data: actionPlans, isLoading } = useQuery({
    queryKey: isLeaderOrAdmin ? ["team", "action-plans", user?.id, year] : ["my", "action-plans", year],
    queryFn: () => isLeaderOrAdmin 
      ? actionPlanApi.getTeamActionPlans(user.id, year)
      : actionPlanApi.getMyActionPlans(year),
    enabled: !!user?.id,
  });

  const filteredPlans = actionPlans || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Planes de Acción
            </h1>
            <p className="text-gray-500 text-sm">
              {isLeaderOrAdmin ? "Planes de acción de tu equipo" : "Tus planes de acción"}
            </p>
          </div>
        </div>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
        >
          <option value={currentYear}>{currentYear}</option>
          <option value={currentYear - 1}>{currentYear - 1}</option>
          <option value={currentYear - 2}>{currentYear - 2}</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Cargando planes de acción...</div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sin planes de acción
          </h3>
          <p className="text-gray-500">
            No hay planes de acción para mostrar en este período
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  {isLeaderOrAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Colaborador</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Mes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Indicador</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Meta</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Logrado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPlans.map((plan) => {
                  const isMet = plan.achieved_percentage >= plan.target_value;
                  return (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      {isLeaderOrAdmin && (
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {plan.user_name || "Sin nombre"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {plan.position_name}
                            </p>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {getMonthName(plan.month)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {plan.indicator_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {plan.target_value}%
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {plan.achieved_percentage !== null
                          ? `${plan.achieved_percentage.toFixed(1)}%`
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          isMet
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {isMet ? "Cumplido" : "No cumplido"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedPlan(plan)}
                          className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                        >
                          Ver detalles
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Detalles del Plan de Acción
              </h3>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {isLeaderOrAdmin && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Colaborador</p>
                  <p className="font-medium">{selectedPlan.user_name}</p>
                  <p className="text-xs text-gray-500">{selectedPlan.position_name}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Indicador</p>
                  <p className="font-medium">{selectedPlan.indicator_name}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Período</p>
                  <p className="font-medium">{getMonthName(selectedPlan.month)} / {selectedPlan.year}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Meta</p>
                  <p className="text-lg font-bold text-gray-900">{selectedPlan.target_value}%</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Logrado</p>
                  <p className={`text-lg font-bold ${selectedPlan.achieved_percentage >= selectedPlan.target_value ? "text-green-600" : "text-red-600"}`}>
                    {selectedPlan.achieved_percentage?.toFixed(1) || "-"}%
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Estado</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    selectedPlan.achieved_percentage >= selectedPlan.target_value
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {selectedPlan.achieved_percentage >= selectedPlan.target_value ? "Cumplido" : "No cumplido"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razón del no cumplimiento
                </label>
                <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 min-h-15">
                  {selectedPlan.reason_not_met || "No especificada"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan de Acción
                </label>
                <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 min-h-20 whitespace-pre-wrap">
                  {selectedPlan.action_plan}
                </div>
              </div>

              {selectedPlan.created_at && (
                <p className="text-xs text-gray-400 text-right">
                  Creado: {new Date(selectedPlan.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}