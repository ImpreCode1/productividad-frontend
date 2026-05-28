import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, TrendingUp, Target, CheckCircle, Send, XCircle, AlertTriangle, Clock, ChevronDown, ChevronRight } from "lucide-react";
import api from "../../../api/client";
import * as approvalApi from "../../../api/approval.api";

const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const statusConfig = {
  PENDIENTE: { bg: "bg-gray-100", text: "text-gray-600", icon: Clock, label: "Pendiente" },
  EN_REVISION: { bg: "bg-yellow-100", text: "text-yellow-700", icon: AlertTriangle, label: "En revisión" },
  APROBADO: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle, label: "Aprobado" },
  RECHAZADO: { bg: "bg-red-100", text: "text-red-700", icon: XCircle, label: "Rechazado" },
};

export default function EmployeeDashboard() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [expandedIndicators, setExpandedIndicators] = useState({});
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard", "me", year],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/me?year=${year}`);
      return data;
    },
  });

  const { data: userDetails } = useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const { data } = await api.get("/users/me");
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: (trackingId) => approvalApi.submitTracking(trackingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "me", year] });
    },
    onError: (error) => {
      alert(error.response?.data?.detail || "Error al enviar a revisión");
    },
  });

  const indicators = dashboardData?.indicators || [];

  const groupedIndicators = useMemo(() => {
    return indicators.reduce((acc, ind) => {
      const key = ind.indicator_name;
      if (!acc[key]) {
        acc[key] = {
          indicator_name: ind.indicator_name,
          weight: ind.weight,
          target_value: ind.target_value,
          formula: ind.formula,
          months: []
        };
      }
      ind.months?.forEach(m => {
        const existing = acc[key].months.findIndex(em => em.month === m.month);
        if (existing === -1) {
          acc[key].months.push(m);
        } else {
          if (!acc[key].months[existing].tracking_id && m.tracking_id) {
            acc[key].months[existing] = m;
          }
        }
      });
      acc[key].months.sort((a, b) => a.month - b.month);
      return acc;
    }, {});
  }, [indicators]);

  const uniqueIndicators = Object.values(groupedIndicators);
  const totalIndicators = uniqueIndicators.length;

  const allMonths = uniqueIndicators.flatMap(ind => ind.months || []);
  const approvedMonths = allMonths.filter(m => m.approval_status === "APROBADO");
  const inReviewMonths = allMonths.filter(m => m.approval_status === "EN_REVISION");
  const rejectedMonths = allMonths.filter(m => m.approval_status === "RECHAZADO");

  const canSubmit = (month) => {
    return (month.approval_status === "PENDIENTE" || month.approval_status === "RECHAZADO")
      && month.achieved_value != null
      && !month.is_closed;
  };

  const handleSubmitAll = async () => {
    const submitable = allMonths.filter(canSubmit);
    if (submitable.length === 0) {
      alert("No hay KPIs listos para enviar. Asegúrate de haber registrado valores.");
      return;
    }
    for (const month of submitable) {
      if (month.tracking_id) {
        try {
          await submitMutation.mutateAsync(month.tracking_id);
        } catch (e) {
          // continue with next
        }
      }
    }
    queryClient.invalidateQueries({ queryKey: ["dashboard", "me", year] });
  };

  const getMonthStatus = (month, targetValue) => {
    if (month.approval_status === "APROBADO") return "approved";
    if (month.approval_status === "EN_REVISION") return "in_review";
    if (month.approval_status === "RECHAZADO") return "rejected";
    if (month.achieved_value != null) return "completed";
    return "pending";
  };

  const toggleIndicator = (key) => {
    setExpandedIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const submitableCount = allMonths.filter(canSubmit).length;
  const pendingCount = allMonths.filter(m => m.approval_status === "PENDIENTE" && m.achieved_value == null).length;

  const ApprovableMonths = () => {
    const submitable = allMonths.filter(canSubmit);
    if (submitable.length === 0) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-800">
            {submitable.length} KPI(s) listo(s) para enviar a revisión
          </p>
          <p className="text-xs text-blue-600">
            Los líderes recibirán notificación para aprobar o rechazar
          </p>
        </div>
        <button
          onClick={handleSubmitAll}
          disabled={submitMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {submitMutation.isPending ? "Enviando..." : "Enviar todos"}
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-gray-500">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7" />
            Mi Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Bienvenido, {userDetails?.name || "Usuario"}
          </p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
        >
          <option value={currentYear}>{currentYear}</option>
          <option value={currentYear - 1}>{currentYear - 1}</option>
        </select>
      </div>

      <ApprovableMonths />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Target className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Indicadores</p>
              <p className="text-xl font-bold text-gray-900">{totalIndicators}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Aprobados</p>
              <p className="text-xl font-bold text-gray-900">{approvedMonths.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-xs text-gray-500">En revisión</p>
              <p className="text-xl font-bold text-gray-900">{inReviewMonths.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><XCircle className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Rechazados</p>
              <p className="text-xl font-bold text-gray-900">{rejectedMonths.length}</p>
            </div>
          </div>
        </div>
      </div>

      {!uniqueIndicators.length ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin indicadores asignados</h3>
          <p className="text-gray-500">Contacta a tu líder o administrador para asignarte indicadores</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Indicador</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600">Peso</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600">Meta</th>
                {months.map((m, i) => (
                  <th key={i} className="px-1 py-2 text-center text-xs font-semibold text-gray-600">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {uniqueIndicators.map((indicator) => {
                const targetValue = Number(indicator.target_value) || 0;
                return (
                  <tr key={indicator.indicator_name} className="hover:bg-blue-50/50">
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900">{indicator.indicator_name}</div>
                    </td>
                    <td className="px-4 py-2 text-center text-gray-600">{indicator.weight}%</td>
                    <td className="px-4 py-2 text-center text-gray-600">{targetValue}%</td>
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthNum = i + 1;
                      const monthData = indicator.months?.find(m => m.month === monthNum);
                      const status = getMonthStatus(monthData, targetValue);
                      return (
                        <td key={monthNum} className="px-1 py-2 text-center">
                          {monthData ? (
                            <div
                              className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium cursor-pointer ${
                                status === "approved" ? "bg-green-100 text-green-700" :
                                status === "in_review" ? "bg-yellow-100 text-yellow-700" :
                                status === "rejected" ? "bg-red-100 text-red-700" :
                                status === "completed" ? "bg-blue-50 text-blue-700" :
                                "bg-gray-100 text-gray-400"
                              }`}
                              title={
                                monthData.rejection_comment
                                  ? `Rechazado: ${monthData.rejection_comment}`
                                  : status === "in_review"
                                  ? "En revisión por tu líder"
                                  : status === "approved"
                                  ? "Aprobado"
                                  : monthData.achieved_value != null
                                  ? `${monthData.achievement_percentage?.toFixed(1) || ""}%`
                                  : "Pendiente"
                              }
                            >
                              {monthData.achievement_percentage != null
                                ? Math.round(monthData.achievement_percentage)
                                : monthData.approval_status === "EN_REVISION"
                                ? <AlertTriangle className="h-3 w-3" />
                                : monthData.approval_status === "APROBADO"
                                ? <CheckCircle className="h-3 w-3" />
                                : "-"
                              }
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center text-gray-300">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Leyenda */}
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-100"></div> Aprobado</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-100"></div> En revisión</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-100"></div> Rechazado</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-50"></div> Completado</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-100"></div> Pendiente</span>
      </div>
    </div>
  );
}
