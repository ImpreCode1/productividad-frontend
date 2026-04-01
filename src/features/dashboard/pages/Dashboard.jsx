import { useQuery } from "@tanstack/react-query";
import { fetchUserDashboard } from "../../../api/dashboard.api";

export default function Dashboard() {
  const currentMonth = new Date().getMonth() + 1;

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", currentMonth],
    queryFn: () => fetchUserDashboard(currentMonth),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        Error al cargar el dashboard: {error.message}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm text-gray-500 mb-1">Cumplimiento General</h3>
          <p className="text-3xl font-bold text-blue-600">
            {data?.general_compliance ?? 0}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm text-gray-500 mb-1">Indicadores Registrados</h3>
          <p className="text-3xl font-bold text-green-600">
            {data?.total_indicators ?? 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm text-gray-500 mb-1">Pendientes</h3>
          <p className="text-3xl font-bold text-amber-600">
            {data?.pending ?? 0}
          </p>
        </div>
      </div>
      {data?.by_indicator && data.by_indicator.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Tus Indicadores</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3">Indicador</th>
                  <th className="text-right py-2 px-3">Cumplimiento</th>
                  <th className="text-center py-2 px-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.by_indicator.map((ind, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2 px-3">{ind.name}</td>
                    <td className="text-right py-2 px-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        ind.compliance >= 80 ? 'bg-green-100 text-green-700' :
                        ind.compliance >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {ind.compliance}%
                      </span>
                    </td>
                    <td className="text-center py-2 px-3">
                      <span className={`w-3 h-3 inline-block rounded-full ${
                        ind.status === 'green' ? 'bg-green-500' :
                        ind.status === 'yellow' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}