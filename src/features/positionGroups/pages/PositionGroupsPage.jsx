import { Building2 } from "lucide-react";
import { usePositionGroupsTree } from "../hooks/usePositionGroupsTree";
import PositionGroupNode from "../components/PositionGroupNode";

export default function PositionGroupsPage() {
  const { data: tree, isLoading, error } = usePositionGroupsTree();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-gray-500">Cargando jerarquía...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error al cargar la jerarquía organizacional
      </div>
    );
  }

  if (!tree || tree.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Sin jerarquía disponible
        </h3>
        <p className="text-gray-500">
          No hay vicepresidencias o direcciones configuradas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-7 w-7" />
          Jerarquía Organizacional
        </h1>
        <p className="text-gray-500 mt-1">
          Estructura de vicepresidencias y direcciones
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-1">
        {tree.map((node) => (
          <PositionGroupNode key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
