import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LineChart, Save, AlertCircle, X, ChevronDown, ChevronRight } from "lucide-react";
import api from "../../../api/client";
import { useAuth } from "../../../hooks/useAuth";
import * as trackingApi from "../../../api/tracking.api";
import * as actionPlanApi from "../../../api/actionPlan.api";

const getMonthName = (month) => {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return months[month - 1] || month;
};

export default function TrackingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [expandedUsers, setExpandedUsers] = useState({});
  const [expandedIndicators, setExpandedIndicators] = useState({});
  const [closeModal, setCloseModal] = useState({ open: false, item: null });
  const [caseInput, setCaseInput] = useState({ casos: "", total: "" });
  const [actionPlanModal, setActionPlanModal] = useState({ open: false, item: null, actionPlanId: null });
  const [actionPlanData, setActionPlanData] = useState({ reason_not_met: "", action_plan: "" });
  const [actionPlanLoading, setActionPlanLoading] = useState(false);

  const isLeader = user?.roles?.includes("LEADER") || user?.roles?.includes("ADMIN");

  const { data: tracking, isLoading } = useQuery({
    queryKey: isLeader ? ["tracking", "team", year] : ["tracking", "me", year],
    queryFn: async () => {
      if (isLeader) {
        const { data } = await trackingApi.getTeamTracking(year);
        return data.tracking;
      } else {
        const { data } = await trackingApi.getMyTracking(year);
        return data.tracking;
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, achieved_value, achieved_total }) => {
      const { data } = await api.patch(`/tracking/${id}`, { achieved_value, achieved_total });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tracking", "me", year]);
      queryClient.invalidateQueries(["tracking", "team", year]);
      queryClient.invalidateQueries(["dashboard", "me", year]);
    },
  });

  const closeMutation = useMutation({
    mutationFn: async ({ trackingId, achievedValue, achievedTotal }) =>
      trackingApi.closeTracking(trackingId, achievedValue, achievedTotal),
    onSuccess: () => {
      queryClient.invalidateQueries(["tracking", "team", year]);
      queryClient.invalidateQueries(["team", "dashboard", year]);
      setCloseModal({ open: false, item: null });
      setCaseInput({ casos: "", total: "" });
    },
  });

  const toggleUser = (userId) => setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
  const toggleIndicator = (key) => setExpandedIndicators(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = (id, value, total = null) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;
    updateMutation.mutate({ id, achieved_value: numValue, achieved_total: total ? parseFloat(total) : null });
  };

  const handleOpenCloseModal = (item) => {
    setCloseModal({ open: true, item });
    setCaseInput({ casos: item.achieved_value || "", total: item.achieved_total || "" });
  };

  const handleClose = async () => {
    if (!closeModal.item?.id) return;
    const casos = parseFloat(caseInput.casos);
    const total = parseFloat(caseInput.total);
    if (isNaN(casos) || isNaN(total) || total <= 0) {
      alert("Por favor ingresa valores válidos");
      return;
    }
    try {
      await closeMutation.mutateAsync({
        trackingId: closeModal.item.id,
        achievedValue: casos,
        achievedTotal: total,
      });
    } catch (error) {
      alert(error.response?.data?.detail || "Error al cerrar");
    }
  };

  const handleOpenActionPlanModal = (item) => {
    const existingPlan = item.action_plans?.[0];
    setActionPlanModal({ open: true, item, actionPlanId: existingPlan?.id || null });
    if (existingPlan) {
      setActionPlanData({ reason_not_met: existingPlan.reason_not_met || "", action_plan: existingPlan.action_plan || "" });
    } else {
      setActionPlanData({ reason_not_met: "", action_plan: "" });
    }
  };

  const handleSaveActionPlan = async () => {
    if (!actionPlanModal.item?.id) return;
    if (!actionPlanData.action_plan.trim()) {
      alert("Por favor ingresa el plan de acción");
      return;
    }
    try {
      setActionPlanLoading(true);
      if (actionPlanModal.actionPlanId) {
        await actionPlanApi.updateActionPlan(actionPlanModal.actionPlanId, actionPlanData);
      } else {
        await actionPlanApi.createActionPlan(actionPlanModal.item.id, actionPlanData);
      }
      queryClient.invalidateQueries(["tracking", "team", year]);
      setActionPlanModal({ open: false, item: null, actionPlanId: null });
      setActionPlanData({ reason_not_met: "", action_plan: "" });
    } catch (error) {
      alert(error.response?.data?.detail || "Error al guardar plan de acción");
    } finally {
      setActionPlanLoading(false);
    }
  };

  const getStatusBadge = (item) => {
    if (item.is_closed) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Cerrado</span>;
    }
    if (item.status === "COMPLETED") {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Completado</span>;
    }
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Pendiente</span>;
  };

  const canRegister = (item) => !item.is_closed && (!item.status || item.status === "PENDING");
  const canClose = (item) => !item.is_closed && item.status === "COMPLETED";

  const groupedByUser = isLeader ? tracking?.reduce((acc, item) => {
    if (!acc[item.user_id]) {
      acc[item.user_id] = { user_id: item.user_id, user_name: item.user_name, user_email: item.user_email, position_name: item.position_name, items: [] };
    }
    acc[item.user_id].items.push(item);
    return acc;
  }, {}) : {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LineChart className="h-7 w-7" />
            {isLeader ? "Seguimiento del Equipo" : "Mi Seguimiento"}
          </h1>
          <p className="text-gray-500 mt-1">
            {isLeader ? "Registra y cierra el avance de tus indicadores" : "Registra el avance de tus indicadores mensuales"}
          </p>
        </div>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={currentYear}>{currentYear}</option>
          <option value={currentYear - 1}>{currentYear - 1}</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="text-gray-500">Cargando...</div></div>
      ) : !tracking?.length ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <LineChart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin seguimiento</h3>
          <p className="text-gray-500">No tienes indicadores asignados para el año {year}</p>
        </div>
      ) : isLeader ? (
        <div className="space-y-4">
          {Object.values(groupedByUser).map((userGroup) => (
            <div key={userGroup.user_id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 cursor-pointer hover:bg-gray-100 border-b border-gray-200" onClick={() => toggleUser(userGroup.user_id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedUsers[userGroup.user_id] ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{userGroup.user_name}</h3>
                      <p className="text-sm text-gray-500">{userGroup.position_name || "Sin cargo"} • {userGroup.user_email}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{userGroup.items.length} registros</div>
                </div>
              </div>

              {expandedUsers[userGroup.user_id] && (
                <div className="p-4">
                  {userGroup.items.map((item) => {
                    const key = `${item.user_id}-${item.indicator_name}-${item.month}`;
                    return (
                      <div key={key} className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-between" onClick={() => toggleIndicator(key)}>
                          <div className="flex items-center gap-2">
                            {expandedIndicators[key] ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                            <div>
                              <span className="font-medium text-gray-900">{item.indicator_name}</span>
                              <span className="ml-2 text-xs text-gray-500">Meta: {item.target_value}% • Peso: {item.weight}%</span>
                            </div>
                          </div>
                          {getStatusBadge(item)}
                        </div>

                        {expandedIndicators[key] && (
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700">{getMonthName(item.month)}</span>
                              {item.achievement_percentage !== null && (
                                <span className={`text-sm font-bold ${item.achievement_percentage >= item.target_value ? "text-green-600" : "text-red-600"}`}>
                                  {item.achievement_percentage.toFixed(1)}%
                                </span>
                              )}
                            </div>

                            {item.is_closed ? (
                              <div className="bg-gray-100 p-3 rounded-lg text-center">
                                <div className="text-lg font-bold text-gray-700">{item.achieved_value}/{item.achieved_total}</div>
                                <div className="text-xs text-gray-500">Cerrado</div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => handleOpenCloseModal(item)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                                  Cerrar evaluación
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(tracking.reduce((acc, item) => {
            if (!acc[item.assignment_id]) {
              acc[item.assignment_id] = { indicator_name: item.indicator_name, target_value: item.target_value, weight: item.weight, formula: item.formula, items: [] };
            }
            acc[item.assignment_id].items.push(item);
            return acc;
          }, {})).map((indicator) => (
            <div key={indicator.indicator_name} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900">{indicator.indicator_name}</h3>
                <p className="text-sm text-gray-500">Meta: {indicator.target_value}% • Peso: {indicator.weight}%</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {indicator.items.map((month) => (
                    <div key={month.id} className={`border rounded-lg p-4 ${month.is_closed ? "bg-gray-100 border-gray-300" : month.status === "COMPLETED" ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}>
                      <div className="text-sm font-medium text-gray-500 mb-2">{getMonthName(month.month)}</div>
                      {month.is_closed ? (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-700">{month.achieved_value}/{month.achieved_total}</div>
                          <div className="text-xs text-gray-500 mt-1">Cerrado</div>
                        </div>
                      ) : (
                        <div>
                          <input type="number" placeholder="Logrado" defaultValue={month.achieved_value || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-blue-500" />
                          <input type="number" placeholder="Total" defaultValue={month.achieved_total || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-blue-500" />
                          <button onClick={(e) => handleSave(month.id, e.target.previousSibling.previousSibling.value, e.target.previousSibling.value)} className="w-full flex items-center justify-center gap-1 bg-blue-600 text-white text-sm py-1 rounded hover:bg-blue-700">
                            <Save className="h-3 w-3" /> Guardar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {closeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Cerrar Evaluación</h3>
              <button onClick={() => setCloseModal({ open: false, item: null })} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Indicador</p>
                <p className="font-medium">{closeModal.item?.indicator_name}</p>
                <p className="text-sm text-gray-500">Mes: {getMonthName(closeModal.item?.month)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logrado</label>
                  <input type="number" step="0.01" value={caseInput.casos} onChange={(e) => setCaseInput({ ...caseInput, casos: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Valor logrado" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                  <input type="number" step="0.01" value={caseInput.total} onChange={(e) => setCaseInput({ ...caseInput, total: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Valor total" />
                </div>
              </div>
              {caseInput.casos && caseInput.total && parseFloat(caseInput.total) > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Resultado:</p>
                  <p className="text-lg font-bold text-blue-600">{((parseFloat(caseInput.casos) / parseFloat(caseInput.total)) * 100).toFixed(2)}%</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setCloseModal({ open: false, item: null })} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button onClick={handleClose} disabled={closeMutation.isPending} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {closeMutation.isPending ? "Guardando..." : "Cerrar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionPlanModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Plan de Acción</h3>
              <button onClick={() => setActionPlanModal({ open: false, item: null })} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razón del no cumplimiento (opcional)</label>
                <textarea value={actionPlanData.reason_not_met} onChange={(e) => setActionPlanData({ ...actionPlanData, reason_not_met: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Describe la razón" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan de Acción</label>
                <textarea value={actionPlanData.action_plan} onChange={(e) => setActionPlanData({ ...actionPlanData, action_plan: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Describe las acciones" required />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setActionPlanModal({ open: false, item: null })} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSaveActionPlan} disabled={actionPlanLoading} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                  {actionPlanLoading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {updateMutation.isError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />Error al guardar
        </div>
      )}
    </div>
  );
}