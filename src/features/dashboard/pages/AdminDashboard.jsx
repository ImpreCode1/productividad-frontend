import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Users, Target, CheckCircle, XCircle, Paperclip, ClipboardList, ChevronDown, ChevronRight } from "lucide-react";
import api from "../../../api/client";

const monthsList = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function AdminDashboard() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(null);
  const [expandedUsers, setExpandedUsers] = useState({});

  const { data: globalData, isLoading } = useQuery({
    queryKey: ["dashboard", "global", year, month],
    queryFn: async () => {
      const params = new URLSearchParams({ year: year.toString() });
      if (month) params.append("month", month.toString());
      const { data } = await api.get(`/dashboard/global?${params}`);
      return data;
    },
  });

  const toggleUser = (userId) => {
    setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-gray-500">Cargando dashboard...</div>
      </div>
    );
  }

  const completionRate = globalData?.total_tracked > 0 
    ? Math.round((globalData.total_closed / globalData.total_tracked) * 100) 
    : 0;

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

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

      {globalData?.monthly_summary && globalData.monthly_summary.length > 0 && (
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
        {globalData?.teams?.map((team) => (
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
                      <tr key={user.user_id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-xs text-gray-400">{user.user_id?.slice(0, 8)}</td>
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
                            <span className="text-xs text-indigo-600">{user.action_plans}</span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {user.evidence_count > 0 ? (
                            <span className="text-xs text-cyan-600">{user.evidence_count}</span>
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}