import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, TrendingUp, Target, CheckCircle, Paperclip, ClipboardList } from "lucide-react";
import api from "../../../api/client";

const getMonthName = (month) => {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return months[month - 1] || month;
};

export default function EmployeeDashboard() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  
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
  }, [indicators]);
  
  const uniqueIndicators = Object.values(groupedIndicators);
  const totalIndicators = uniqueIndicators.length;
  const totalWeight = uniqueIndicators.reduce((sum, ind) => sum + Number(ind.weight || 0), 0);
  
  const allMonths = uniqueIndicators.flatMap(ind => ind.months || []);
  const completedMonths = allMonths.filter(m => m.is_closed);
  
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
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={currentYear}>{currentYear}</option>
          <option value={currentYear - 1}>{currentYear - 1}</option>
          <option value={currentYear - 2}>{currentYear - 2}</option>
        </select>
      </div>

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

      {userDetails && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Líder:</span>
              <span className="font-medium text-gray-700">{userDetails.leader_name || "Sin asignar"}</span>
            </div>
            {userDetails.area && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Vicepresidencia:</span>
                <span className="font-medium text-gray-700">{userDetails.area}</span>
              </div>
            )}
            {userDetails.linea && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Línea:</span>
                <span className="font-medium text-gray-700">{userDetails.linea}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {!uniqueIndicators.length ? (
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
                  {Array.from({ length: 12 }, (_, i) => (
                    <th key={i} className="px-1 py-2 text-center text-xs font-semibold text-gray-600">
                      {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][i]}
                    </th>
                  ))}
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
        </>
      )}
    </div>
  );
}