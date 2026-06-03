import { useState } from "react";
import { Users, CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown, ChevronRight, Paperclip, FileText, Image, File, Send, ThumbsUp, ThumbsDown } from "lucide-react";
import { useTeamDashboard } from "../hooks";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import * as trackingApi from "../../../api/tracking.api";
import * as actionPlanApi from "../../../api/actionPlan.api";
import * as approvalApi from "../../../api/approval.api";
import api from "../../../api/client";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

const statusConfig = {
  PENDIENTE: { bg: "bg-gray-100", text: "text-gray-600", icon: Clock, label: "Pendiente" },
  EN_REVISION: { bg: "bg-yellow-100", text: "text-yellow-700", icon: AlertTriangle, label: "En revisión" },
  APROBADO: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle, label: "Aprobado" },
  RECHAZADO: { bg: "bg-red-100", text: "text-red-700", icon: XCircle, label: "Rechazado" },
};

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
  const [approveModal, setApproveModal] = useState({ open: false, tracking: null, monthData: null, indicatorData: null });
  const [rejectModal, setRejectModal] = useState({ open: false, tracking: null, monthData: null, comment: "" });
  const [actionPlanModal, setActionPlanModal] = useState({ open: false, month: null, indicator: null, actionPlanId: null });
  const [actionPlanData, setActionPlanData] = useState({ reason_not_met: "", action_plan: "" });
  const [actionPlanLoading, setActionPlanLoading] = useState(false);
  const [evidenceModal, setEvidenceModal] = useState({ open: false, trackingId: null, indicatorName: "" });
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: evidenceData, isLoading: evidenceLoading, error: evidenceError } = useQuery({
    queryKey: ["evidenceByTracking", evidenceModal.trackingId],
    queryFn: () => evidenceModal.trackingId
      ? approvalApi.getEvidenceByTracking(evidenceModal.trackingId)
      : Promise.resolve({ data: { evidence: [] } }),
    enabled: !!evidenceModal.trackingId,
  });

  const approveMutation = useMutation({
    mutationFn: (trackingId) => approvalApi.approveTracking(trackingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "dashboard", year] });
      setApproveModal({ open: false, tracking: null, monthData: null, indicatorData: null });
    },
    onError: (error) => {
      alert(error.response?.data?.detail || "Error al aprobar");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ trackingId, comment }) => approvalApi.rejectTracking(trackingId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "dashboard", year] });
      setRejectModal({ open: false, tracking: null, comment: "" });
    },
    onError: (error) => {
      alert(error.response?.data?.detail || "Error al rechazar");
    },
  });

  const closeMutation = useMutation({
    mutationFn: ({ trackingId, achievedValue, achievedTotal }) =>
      trackingApi.closeTracking(trackingId, achievedValue, achievedTotal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "dashboard", year] });
      setCloseModal({ open: false, month: null, indicator: null, assignmentId: null });
      setCaseInput({ casos: "", total: "" });
      setDirectPercentage("");
      setInputMode("formula");
    },
  });

  const handleOpenEvidenceModal = (trackingId, indicatorName) => {
    setEvidenceModal({
      open: true,
      trackingId,
      indicatorName,
    });
  };

  const toggleMember = (userId) => {
    setExpandedMembers(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const toggleIndicator = (indicatorKey) => {
    setExpandedIndicators(prev => ({ ...prev, [indicatorKey]: !prev[indicatorKey] }));
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
          reason_not_met: "Se ha logrado el cumplimiento del indicador.",
          action_plan: "Se ha logrado el cumplimiento del indicador."
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
    const m = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return m[month - 1];
  };

  const getStatusBadge = (month) => {
    const status = month.approval_status || (month.is_closed ? "APROBADO" : month.status === "COMPLETED" ? "PENDIENTE" : "PENDIENTE");
    const config = statusConfig[status] || statusConfig.PENDIENTE;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-7 w-7" />
            Mi Equipo
          </h1>
          <p className="text-gray-500 mt-1">Revisa, aprueba o rechaza los KPIs de tu equipo</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value={0}>Todos los meses</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][i]}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm">
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="text-gray-500">Cargando equipo...</div></div>
      ) : dashboard?.team?.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin miembros en tu equipo</h3>
          <p className="text-gray-500">Aún no tienes colaboradores asignados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dashboard?.team?.map((member) => {
            const totalMonths = member.indicators?.reduce((acc, ind) => acc + (ind.months?.length || 0), 0) || 0;
            const closedMonths = member.indicators?.reduce((acc, ind) => acc + (ind.months?.filter(m => m.approval_status === "APROBADO").length || 0), 0) || 0;
            const inReview = member.indicators?.reduce((acc, ind) => acc + (ind.months?.filter(m => m.approval_status === "EN_REVISION").length || 0), 0) || 0;
            const progress = totalMonths > 0 ? Math.round((closedMonths / totalMonths) * 100) : 0;

            return (
              <div key={member.user_id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleMember(member.user_id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedMembers[member.user_id] ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{member.name || "Sin nombre"}</h3>
                        <p className="text-sm text-gray-500">{member.position_name || ""} • {member.email || ""}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">
                        {closedMonths}/{totalMonths} aprobados
                        {inReview > 0 && <span className="ml-2 text-yellow-600 font-medium">{inReview} en revisión</span>}
                      </div>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${progress === 100 ? 'bg-green-500' : progress > 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                          style={{ width: `${progress}%` }} />
                      </div>
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
                              <div className="px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                                onClick={() => toggleIndicator(indicatorKey)}>
                                <div className="flex items-center gap-2">
                                  {expandedIndicators[indicatorKey] ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                                  <div>
                                    <span className="font-medium text-gray-900">{indicator.indicator_name}</span>
                                    <span className="ml-2 text-xs text-gray-500">Meta: {indicator.target_value}% • Peso: {indicator.weight}%</span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {indicator.months?.filter(m => m.approval_status === "APROBADO").length}/{indicator.months?.length || 0} meses
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
                                      {indicator.months?.map((month) => {
                                        const isInReview = month.approval_status === "EN_REVISION";
                                        const isApproved = month.approval_status === "APROBADO";
                                        const isRejected = month.approval_status === "RECHAZADO";
                                        const canRegister = !month.is_closed && (!month.status || month.status === "PENDING") && !month.tracking_id;
                                        const canClose = !month.is_closed && month.status === "COMPLETED" && !!month.tracking_id && !isInReview && !isApproved;

                                        return (
                                          <tr key={month.month} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 text-sm font-medium text-gray-900">{getMonthName(month.month)}</td>
                                            <td className="px-4 py-2 text-sm text-gray-500">{indicator.target_value}%</td>
                                            <td className="px-4 py-2 text-sm text-gray-900">
                                              {month.achieved_value != null && month.achieved_total != null
                                                ? `${month.achieved_value}/${month.achieved_total}`
                                                : month.achieved_value != null
                                                  ? Number(month.achieved_value).toFixed(2) + "%"
                                                  : "-"}
                                            </td>
                                            <td className="px-4 py-2 text-sm">
                                              {month.achievement_percentage != null ? (
                                                Number(month.achievement_percentage) >= Number(indicator.target_value)
                                                  ? <span className="text-green-600 font-medium">CUMPLIDO</span>
                                                  : <span className="text-red-600 font-medium">NO CUMPLIDO</span>
                                              ) : "-"}
                                            </td>
                                            <td className="px-4 py-2">{getStatusBadge(month)}</td>
                                            <td className="px-4 py-2 text-center">
                                              <button onClick={() => handleOpenEvidenceModal(month.tracking_id, indicator.indicator_name)}
                                                className={`inline-flex items-center justify-center p-2 rounded-lg ${
                                                  (month.evidence_count && month.evidence_count > 0)
                                                    ? "text-green-600 hover:bg-green-50"
                                                    : "text-gray-300 hover:text-blue-600 hover:bg-blue-50"
                                                }`}>
                                                <Paperclip size={18} />
                                                {month.evidence_count != null && (
                                                  <span className={`ml-1 text-xs font-medium ${month.evidence_count > 0 ? "text-green-600" : "text-gray-400"}`}>
                                                    {month.evidence_count}
                                                  </span>
                                                )}
                                              </button>
                                            </td>
                                            <td className="px-4 py-2 text-right space-x-1">
                                              {isInReview && (
                                                <>
                                                  <button onClick={() => setApproveModal({ open: true, tracking: { id: month.tracking_id, indicator: indicator.indicator_name, month: month.month, user: member.name }, monthData: month, indicatorData: indicator })}
                                                    className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                                                    <ThumbsUp className="h-3 w-3 inline mr-1" />Aprobar
                                                  </button>
                                                  <button onClick={() => setRejectModal({ open: true, tracking: { id: month.tracking_id, indicator: indicator.indicator_name, month: month.month, user: member.name }, monthData: month, comment: "" })}
                                                    className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">
                                                    <ThumbsDown className="h-3 w-3 inline mr-1" />Rechazar
                                                  </button>
                                                </>
                                              )}
                                              {canRegister && (
                                                <button onClick={() => handleOpenCloseModal(month, indicator, indicator.id)}
                                                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 mr-1">
                                                  Registrar
                                                </button>
                                              )}
                                              {canClose && (
                                                <button onClick={() => handleOpenCloseModal(month, indicator, indicator.id)}
                                                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 mr-1">
                                                  Cerrar
                                                </button>
                                              )}
                                              {(isApproved || isRejected) && (
                                                <button onClick={() => handleOpenActionPlanModal(month, indicator)}
                                                  className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700">
                                                  Plan Acción
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Sin indicadores asignados</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Approve Modal */}
      {approveModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2"><ThumbsUp className="h-5 w-5 text-green-600" /> Aprobar KPI</h3>
              <button onClick={() => setApproveModal({ open: false, tracking: null, monthData: null, indicatorData: null })}
                className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                ¿Estás seguro de aprobar este KPI?
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{approveModal.tracking?.indicator}</p>
                <p className="text-sm text-gray-500">
                  {getMonthName(approveModal.tracking?.month)} • {approveModal.tracking?.user}
                </p>
                {approveModal.monthData?.achieved_value != null && (
                  <div className="mt-2 text-xs text-gray-500">
                    Logrado: {approveModal.monthData.achieved_value != null && approveModal.monthData.achieved_total != null
                      ? `${approveModal.monthData.achieved_value} / ${approveModal.monthData.achieved_total}`
                      : `${approveModal.monthData.achieved_value}%`}
                    {approveModal.monthData.achievement_percentage != null && (
                      <span className="ml-2">
                        • Cumplimiento: {Number(approveModal.monthData.achievement_percentage).toFixed(2)}%
                      </span>
                    )}
                  </div>
                )}
              </div>

              {approveModal.monthData?.action_plans?.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Plan de acción del empleado
                  </h4>
                  {approveModal.monthData.action_plans.map((plan, idx) => (
                    <div key={plan.id || idx} className="text-xs space-y-1">
                      {plan.reason_not_met && (
                        <div>
                          <span className="text-gray-500">Razón:</span>
                          <p className="text-gray-700 mt-0.5">{plan.reason_not_met}</p>
                        </div>
                      )}
                      {plan.action_plan && (
                        <div>
                          <span className="text-gray-500">Plan:</span>
                          <p className="text-gray-700 mt-0.5">{plan.action_plan}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setApproveModal({ open: false, tracking: null, monthData: null, indicatorData: null })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button onClick={() => approveMutation.mutate(approveModal.tracking.id)}
                  disabled={approveMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {approveMutation.isPending ? "Aprobando..." : "Sí, aprobar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2"><ThumbsDown className="h-5 w-5 text-red-600" /> Rechazar KPI</h3>
              <button onClick={() => setRejectModal({ open: false, tracking: null, monthData: null, comment: "" })}
                className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{rejectModal.tracking?.indicator}</p>
                <p className="text-sm text-gray-500">
                  {getMonthName(rejectModal.tracking?.month)} • {rejectModal.tracking?.user}
                </p>
                {rejectModal.monthData?.achieved_value != null && (
                  <div className="mt-2 text-xs text-gray-500">
                    Logrado: {rejectModal.monthData.achieved_value != null && rejectModal.monthData.achieved_total != null
                      ? `${rejectModal.monthData.achieved_value} / ${rejectModal.monthData.achieved_total}`
                      : `${rejectModal.monthData.achieved_value}%`}
                    {rejectModal.monthData.achievement_percentage != null && (
                      <span className="ml-2">
                        • Cumplimiento: {Number(rejectModal.monthData.achievement_percentage).toFixed(2)}%
                      </span>
                    )}
                  </div>
                )}
              </div>

              {rejectModal.monthData?.action_plans?.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Plan de acción del empleado
                  </h4>
                  {rejectModal.monthData.action_plans.map((plan, idx) => (
                    <div key={plan.id || idx} className="text-xs space-y-1">
                      {plan.reason_not_met && (
                        <div>
                          <span className="text-gray-500">Razón:</span>
                          <p className="text-gray-700 mt-0.5">{plan.reason_not_met}</p>
                        </div>
                      )}
                      {plan.action_plan && (
                        <div>
                          <span className="text-gray-500">Plan:</span>
                          <p className="text-gray-700 mt-0.5">{plan.action_plan}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo del rechazo <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectModal.comment}
                  onChange={(e) => setRejectModal(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[100px]"
                  placeholder="Indica al colaborador qué debe corregir..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setRejectModal({ open: false, tracking: null, monthData: null, comment: "" })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button
                  onClick={() => {
                    if (!rejectModal.comment.trim()) {
                      alert("El comentario de rechazo es obligatorio");
                      return;
                    }
                    rejectMutation.mutate({ trackingId: rejectModal.tracking.id, comment: rejectModal.comment });
                  }}
                  disabled={rejectMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {rejectMutation.isPending ? "Rechazando..." : "Rechazar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {closeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Registrar Avance</h3>
              <button onClick={() => setCloseModal({ open: false, month: null, indicator: null, assignmentId: null })}
                className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{closeModal.indicator?.indicator_name}</p>
                <p className="text-sm text-gray-500">Meta: {closeModal.indicator?.target_value}% • Peso: {closeModal.indicator?.weight}%</p>
              </div>
              <div className="flex gap-2 mb-4">
                <button onClick={() => setInputMode("formula")}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border ${inputMode === "formula" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300"}`}>
                  Fórmula
                </button>
                <button onClick={() => setInputMode("percentage")}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border ${inputMode === "percentage" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300"}`}>
                  Porcentaje Directo
                </button>
              </div>
              {inputMode === "formula" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logrado</label>
                    <input type="number" step="0.01" value={caseInput.casos}
                      onChange={(e) => setCaseInput({ ...caseInput, casos: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Valor logrado" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                    <input type="number" step="0.01" value={caseInput.total}
                      onChange={(e) => setCaseInput({ ...caseInput, total: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Valor total" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input type="number" step="0.01" min="0" max="100" value={directPercentage}
                    onChange={(e) => setDirectPercentage(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm" placeholder="Ej: 85.5" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setCloseModal({ open: false, month: null, indicator: null, assignmentId: null })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button onClick={handleClose} disabled={closeMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {closeMutation.isPending ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Plan Modal */}
      {actionPlanModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> Plan de Acción</h3>
              <button onClick={() => setActionPlanModal({ open: false, month: null, indicator: null })}
                className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{actionPlanModal.indicator?.indicator_name}</p>
                <p className="text-sm text-gray-500">Mes: {actionPlanModal.month ? getMonthName(actionPlanModal.month.month) : "-"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razón del no cumplimiento (opcional)</label>
                <textarea value={actionPlanData.reason_not_met}
                  onChange={(e) => setActionPlanData({ ...actionPlanData, reason_not_met: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Describe la razón" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan de Acción</label>
                <textarea value={actionPlanData.action_plan}
                  onChange={(e) => setActionPlanData({ ...actionPlanData, action_plan: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Describe las acciones a tomar" required />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setActionPlanModal({ open: false, month: null, indicator: null })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSaveActionPlan} disabled={actionPlanLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                  {actionPlanLoading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Modal */}
      {evidenceModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2"><Paperclip className="h-5 w-5" /> Evidencias</h3>
                <p className="text-sm text-gray-500">{evidenceModal.indicatorName}</p>
              </div>
              <button onClick={() => setEvidenceModal({ open: false, trackingId: null, indicatorName: "" })}
                className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              {evidenceLoading ? (
                <p className="text-gray-500 text-center py-4">Cargando...</p>
              ) : evidenceError ? (
                <p className="text-red-500 text-center py-4">Error al cargar evidencias</p>
              ) : !evidenceData?.data?.evidence || evidenceData.data.evidence.length === 0 ? (
                <div className="text-center py-8">
                  <Paperclip className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No hay evidencias para este indicador</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {evidenceData?.data?.evidence?.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {ev.file_path?.endsWith(".pdf") ? <FileText size={16} className="text-red-500" />
                          : ev.file_path?.match(/\.(jpg|jpeg|png)$/i) ? <Image size={16} className="text-green-500" />
                          : <File size={16} className="text-gray-500" />}
                        <a href={`${backendUrl}${ev.file_path}`} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline">
                          {ev.original_filename || ev.file_path?.split("/").pop()}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <button onClick={() => setEvidenceModal({ open: false, trackingId: null, indicatorName: "" })}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
