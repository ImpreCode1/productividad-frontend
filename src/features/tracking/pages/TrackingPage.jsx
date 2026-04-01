import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTracking, updateTracking } from "../../../api/tracking.api";
import { useAuth } from "../../../hooks/useAuth";

export default function TrackingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: tracking = [], isLoading, error } = useQuery({
    queryKey: ["tracking", user?.id, currentMonth, currentYear],
    queryKeyHashFn: ([, , , year]) => `user-${user?.id}-${currentMonth}-${year}`,
    queryFn: () =>
      fetchTracking({
        userId: user?.id,
        month: currentMonth,
        year: currentYear,
      }),
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, value }) => updateTracking(id, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracking"] });
      setEditingId(null);
    },
  });

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditValue(item.achieved_value ?? "");
  };

  const handleSave = (id) => {
    updateMutation.mutate({ id, value: parseFloat(editValue) });
  };

  if (isLoading) {
    return <div className="text-gray-500">Cargando seguimiento...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        Error al cargar el seguimiento
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Seguimiento - {new Date().toLocaleString("es", { month: "long" })} {currentYear}
      </h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Indicador
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Meta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Valor Alcanzado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cumplimiento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tracking.map((item) => {
              const compliance = item.target_value
                ? ((item.achieved_value / item.target_value) * 100).toFixed(1)
                : "0";

              return (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {item.indicator_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.target_value}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="border rounded px-2 py-1 w-24"
                      />
                    ) : (
                      <span className="text-gray-800">
                        {item.achieved_value ?? "-"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        parseFloat(compliance) >= 100
                          ? "bg-green-100 text-green-800"
                          : parseFloat(compliance) >= 80
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {compliance}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {editingId === item.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(item.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {tracking.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No hay registros para este mes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
