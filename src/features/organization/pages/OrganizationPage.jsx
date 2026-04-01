import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchOrganizationUnits, createOrganizationUnit } from "../../../api/organization.api";

export default function OrganizationPage() {
  const queryClient = useQueryClient();

  const { data: units = [], isLoading, error } = useQuery({
    queryKey: ["organization-units"],
    queryFn: fetchOrganizationUnits,
  });

  const createMutation = useMutation({
    mutationFn: createOrganizationUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-units"] });
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      name: "Nueva Unidad",
      parent_id: null,
    });
  };

  if (isLoading) {
    return <div className="text-gray-500">Cargando organización...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        Error al cargar la organización
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Unidades Organizacionales</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nueva Unidad
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <pre className="text-sm overflow-auto">
          {JSON.stringify(units, null, 2)}
        </pre>
      </div>
    </div>
  );
}
