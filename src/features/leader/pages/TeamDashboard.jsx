import { useState } from "react";
import { Users, CheckCircle, Lock, Unlock, X, ChevronDown, ChevronRight, ClipboardList, Paperclip, FileText, Image, File } from "lucide-react";
import { useTeamDashboard } from "../hooks";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import * as trackingApi from "../../../api/tracking.api";
import * as actionPlanApi from "../../../api/actionPlan.api";
import * as evidenceApi from "../../../api/evidence.api";
import api from "../../../api/client";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

export default function TeamDashboard() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const { data: dashboard, isLoading } = useTeamDashboard(year, month);
  const queryClient = useQueryClient();

  const [expandedMembers, setExpandedMembers] = useState({});
  const [expandedIndicators, setExpandedIndicators] = useState({});
  const [closeModal, setCloseModal] = useState({ open: false, month: null, indicator: null, assignmentId: null });
  const [caseInput, setCaseInput] = useState({ casos: "", total: "" });
  const [inputMode, setInputMode] = useState("formula");
  const [directPercentage, setDirectPercentage] = useState("");
  const [actionPlanModal, setActionPlanModal] = useState({ open: false, month: null, indicator: null, actionPlanId: null });
  const [actionPlanData, setActionPlanData] = useState({ reason_not_met: "", action_plan: "" });
  const [actionPlanLoading, setActionPlanLoading] = useState(false);
  const [evidenceModal, setEvidenceModal] = useState({ open: false, trackingId: null, monthName: "", indicatorName: "" });

  const { data: evidenceData, refetch: refetchEvidence, isLoading: evidenceLoading, error: evidenceError } = useQuery({
    queryKey: ["evidence", evidenceModal.trackingId],
    queryFn: () => evidenceModal.trackingId ? evidenceApi.getEvidence(evidenceModal.trackingId) : Promise.resolve({ data: { evidence: [] } }),
    enabled: !!evidenceModal.trackingId,
  });

  const closeMutation = useMutation({
    mutationFn: ({ trackingId, achievedValue, achievedTotal }) => 
      trackingApi.closeTracking(trackingId, achievedValue, achievedTotal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "dashboard", year] });
      setCloseModal({ open: false, month: null, indicator: null });
      setCaseInput({ casos: "", total: "" });
      setDirectPercentage("");
      setInputMode("formula");
    },
  });

  const handleOpenEvidenceModal = (month, indicator) => {
    // console.log("Opening evidence modal - month:", month, "indicator:", indicator);
    if (!month.tracking_id) {
      alert("Error: ID de tracking no disponible");
      return;
    }
    setEvidenceModal({
      open: true,
      trackingId: month.tracking_id,
      monthName: getMonthName(month.month),
      indicatorName: indicator.indicator_name
    });
  };

  const toggleMember = (userId) => {
    setExpandedMembers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const toggleIndicator = (indicatorKey) => {
    setExpandedIndicators(prev => ({
      ...prev,
      [indicatorKey]: !prev[indicatorKey]
    }));
  };

  const handleOpenCloseModal = (month, indicator, assignmentId) => {
    setCloseModal({ open: true, month, indicator, assignmentId });
    setCaseInput({ casos: "", total: "" });
    setDirectPercentage("");
    setInputMode("formula");
  };

  const handleClose = async () => {
    if (!closeModal.month?.tracking_id && !closeModal.assignmentId) {
      alert("Error: No se puede procesar. Refresca la página.");
      return;
    }

    let finalValue = null;
    let finalTotal = null;
    
    if (inputMode === "formula") {
      if (caseInput.casos && caseInput.total) {
        const casos = parseFloat(caseInput.casos);
        const total = parseFloat(caseInput.total);
        if (total > 0) {
          finalValue = casos;
          finalTotal = total;
        }
      }

      if (finalValue === null || finalTotal === null) {
        alert("Por favor ingresa los valores de la fórmula");
        return;
      }
    } else {
      if (!directPercentage) {
        alert("Por favor ingresa el porcentaje");
        return;
      }
      const percentage = parseFloat(directPercentage);
      if (percentage < 0 || percentage > 100) {
        alert("El porcentaje debe estar entre 0 y 100");
        return;
      }
      finalValue = percentage;
      finalTotal = 100;
    }

    const percentage = (finalValue / finalTotal) * 100;
    const targetValue = Number(closeModal.indicator?.target_value) || 0;
    const isMet = percentage >= targetValue;

    try {
      let newTrackingId = closeModal.month?.tracking_id;

      if (newTrackingId) {
        await closeMutation.mutateAsync({
          trackingId: newTrackingId,
          achievedValue: finalValue,
          achievedTotal: finalTotal,
        });
      } else {
        const response = await api.patch(
          `/tracking/assignment/${closeModal.assignmentId}/close`,
          { achieved_value: finalValue, achieved_total: finalTotal }
        );
        newTrackingId = response.data.id;
      }

      queryClient.invalidateQueries({ queryKey: ["team", "dashboard", year] });

      const updatedMonth = { ...closeModal.month, tracking_id: newTrackingId };

      if (isMet) {
        setActionPlanData({
          reason_not_met: "Meta cumplida satisfactoriamente",
          action_plan: "Se alcanzó el objetivo establecido. Continuar con el mismo nivel de desempeño."
        });
        setActionPlanModal({ 
          open: true, 
          month: updatedMonth, 
          indicator: closeModal.indicator,
          actionPlanId: null 
        });
      } else {
        setActionPlanData({ reason_not_met: "", action_plan: "" });
        setActionPlanModal({ 
          open: true, 
          month: updatedMonth, 
          indicator: closeModal.indicator,
          actionPlanId: null 
        });
      }
      setCloseModal({ open: false, month: null, indicator: null, assignmentId: null });
      setCaseInput({ casos: "", total: "" });
      setDirectPercentage("");
      setInputMode("formula");
    } catch (error) {
      alert(error.response?.data?.detail || "Error al cerrar evaluación");
    }
  };

  const handleOpenActionPlanModal = (month, indicator) => {
    // Si ya existe un plan de acción, guardamos el ID para actualizar
    const existingPlan = month.action_plans && month.action_plans.length > 0 
      ? month.action_plans[0] 
      : null;
    
    setActionPlanModal({ 
      open: true, 
      month, 
      indicator,
      actionPlanId: existingPlan?.id || null 
    });
    
    if (existingPlan) {
      setActionPlanData({
        reason_not_met: existingPlan.reason_not_met || "",
        action_plan: existingPlan.action_plan || ""
      });
    } else {
      setActionPlanData({ reason_not_met: "", action_plan: "" });
    }
  };

  const handleSaveActionPlan = async () => {
    if (!actionPlanModal.month?.tracking_id) {
      alert("Error: ID de tracking no disponible");
      return;
    }

    if (!actionPlanData.action_plan.trim()) {
      alert("Por favor ingresa el plan de acción");
      return;
    }

    try {
      setActionPlanLoading(true);
      // Si existe actionPlanId, actualizar; si no, crear nuevo
      if (actionPlanModal.actionPlanId) {
        await actionPlanApi.updateActionPlan(actionPlanModal.actionPlanId, actionPlanData);
      } else {
        await actionPlanApi.createActionPlan(actionPlanModal.month.tracking_id, actionPlanData);
      }
      
      queryClient.invalidateQueries({ queryKey: ["team", "dashboard", year] });
      setActionPlanModal({ open: false, month: null, indicator: null, actionPlanId: null });
      setActionPlanData({ reason_not_met: "", action_plan: "" });
    } catch (error) {
      alert(error.response?.data?.detail || "Error al guardar plan de acción");
    } finally {
      setActionPlanLoading(false);
    }
  };

  const getMonthName = (month) => {
    const months = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];
    return months[month - 1];
  };

  const getStatusBadge = (month) => {
    if (month.is_closed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Lock className="h-3 w-3" />
          Cerrado
        </span>
      );
    }
    if (month.status === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3" />
          Completado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <Unlock className="h-3 w-3" />
        Pendiente
      </span>
    );
  };

  const canRegister = (month) => !month.is_closed && (!month.status || month.status === "PENDING") && !month.tracking_id;
  const canClose = (month) => !month.is_closed && month.status === "COMPLETED" && !!month.tracking_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-7 w-7" />
            Mi Equipo
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona y revisa el desempeño de tu equipo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={0}>Todos los meses</option>
            <option value={1}>Enero</option>
            <option value={2}>Febrero</option>
            <option value={3}>Marzo</option>
            <option value={4}>Abril</option>
            <option value={5}>Mayo</option>
            <option value={6}>Junio</option>
            <option value={7}>Julio</option>
            <option value={8}>Agosto</option>
            <option value={9}>Septiembre</option>
            <option value={10}>Octubre</option>
            <option value={11}>Noviembre</option>
            <option value={12}>Diciembre</option>
          </select>

          <select
            value={year}
            onChange={(e) => { setYear(Number(e.target.value)); setMonth(0); }}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear - 2}>{currentYear - 2}</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="text-gray-500">Cargando equipo...</div>
        </div>
      ) : dashboard?.team?.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sin miembros en tu equipo
          </h3>
          <p className="text-gray-500">
            Aún no tienes colaboradores asignados a tu equipo
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {dashboard?.team?.map((member) => (
            <div
              key={member.user_id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div 
                className="px-6 py-4 border-b border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleMember(member.user_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedMembers[member.user_id] ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {member.name || member.user_name || "Sin nombre"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {member.position_name || member.position || "Sin cargo"} • {member.email || member.user_email || "Sin correo"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {member.indicators?.length || 0} indicadores
                  </div>
                </div>
              </div>

              {expandedMembers[member.user_id] && (
                <div className="p-4">
                  {member.indicators?.length > 0 ? (
                    <div className="space-y-2">
                      {member.indicators.map((indicator) => {
                        const indicatorKey = `${member.user_id}-${indicator.indicator_name}`;
                        return (
                          <div key={indicatorKey} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div 
                              className="px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                              onClick={() => toggleIndicator(indicatorKey)}
                            >
                              <div className="flex items-center gap-2">
                                {expandedIndicators[indicatorKey] ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                                <div>
                                  <span className="font-medium text-gray-900">
                                    {indicator.indicator_name}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    Meta: {indicator.target_value} • Peso: {indicator.weight}%
                                  </span>
                                  {indicator.formula && (
                                    <span className="ml-2 text-xs text-blue-600">
                                      Fórmula: {indicator.formula}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {indicator.months?.filter(m => m.is_closed).length}/{indicator.months?.length || 0} meses
                              </div>
                            </div>

                            {expandedIndicators[indicatorKey] && (
                              <div className="overflow-x-auto">
                                <table className="min-w-full">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mes</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Meta</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Logrado</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cumplimiento</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Estado</th>
                                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Evidencias</th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Acción</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {indicator.months?.map((month) => (
                                      <tr key={month.month} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                          {getMonthName(month.month)}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                          {indicator.target_value}%
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                          {month.achieved_value != null && month.achieved_total != null
                                            ? `${month.achieved_value}/${month.achieved_total}`
                                            : month.achieved_value != null 
                                              ? Number(month.achieved_value).toFixed(2) + "%"
                                              : "-"}
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                          {month.achieved_value != null && month.achieved_total != null ? (
                                            (() => {
                                              const percentage = (Number(month.achieved_value) / Number(month.achieved_total)) * 100;
                                              return percentage >= Number(indicator.target_value) ? (
                                                <span className="text-green-600 font-medium">CUMPLIDO</span>
                                              ) : (
                                                <span className="text-red-600 font-medium">NO CUMPLIDO</span>
                                              );
                                            })()
                                          ) : "-"}
                                        </td>
                                        <td className="px-4 py-2">
                                          {getStatusBadge(month)}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                          <button
                                            onClick={() => handleOpenEvidenceModal(month, indicator)}
                                            className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors ${
                                              month.evidence_count > 0
                                                ? "text-green-600 hover:bg-green-50"
                                                : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                            }`}
                                            title={month.evidence_count > 0 ? `Ver ${month.evidence_count} evidencia(s)` : "Sin evidencias"}
                                          >
                                            <Paperclip size={18} />
                                            {month.evidence_count > 0 && (
                                              <span className="ml-1 text-xs font-medium">{month.evidence_count}</span>
                                            )}
                                          </button>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                          {canRegister(month) && (
                                            <button
                                              onClick={() => handleOpenCloseModal(month, indicator, indicator.id)}
                                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 mr-1"
                                            >
                                              Registrar
                                            </button>
                                          )}
                                          {canClose(month) && (
                                            <button
                                              onClick={() => handleOpenCloseModal(month, indicator, indicator.id)}
                                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 mr-1"
                                            >
                                              Cerrar
                                            </button>
                                          )}
                                          {month.is_closed && (
                                            <button
                                              onClick={() => handleOpenActionPlanModal(month, indicator)}
                                              className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                                            >
                                              Plan Acción
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Sin indicadores asignados
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {closeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                Registrar Avance
              </h3>
              <button
                onClick={() => setCloseModal({ open: false, month: null, indicator: null, assignmentId: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Indicador</p>
                <p className="font-medium">{closeModal.indicator?.indicator_name}</p>
                <p className="text-sm text-gray-500">
                  Meta: {closeModal.indicator?.target_value}% • Peso: {closeModal.indicator?.weight}%
                </p>
                {closeModal.indicator?.formula && (
                  <p className="text-xs text-blue-600 mt-1">
                    Fórmula: {closeModal.indicator.formula}
                  </p>
                )}
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setInputMode("formula")}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                    inputMode === "formula"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Fórmula
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("percentage")}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                    inputMode === "percentage"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Porcentaje Directo
                </button>
              </div>

              {inputMode === "formula" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valores de la fórmula
                    </label>
                    <div className="text-xs text-gray-500 mb-2">
                      Ingresa los valores para calcular el porcentaje de la fórmula
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Logrado
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={caseInput.casos}
                        onChange={(e) => setCaseInput({ ...caseInput, casos: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Valor logrado (numerador)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={caseInput.total}
                        onChange={(e) => setCaseInput({ ...caseInput, total: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Valor total (denominador)"
                      />
                    </div>
                  </div>

                  {caseInput.casos && caseInput.total && parseFloat(caseInput.total) > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Resultado (se guardará como logrado):</p>
                      <p className="text-lg font-bold text-blue-600">
                        {((parseFloat(caseInput.casos) / parseFloat(caseInput.total)) * 100).toFixed(2)}%
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Porcentaje de cumplimiento
                    </label>
                    <div className="text-xs text-gray-500 mb-2">
                      Ingresa directamente el porcentaje logrado (0-100)
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={directPercentage}
                        onChange={(e) => setDirectPercentage(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: 85.5"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>
                  {directPercentage && (
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Se guardará como:</p>
                      <p className="text-lg font-bold text-blue-600">
                        {parseFloat(directPercentage).toFixed(2)}%
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setCloseModal({ open: false, month: null, indicator: null, assignmentId: null })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClose}
                  disabled={closeMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {closeMutation.isPending ? "Guardando..." : "Guardar"}
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
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Plan de Acción
              </h3>
              <button
                onClick={() => setActionPlanModal({ open: false, month: null, indicator: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Indicador</p>
                <p className="font-medium">{actionPlanModal.indicator?.indicator_name}</p>
                <p className="text-sm text-gray-500">
                  Mes: {actionPlanModal.month ? getMonthName(actionPlanModal.month.month) : "-"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razón del no cumplimiento (opcional)
                </label>
                <textarea
                  value={actionPlanData.reason_not_met}
                  onChange={(e) => setActionPlanData({ ...actionPlanData, reason_not_met: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Describe la razón por la que no se cumplió la meta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan de Acción
                </label>
                <textarea
                  value={actionPlanData.action_plan}
                  onChange={(e) => setActionPlanData({ ...actionPlanData, action_plan: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describe las acciones a tomar"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setActionPlanModal({ open: false, month: null, indicator: null })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveActionPlan}
                  disabled={actionPlanLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {actionPlanLoading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {evidenceModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Evidencias
                </h3>
                <p className="text-sm text-gray-500">
                  {evidenceModal.monthName} - {evidenceModal.indicatorName}
                </p>
              </div>
              <button
                onClick={() => setEvidenceModal({ open: false, trackingId: null, monthName: "", indicatorName: "" })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              {evidenceLoading ? (
                <p className="text-gray-500 text-center py-4">Cargando...</p>
              ) : evidenceError ? (
                <div className="text-center py-4">
                  <p className="text-red-500 font-medium">Error al cargar evidencias</p>
                  <p className="text-xs text-gray-500 mt-1">{evidenceError.response?.data?.detail || evidenceError.message}</p>
                </div>
              ) : !evidenceData?.data?.evidence || evidenceData.data.evidence.length === 0 ? (
                <div className="text-center py-8">
                  <Paperclip className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No hay evidencias para este seguimiento</p>
                  <p className="text-xs text-gray-400 mt-2">El empleado no ha subido ningún archivo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {evidenceData?.data?.evidence?.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {ev.file_path?.endsWith(".pdf") ? (
                          <FileText size={16} className="text-red-500" />
                        ) : ev.file_path?.match(/\.(jpg|jpeg|png)$/i) ? (
                          <Image size={16} className="text-green-500" />
                        ) : (
                          <File size={16} className="text-gray-500" />
                        )}
                        <a
                          href={`${backendUrl}${ev.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {ev.file_path?.split("/").pop()}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <button
                onClick={() => setEvidenceModal({ open: false, trackingId: null, monthName: "", indicatorName: "" })}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}