import { useState } from "react";
import { Users } from "lucide-react";
import { useTeamDashboard } from "../hooks";
import { useAuth } from "../../../hooks/useAuth";

export default function TeamDashboard() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data: dashboard, isLoading } = useTeamDashboard(year);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-7 w-7" />
            Dashboard de Equipo
          </h1>
          <p className="text-gray-500 mt-1">
            Vista general del desempeño de tu equipo
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

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="text-gray-500">Cargando dashboard...</div>
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
        <div className="space-y-6">
          {dashboard?.team?.map((member) => (
            <div
              key={member.user_id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  {member.name}
                </h3>
              </div>

              <div className="p-6">
                {member.indicators?.length > 0 ? (
                  <div className="grid gap-4">
                    {member.indicators.map((indicator) => (
                      <div
                        key={indicator.indicator_name}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-900">
                            {indicator.indicator_name}
                          </h4>
                          <div className="text-right">
                            <span className="text-sm text-gray-500">
                              Peso: {indicator.weight}%
                            </span>
                            <span className="ml-2 text-sm text-gray-500">
                              Meta: {indicator.target_value}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          {indicator.months?.slice(0, 4).map((month) => (
                            <div
                              key={month.month}
                              className={`text-center p-2 rounded ${
                                month.status === "COMPLETED"
                                  ? "bg-green-100 text-green-800"
                                  : month.status === "CLOSED"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              <div className="text-xs font-medium">
                                Mes {month.month}
                              </div>
                              <div className="text-sm font-bold">
                                {month.achieved_value ?? "-"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Sin indicadores asignados
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
