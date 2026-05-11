import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, TrendingUp, Target, Users, FileText, CheckCircle, XCircle, ChevronDown, ChevronRight, Paperclip, ClipboardList } from "lucide-react";
import api from "../../../api/client";
import { useAuth } from "../../../hooks/useAuth";

const getMonthName = (month) => {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return months[month - 1] || month;
};

const monthsList = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function EmployeeDashboard({ dashboard, user }) {
  const indicators = dashboard?.indicators || [];
  
  const originalAllMonths = indicators.flatMap(ind => ind.months || []);
  const originalTotalEvidence = originalAllMonths.reduce((sum, m) => sum + (m.evidence_count || 0), 0);
  const originalTotalActionPlans = originalAllMonths.reduce((sum, m) => sum + (m.action_plans?.length || 0), 0);
  
  const groupedIndicators = indicators.reduce((acc, ind) => {
    const key = ind.indicator_name;
    if (!acc[key]) {
      acc[key] = {
        indicator_name: ind.indicator_name,
        weight: ind.weight,
        target_value: ind.target_value,
        formula: ind.formula,
        months: []
      };
    } else {
      if (Number(ind.weight) > Number(acc[key].weight)) {
        acc[key].weight = ind.weight;
        acc[key].target_value = ind.target_value;
      }
    }
    ind.months?.forEach(m => {
      const existingMonthIndex = acc[key].months.findIndex(em => em.month === m.month);
      if (existingMonthIndex === -1) {
        acc[key].months.push(m);
      } else {
        const existingMonth = acc[key].months[existingMonthIndex];
        if (!existingMonth.tracking_id && m.tracking_id) {
          acc[key].months[existingMonthIndex] = m;
        } else if (existingMonth.tracking_id && m.tracking_id) {
          if ((existingMonth.evidence_count || 0) === 0 && (m.evidence_count || 0) > 0) {
            acc[key].months[existingMonthIndex] = m;
          } else if ((existingMonth.action_plans?.length || 0) === 0 && (m.action_plans?.length || 0) > 0) {
            acc[key].months[existingMonthIndex] = m;
          }
        }
      }
    });
    acc[key].months.sort((a, b) => a.month - b.month);
    return acc;
  }, {});
  
  const uniqueIndicators = Object.values(groupedIndicators);
  
  const totalIndicators = uniqueIndicators.length;
  
  const totalWeight = uniqueIndicators.reduce((sum, ind) => sum + Number(ind.weight || 0), 0);
  
  const allMonths = uniqueIndicators.flatMap(ind => ind.months || []);
  const evaluatedMonths = allMonths.filter(m => m.status === "COMPLETED" || m.status === "CLOSED" || m.achieved_value !== null);
  const completedMonths = allMonths.filter(m => m.is_closed);
  
  const totalEvidence = originalTotalEvidence;
  const totalActionPlans = originalTotalActionPlans;
  
  const totalScore = allMonths.length > 0 
    ? allMonths.filter(m => m.achievement_percentage !== null).reduce((sum, m) => {
        const weight = uniqueIndicators.find(ind => ind.months?.some(am => am.month === m.month))?.weight || 0;
        return sum + (Number(m.achievement_percentage || 0) * Number(weight) / 100);
      }, 0) / (totalWeight / 100) || 0
    : 0;

  const calculateIndicatorScore = (indicator) => {
    const months = indicator.months || [];
    const closedMonths = months.filter(m => m.is_closed);
    if (closedMonths.length === 0) return null;
    const totalScore = closedMonths.reduce((sum, m) => sum + (Number(m.achievement_percentage) || 0), 0);
    return Math.round(totalScore / closedMonths.length);
  };

  const getMonthStatus = (month, targetValue) => {
    if (!month || !month.is_closed) return "pending";
    if (month.achievement_percentage === null || month.achievement_percentage === undefined) return "pending";
    return month.achievement_percentage >= targetValue ? "met" : "not_met";
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Indicadores</p>
              <p className="text-xl font-bold text-gray-900">{totalIndicators}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Score Total</p>
              <p className="text-xl font-bold text-gray-900">
                {totalScore > 0 ? `${Math.round(totalScore)}%` : "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Cerrados</p>
              <p className="text-xl font-bold text-gray-900">{completedMonths.length}/{allMonths.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {user && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">Líder:</span>
              <span className="font-medium text-gray-700">{user.leader_name || "Sin asignar"}</span>
            </div>
            {user.area && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Vicepresidencia:</span>
                <span className="font-medium text-gray-700">{user.area}</span>
              </div>
            )}
            {user.linea && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Línea:</span>
                <span className="font-medium text-gray-700">{user.linea}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {!indicators.length ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sin indicadores asignados
          </h3>
          <p className="text-gray-500">
            Contacta a tu líder o administrador para asignarte indicadores de productividad
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Indicador</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600">Peso</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600">Meta</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600">Score</th>
                  <th className="px-1 py-2 text-center text-xs font-semibold text-gray-600">Ene</th>
                  <th className="px-1 py-2 text-center text-xs font-semibold text-gray-600">Feb</th>
                  <th className="px-1 py-2 text-center text-xs font-semibold text-gray-600">Mar</th>
                  <th className="px-1 py-2 text-center text-xs font-semibold text-gray-600">Abr</th>
                  <th className="px-1 py-2 text-center text-xs font-semibold text-gray-600">May</th>
                  <th className="px-1 py-2 text-center text-xs font-semibold text-gray-600">Jun</th>
                  <th className="px-1 py-2 text-center text-xs font-semibold text-gray-600">Jul</th>
                  <th className="px-1 py-2 text-center text-xs font-semibold text-gray-600">Ago</th>
                  <th className="px-1 py-2 text-center text-xs font-semibold text-gray-600">Sep</th>
                  <th className="px-1 py-2 text-center text-xs font-semibold text-gray-600">Oct</th>
                  <th className="px-1 py-2 text-center text-xs font-semibold text-gray-600">Nov</th>
                  <th className="px-1 py-2 text-center text-xs font-semibold text-gray-600">Dic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {uniqueIndicators.map((indicator) => {
                  const score = calculateIndicatorScore(indicator);
                  const targetValue = Number(indicator.target_value) || 0;
                  return (
                    <tr key={indicator.indicator_name} className="hover:bg-blue-50/50">
                      <td className="px-4 py-2">
                        <div className="font-medium text-gray-900">{indicator.indicator_name}</div>
                        <div className="flex gap-2 mt-1">
                          {indicator.months?.some(m => m.evidence_count > 0) && (
                            <span className="flex items-center gap-1 text-xs text-cyan-600">
                              <Paperclip className="h-3 w-3" />
                              {indicator.months?.reduce((sum, m) => sum + (m.evidence_count || 0), 0)}
                            </span>
                          )}
                          {indicator.months?.some(m => m.action_plans?.length > 0) && (
                            <span className="flex items-center gap-1 text-xs text-indigo-600">
                              <ClipboardList className="h-3 w-3" />
                              {indicator.months?.reduce((sum, m) => sum + (m.action_plans?.length || 0), 0)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">{indicator.weight}%</td>
                      <td className="px-4 py-2 text-center text-gray-600">{targetValue}%</td>
                      <td className="px-4 py-2 text-center">
                        {score !== null ? (
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                            score >= 80 ? "bg-green-100 text-green-700" :
                            score >= 50 ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {score}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      {Array.from({ length: 12 }, (_, i) => {
                        const monthNum = i + 1;
                        const monthData = indicator.months?.find(m => m.month === monthNum);
                        const status = getMonthStatus(monthData, targetValue);
                        return (
                          <td key={monthNum} className="px-1 py-2 text-center">
                            {monthData ? (
                              <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                                status === "met" ? "bg-green-100 text-green-700" :
                                status === "not_met" ? "bg-red-100 text-red-700" :
                                monthData.achieved_value !== null ? "bg-blue-50 text-blue-700" :
                                "bg-gray-100 text-gray-400"
                              }`}>
                                {monthData.achieved_value !== null ? Math.round(monthData.achievement_percentage || 0) : "-"}
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

          <div className="flex gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-100"></div>
              <span>Cumplido</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-100"></div>
              <span>No cumplido</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-50"></div>
              <span>En evaluación</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-100"></div>
              <span>Pendiente</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow mt-6 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Detalle por Indicador</h3>
            <div className="space-y-4">
              {uniqueIndicators.map((indicator) => (
                <div key={indicator.indicator_name} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{indicator.indicator_name}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Peso: {indicator.weight}% • Meta: {indicator.target_value}%
                        {indicator.formula && ` • Formula: ${indicator.formula}`}
                      </p>
                    </div>
                    {(() => {
                      const score = calculateIndicatorScore(indicator);
                      return score !== null ? (
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                          score >= 80 ? "bg-green-100 text-green-700" :
                          score >= 50 ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          Score: {score}%
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {indicator.months?.map((month) => (
                      <div
                        key={month.month}
                        className={`text-center p-2 rounded-lg border ${
                          month.is_closed
                            ? month.achievement_percentage >= indicator.target_value
                              ? "bg-green-50 border-green-200"
                              : "bg-red-50 border-red-200"
                            : month.achieved_value !== null
                            ? "bg-blue-50 border-blue-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          {getMonthName(month.month)}
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {month.achieved_value !== null ? month.achieved_value : "-"}
                        </div>
                        {month.achievement_percentage !== null && (
                          <div className={`text-xs mt-1 ${
                            month.achievement_percentage >= indicator.target_value
                              ? "text-green-600"
                              : "text-red-600"
                          }`}>
                            {Math.round(month.achievement_percentage)}%
                          </div>
                        )}
                        <div className="flex justify-center gap-1 mt-1">
                          {month.evidence_count > 0 && (
                            <Paperclip className="h-3 w-3 text-cyan-500" />
                          )}
                          {month.action_plans?.length > 0 && (
                            <ClipboardList className="h-3 w-3 text-indigo-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function LeaderDashboard({ dashboard }) {
  const totalMembers = dashboard?.team?.length || 0;
  const totalIndicators = dashboard?.team?.reduce((sum, m) => sum + (m.indicators?.length || 0), 0) || 0;
  const closedCount = dashboard?.team?.reduce((sum, m) => {
    return sum + m.indicators?.reduce((s, ind) => s + (ind.months?.filter((mo) => mo.is_closed).length || 0), 0) || 0;
  }, 0) || 0;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Miembros</p>
              <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Indicadores</p>
              <p className="text-2xl font-bold text-gray-900">{totalIndicators}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cerrados</p>
              <p className="text-2xl font-bold text-gray-900">{closedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Promedio Equipo</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalMembers > 0 ? "N/A" : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {totalMembers === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sin miembros en tu equipo
          </h3>
          <p className="text-gray-500">
            No tienes colaboradores asignados a tu equipo
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Colaborador</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Cargo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Indicadores</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Avance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dashboard?.team?.map((member) => {
                  const totalMonths = member.indicators?.reduce((s, ind) => s + (ind.months?.length || 0), 0) || 0;
                  const closedMonths = member.indicators?.reduce((s, ind) => s + (ind.months?.filter((mo) => mo.is_closed).length || 0), 0) || 0;
                  const progress = totalMonths > 0 ? Math.round((closedMonths / totalMonths) * 100) : 0;
                  
                  return (
                    <tr key={member.user_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {member.position_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {member.indicators?.length || 0}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-blue-600 rounded-full" 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {progress === 100 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completado
                          </span>
                        ) : progress > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            En progreso
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Sin avance
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function AdminDashboard({ globalData, expandedUsers, toggleUser }) {
  const completionRate = globalData.total_tracked > 0 
    ? Math.round((globalData.total_closed / globalData.total_tracked) * 100) 
    : 0;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Usuarios</p>
              <p className="text-xl font-bold text-gray-900">{globalData.total_users}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Indicadores</p>
              <p className="text-xl font-bold text-gray-900">{globalData.total_indicators}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Seguimientos</p>
              <p className="text-xl font-bold text-gray-900">{globalData.total_tracked}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <XCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Cerrados</p>
              <p className="text-xl font-bold text-gray-900">{globalData.total_closed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Planes Acción</p>
              <p className="text-xl font-bold text-gray-900">{globalData.total_action_plans}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Paperclip className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Evidencias</p>
              <p className="text-xl font-bold text-gray-900">{globalData.total_evidence}</p>
            </div>
          </div>
        </div>
      </div>

      {globalData.monthly_summary && globalData.monthly_summary.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen por Mes</h3>
          <div className="grid grid-cols-12 gap-2">
            {globalData.monthly_summary.map((m) => (
              <div key={m.month} className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="text-xs font-medium text-gray-600">{monthsList[m.month - 1]}</div>
                <div className="text-sm font-bold text-gray-900">{m.closed}/{m.total}</div>
                <div className="text-xs text-green-600">{m.plans} 📋</div>
                <div className="text-xs text-blue-600">{m.evidence} 📎</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {globalData.teams?.map((team) => (
          <div key={team.leader_name} className="bg-white rounded-lg shadow overflow-hidden">
            <div 
              className="px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
              onClick={() => toggleUser(team.leader_name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {expandedUsers[team.leader_name] ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">{team.leader_name}</span>
                  <span className="text-sm text-gray-500">({team.members.length} miembros)</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">Indic: <span className="font-medium text-gray-700">{team.total_indicators}</span></span>
                  <span className="text-gray-500">Cerr: <span className="font-medium text-gray-700">{team.total_closed}</span></span>
                  <span className="text-gray-500">Planes: <span className="font-medium text-gray-700">{team.total_plans}</span></span>
                  <span className="text-gray-500">Evid: <span className="font-medium text-gray-700">{team.total_evidence}</span></span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    team.avg_score >= 80 ? "bg-green-100 text-green-800" :
                    team.avg_score >= 50 ? "bg-yellow-100 text-yellow-800" :
                    team.avg_score > 0 ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    Score: {team.avg_score}%
                  </span>
                </div>
              </div>
            </div>

            {expandedUsers[team.leader_name] && (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-8"></th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Colaborador</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Cargo</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Indic.</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Cerr.</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Planes</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Evid.</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {team.members.map((user) => (
                      <>
                        <tr 
                          key={user.user_id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleUser(`user-${user.user_id}`);
                          }}
                        >
                          <td className="px-3 py-3">
                            {expandedUsers[`user-${user.user_id}`] ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-600">
                            {user.position_name || "-"}
                          </td>
                          <td className="px-3 py-3 text-center text-xs text-gray-900">
                            {user.indicators_count}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              user.closed_months > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                            }`}>
                              {user.closed_months}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {user.action_plans > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs text-indigo-600">
                                <ClipboardList size={14} /> {user.action_plans}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {user.evidence_count > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs text-cyan-600">
                                <Paperclip size={14} /> {user.evidence_count}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              user.score >= 80 ? "bg-green-100 text-green-800" :
                              user.score >= 50 ? "bg-yellow-100 text-yellow-800" :
                              user.score > 0 ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-600"
                            }`}>
                              {user.score || 0}%
                            </span>
                          </td>
                        </tr>
                        {expandedUsers[`user-${user.user_id}`] && user.indicators && (
                          <tr key={`${user.user_id}-detail`}>
                            <td colSpan={8} className="bg-gray-50 px-4 py-3">
                              <div className="space-y-3">
                                {user.indicators.map((ind, idx) => (
                                  <div key={idx} className="bg-white rounded-lg border border-gray-200 p-3">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="font-medium text-sm text-gray-900">{ind.indicator_name}</span>
                                      <span className="text-xs text-gray-500">Peso: {ind.weight}% • Meta: {ind.target_value}%</span>
                                    </div>
                                    <div className="grid grid-cols-12 gap-1">
                                      {Array.from({ length: 12 }, (_, i) => {
                                        const monthData = ind.months?.find(m => m.month === i + 1);
                                        const monthName = monthsList[i];
                                        const meta = ind.target_value;
                                        const achieved = monthData?.achievement_percentage;
                                        const isMet = achieved !== null && achieved !== undefined && achieved >= meta;
                                        
                                        return (
                                          <div 
                                            key={i}
                                            className={`text-center p-1.5 rounded text-xs ${
                                              monthData?.is_closed 
                                                ? isMet
                                                  ? "bg-green-100 text-green-700" 
                                                  : "bg-red-100 text-red-700"
                                                : monthData?.achieved_value !== undefined && monthData.achieved_value !== null
                                                  ? "bg-blue-50 text-blue-700"
                                                  : "bg-gray-100 text-gray-400"
                                            }`}
                                            title={`${monthName}: ${achieved !== null && achieved !== undefined ? achieved + '%' : 'Sin datos'} (Meta: ${meta}%)`}
                                          >
                                            <div className="text-[10px] text-gray-500">{monthName.substring(0, 3)}</div>
                                            <div className="font-medium">{achieved !== null && achieved !== undefined ? achieved + '%' : '-'}</div>
                                            <div className="flex justify-center gap-0.5 mt-0.5">
                                              {monthData?.has_action_plan && <ClipboardList size={10} className="text-indigo-500" />}
                                              {monthData?.has_evidence && <Paperclip size={10} className="text-cyan-500" />}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                      <span>■ Verde: Cumplido</span>
                                      <span>■ Rojo: No cumplido</span>
                                      <span>■ Azul: Evaluado</span>
                                      <span>■ Gris: Pendiente</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(null);
  const [expandedUsers, setExpandedUsers] = useState({});

  const isAdmin = user?.roles?.includes("ADMIN");
  const isLeader = user?.roles?.includes("LEADER");

  const { data: dashboardData, isLoading: loadingMy } = useQuery({
    queryKey: ["dashboard", "me", year],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/me?year=${year}`);
      return data;
    },
    enabled: !isAdmin,
  });

  const { data: teamData, isLoading: loadingTeam } = useQuery({
    queryKey: ["dashboard", "team", year],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/team?year=${year}`);
      return data;
    },
    enabled: isLeader && !isAdmin,
  });

  const { data: globalData, isLoading: loadingGlobal } = useQuery({
    queryKey: ["dashboard", "global", year, month],
    queryFn: async () => {
      const params = new URLSearchParams({ year: year.toString() });
      if (month) params.append("month", month.toString());
      const { data } = await api.get(`/dashboard/global?${params}`);
      return data;
    },
    enabled: isAdmin,
  });

  const { data: userDetails } = useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const { data } = await api.get("/users/me");
      return data;
    },
    enabled: !isAdmin && !isLeader,
  });

  const toggleUser = (userId) => {
    setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const isLoading = loadingMy || loadingTeam || loadingGlobal || (userDetails === undefined && !isAdmin && !isLeader);

  const getTitle = () => {
    if (isAdmin) return "Dashboard Global";
    if (isLeader) return "Dashboard de mi Equipo";
    return "Mi Dashboard";
  };

  const getSubtitle = () => {
    if (isAdmin) return "Vista general de toda la organización";
    if (isLeader) return "Resumen del desempeño de tu equipo";
    return `Bienvenido, ${user?.name}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7" />
            {getTitle()}
          </h1>
          <p className="text-gray-500 mt-1">
            {getSubtitle()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <select
              value={month || ""}
              onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los meses</option>
              {monthsList.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          )}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
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
          <div className="text-gray-500">Cargando dashboard...</div>
        </div>
      ) : isAdmin ? (
        <AdminDashboard globalData={globalData} expandedUsers={expandedUsers} toggleUser={toggleUser} />
      ) : isLeader ? (
        <LeaderDashboard dashboard={teamData} />
      ) : (
        <EmployeeDashboard dashboard={dashboardData} user={userDetails} />
      )}
    </div>
  );
}