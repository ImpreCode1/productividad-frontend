import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchIndicators, createIndicator, deleteIndicator } from "../../../api/indicators.api";

export default function IndicatorsPage() {
  const queryClient = useQueryClient();

  const { data: indicators = [], isLoading, error } = useQuery({
    queryKey: ["indicators"],
    queryFn: fetchIndicators,
  });

  const createMutation = useMutation({
    mutationFn: createIndicator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicators"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIndicator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicators"] });
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      name: "Nuevo Indicador",
      frequency: "monthly",
    });
  };

  if (isLoading) {
    return <div className="text-gray-500">Cargando indicadores...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        Error al cargar indicadores
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Indicadores</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nuevo Indicador
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Frecuencia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {indicators.map((indicator) => (
              <tr key={indicator.id}>
                <td className="px-6 py-4 text-sm text-gray-800">
                  {indicator.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {indicator.frequency}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      indicator.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {indicator.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => deleteMutation.mutate(indicator.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {indicators.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  No hay indicadores registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
