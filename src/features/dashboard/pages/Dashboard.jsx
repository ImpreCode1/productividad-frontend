import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, TrendingUp, Target } from "lucide-react";
import api from "../../../api/client";
import { useAuth } from "../../../hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard", "me", year],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/me?year=${year}`);
      return data;
    },
  });

  const totalWeight = dashboard?.indicators?.reduce(
    (sum, ind) => sum + Number(ind.weight),
    0
  ) || 0;

  const completedMonths = dashboard?.indicators?.reduce((count, ind) => {
    return count + (ind.months?.filter((m) => m.status === "COMPLETED").length || 0);
  }, 0) || 0;

  const totalMonths = dashboard?.indicators?.reduce(
    (count, ind) => count + (ind.months?.length || 0),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7" />
            Mi Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Bienvenido, {user?.name}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Indicadores</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboard?.indicators?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avance Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalWeight}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <LayoutDashboard className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Meses Completados</p>
              <p className="text-2xl font-bold text-gray-900">
                {completedMonths}/{totalMonths}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="text-gray-500">Cargando dashboard...</div>
        </div>
      ) : !dashboard?.indicators?.length ? (
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
        <div className="space-y-4">
          {dashboard.indicators.map((indicator) => (
            <div
              key={indicator.indicator_name}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">
                    {indicator.indicator_name}
                  </h3>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Peso: {indicator.weight}%</span>
                    <span>Meta: {indicator.target_value}</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-6 gap-2">
                  {indicator.months?.map((month) => (
                    <div
                      key={month.month}
                      className={`text-center p-3 rounded-lg border ${
                        month.status === "COMPLETED"
                          ? "bg-green-50 border-green-200"
                          : month.status === "CLOSED"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        Mes {month.month}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {month.achieved_value ?? "-"}
                      </div>
                      {month.achievement_percentage && (
                        <div className="text-xs text-gray-500 mt-1">
                          {month.achievement_percentage}%
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
    </div>
  );
}
