import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Users, Target, CheckCircle, XCircle, Paperclip, ClipboardList, ChevronDown, ChevronRight, FileText, Briefcase, Check, AlertCircle, Building2, Download } from "lucide-react";
import api from "../../../api/client";
import { getAreas } from "../../../api/users.api";

const monthsList = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const getMonthStatus = (monthData, targetValue) => {
  if (!monthData) return "not_assigned";
  if (monthData.achievement_percentage !== null && monthData.achievement_percentage !== undefined) {
    if (!monthData.is_closed) return "not_evaluated";
    return monthData.achievement_percentage >= targetValue ? "met" : "not_met";
  }
  if (!monthData.is_closed) return "not_evaluated";
  return "not_assigned";
};

export default function AdminDashboard() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [selectedArea, setSelectedArea] = useState("");
  const [expandedTeams, setExpandedTeams] = useState({});
  const [expandedUsers, setExpandedUsers] = useState({});
  const [expandedIndicators, setExpandedIndicators] = useState({});
  const [downloading, setDownloading] = useState(false);

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const token = sessionStorage.getItem("hydra_token");
      const params = new URLSearchParams({ year: year.toString() });
      if (selectedArea) params.append("area", selectedArea);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/dashboard/global/report?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Error al descargar reporte");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte_kpi_${year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Error al descargar el reporte");
    } finally {
      setDownloading(false);
    }
  };

  const { data: areas } = useQuery({
    queryKey: ["areas"],
    queryFn: async () => {
      const { data } = await getAreas();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: globalData, isLoading } = useQuery({
    queryKey: ["dashboard", "global", year, selectedArea],
    queryFn: async () => {
      const params = new URLSearchParams({ year: year.toString() });
      if (selectedArea) params.append("area", selectedArea);
      const { data } = await api.get(`/dashboard/global?${params}`);
      return data;
    },
  });

  const toggleTeam = (teamName) => {
    setExpandedTeams(prev => ({ ...prev, [teamName]: !prev[teamName] }));
  };

  const toggleUser = (userId) => {
    setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const toggleIndicator = (indicatorKey) => {
    setExpandedIndicators(prev => ({ ...prev, [indicatorKey]: !prev[indicatorKey] }));
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
            Dashboard General
          </h1>
          <p className="text-gray-500 mt-1">
            Vista general de toda la organización
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white min-w-[200px]"
            >
              <option value="">Todas las Vicepresidencias</option>
              {areas?.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
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

          <button
            onClick={handleDownloadReport}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Descargando..." : "Descargar Reporte Excel"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Usuarios</p>
              <p className="text-xl font-bold text-gray-900">{globalData?.total_users || 0}</p>
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
              <p className="text-xl font-bold text-gray-900">{globalData?.total_indicators || 0}</p>
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
              <p className="text-xl font-bold text-gray-900">{globalData?.total_tracked || 0}</p>
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
              <p className="text-xl font-bold text-gray-900">{globalData?.total_closed || 0}</p>
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
              <p className="text-xl font-bold text-gray-900">{globalData?.total_action_plans || 0}</p>
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
              <p className="text-xl font-bold text-gray-900">{globalData?.total_evidence || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* {globalData?.monthly_summary && globalData.monthly_summary.length > 0 && (
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
      )} */}

      <div className="space-y-4">
        {globalData?.teams?.map((team) => (
          <div key={team.leader_name} className="bg-white rounded-lg shadow overflow-hidden">
            <div 
              className="px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
              onClick={() => toggleTeam(team.leader_name)}
            >
              <div className="flex items-center gap-2">
                {expandedTeams[team.leader_name] ? (
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
                {team.total_indicators > 0 && team.total_closed >= team.total_indicators ? (
                  <div className="flex items-center gap-1 text-green-600" title="Todos los indicadores calificados">
                    <Check className="h-4 w-4" />
                    <span className="text-xs font-medium">Calificado</span>
                  </div>
                ) : team.total_indicators > 0 ? (
                  <div className="flex items-center gap-1 text-amber-600" title={`Faltan ${team.total_indicators - team.total_closed} indicadores por calificar`}>
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Pendiente</span>
                  </div>
                ) : null}
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

            {expandedTeams[team.leader_name] && (
              <div className="divide-y divide-gray-100">
                {team.members.map((user) => {
                  const userExpanded = expandedUsers[user.user_id];
                  return (
                    <div key={user.user_id}>
                      <div 
                        className="px-4 py-2 bg-white hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleUser(user.user_id)}
                      >
                        <div className="flex items-center gap-2">
                          {userExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                          <Briefcase className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.position_name || "-"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-500">Indic: <span className="font-medium">{user.indicators_count}</span></span>
                          <span className="text-gray-500">Cerr: <span className="font-medium">{user.closed_months}</span></span>
                          <span className={`px-1.5 py-0.5 rounded ${
                            user.score >= 80 ? "bg-green-100 text-green-700" :
                            user.score >= 50 ? "bg-yellow-100 text-yellow-700" :
                            user.score > 0 ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {user.score || 0}%
                          </span>
                        </div>
                      </div>

                      {userExpanded && user.indicators && user.indicators.length > 0 && (
                        <div className="px-6 py-3 bg-gray-50">
                          <div className="space-y-3">
                            {user.indicators.map((indicator, idx) => {
                              const indicatorKey = `${user.user_id}-${idx}`;
                              const indicatorExpanded = expandedIndicators[indicatorKey];
                              const targetValue = indicator.target_value || 0;
                              
                              return (
                                <div key={indicatorKey} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                                  <div 
                                    className="px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                                    onClick={() => toggleIndicator(indicatorKey)}
                                  >
                                    <div className="flex items-center gap-2">
                                      {indicatorExpanded ? (
                                        <ChevronDown className="h-3 w-3 text-gray-400" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 text-gray-400" />
                                      )}
                                      <Target className="h-3 w-3 text-green-600" />
                                      <span className="text-xs font-medium text-gray-900">{indicator.indicator_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <span>Peso: {indicator.weight}%</span>
                                      <span>Meta: {targetValue}%</span>
                                    </div>
                                  </div>

                                  {indicatorExpanded && (
                                    <div className="p-3">
                                      <div className="grid grid-cols-12 gap-1 mb-1">
                                        {monthsList.map((m) => (
                                          <div key={m} className="text-[8px] text-center text-gray-500 font-medium">{m}</div>
                                        ))}
                                      </div>
                                      <div className="grid grid-cols-12 gap-1">
                                        {Array.from({ length: 12 }, (_, i) => {
                                          const monthNum = i + 1;
                                          const monthData = indicator.months?.find(m => m.month === monthNum);
                                          const status = getMonthStatus(monthData, targetValue);
                                          
                                          return (
                                            <div 
                                              key={monthNum}
                                              className={`text-center p-1.5 rounded text-[10px] border ${
                                                status === "met" ? "bg-green-100 text-green-700 border-green-200" :
                                                status === "not_met" ? "bg-red-100 text-red-700 border-red-200" :
                                                status === "not_evaluated" ? "bg-gray-300 text-gray-700 border-gray-400" :
                                                "bg-gray-100 text-gray-500 border-gray-200"
                                              }`}
                                            >
                                              <div className="font-medium">
                                                {monthData?.achievement_percentage !== null && monthData?.achievement_percentage !== undefined 
                                                  ? Math.round(monthData.achievement_percentage) 
                                                  : "-"}
                                              </div>
                                              <div className="flex justify-center gap-0.5 mt-0.5">
                                                {monthData?.has_evidence && <span className="text-[8px]"></span>}
                                                {monthData?.has_action_plan && <span className="text-[8px]"></span>}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      <div className="flex gap-3 mt-2 text-[10px] text-gray-500">
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-100 border border-green-200 rounded"></span> Cumplido</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-100 border border-red-200 rounded"></span> No cumplimiento</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-300 border border-gray-400 rounded"></span> Sin evaluar</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-100 border border-gray-200 rounded"></span> Sin asignar</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
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
    </div>
  );
}