import { useQuery } from "@tanstack/react-query";
import { fetchUserDashboard } from "../../../api/dashboard.api";
import { useAuth } from "../../../hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const currentMonth = new Date().getMonth() + 1;

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", user?.id, currentMonth],
    queryFn: () => fetchUserDashboard(user.id, currentMonth),
    enabled: !!user?.id,
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
        Error al cargar el dashboard
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Resumen del Mes</h2>
        <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
