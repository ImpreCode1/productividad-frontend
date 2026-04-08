import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LineChart, Save, AlertCircle } from "lucide-react";
import api from "../../../api/client";
import { useAuth } from "../../../hooks/useAuth";

export default function TrackingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [year, setYear] = useState(currentYear);

  const { data: tracking, isLoading } = useQuery({
    queryKey: ["tracking", "me", year],
    queryFn: async () => {
      const { data } = await api.get(`/tracking/me?year=${year}`);
      return data.tracking;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, achieved_value }) => {
      const { data } = await api.patch(`/tracking/${id}`, { achieved_value });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tracking", "me", year]);
      queryClient.invalidateQueries(["dashboard", "me", year]);
    },
  });

  const handleSave = (trackingId, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;
    updateMutation.mutate({ id: trackingId, achieved_value: numValue });
  };

  const groupedByIndicator = tracking?.reduce((acc, item) => {
    if (!acc[item.assignment_id]) {
      acc[item.assignment_id] = {
        indicator_name: item.indicator_name || "Indicador",
        months: [],
      };
    }
    acc[item.assignment_id].months.push(item);
    return acc;
  }, {}) || {};

  const indicators = Object.values(groupedByIndicator);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LineChart className="h-7 w-7" />
            Mi Seguimiento
          </h1>
          <p className="text-gray-500 mt-1">
            Registra el avance de tus indicadores mensuales
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
        <div className="flex justify-center py-12">
          <div className="text-gray-500">Cargando seguimiento...</div>
        </div>
      ) : !indicators.length ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <LineChart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sin seguimiento disponible
          </h3>
          <p className="text-gray-500">
            No tienes indicadores asignados para el año {year}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {indicators.map((indicator) => (
            <div
              key={indicator.indicator_name}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900">
                  {indicator.indicator_name}
                </h3>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {indicator.months?.map((month) => (
                    <div
                      key={month.id}
                      className={`border rounded-lg p-4 ${
                        month.is_closed
                          ? "bg-gray-100 border-gray-300"
                          : month.status === "COMPLETED"
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-500 mb-2">
                        Mes {month.month}
                      </div>

                      {month.is_closed ? (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-700">
                            {month.achieved_value}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Cerrado
                          </div>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="number"
                            placeholder="Valor"
                            defaultValue={month.achieved_value || ""}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSave(month.id, e.target.value);
                              }
                            }}
                          />
                          {month.achieved_value !== null && (
                            <button
                              onClick={(e) => {
                                const input = e.target.closest("div").querySelector("input");
                                handleSave(month.id, input.value);
                              }}
                              className="w-full flex items-center justify-center gap-1 bg-blue-600 text-white text-sm py-1 rounded hover:bg-blue-700"
                            >
                              <Save className="h-3 w-3" />
                              Guardar
                            </button>
                          )}
                          {month.achievement_percentage && (
                            <div className="text-center text-xs text-gray-500 mt-2">
                              {month.achievement_percentage}%
                            </div>
                          )}
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

      {updateMutation.isError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Error al guardar. Intenta de nuevo.
        </div>
      )}
    </div>
  );
}
