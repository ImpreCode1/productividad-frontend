import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchOrganizationUnits,
  createOrganizationUnit,
  updateOrganizationUnit,
  deleteOrganizationUnit,
} from "../../../api/organization.api";
import { useAuth } from "../../../hooks/useAuth";

// -----------------------------
// BUILD TREE
// -----------------------------
const buildTree = (units) => {
  const map = {};
  const roots = [];

  units.forEach((unit) => {
    map[unit.id] = { ...unit, children: [] };
  });

  units.forEach((unit) => {
    if (unit.parent_id) {
      map[unit.parent_id]?.children.push(map[unit.id]);
    } else {
      roots.push(map[unit.id]);
    }
  });

  return roots;
};

// -----------------------------
// TREE NODE COMPONENT
// -----------------------------
function TreeNode({ node, level = 0, onEdit, onDelete, hasRole }) {
  return (
    <div>
      <div
        className="flex items-center justify-between py-2 px-2 rounded hover:bg-gray-50"
        style={{ paddingLeft: `${level * 20}px` }}
      >
        <div>
          <span className="font-medium text-gray-800">{node.name}</span>
          <span className="ml-2 text-xs text-gray-500 capitalize">
            ({node.type})
          </span>
        </div>

        {hasRole("ADMIN") && (
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => onEdit(node)}
              className="text-blue-600 hover:text-blue-800"
            >
              Editar
            </button>
            <button
              onClick={() => onDelete(node.id)}
              className="text-red-600 hover:text-red-800"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      {node.children?.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          level={level + 1}
          onEdit={onEdit}
          onDelete={onDelete}
          hasRole={hasRole}
        />
      ))}
    </div>
  );
}

// -----------------------------
// MAIN COMPONENT
// -----------------------------
export default function OrganizationPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "department",
    parent_id: null,
  });

  // -----------------------------
  // QUERY
  // -----------------------------
  const { data: units = [], isLoading, error } = useQuery({
    queryKey: ["organization-units"],
    queryFn: fetchOrganizationUnits,
  });

  const treeData = buildTree(units);

  // -----------------------------
  // MUTATIONS
  // -----------------------------
  const createMutation = useMutation({
    mutationFn: createOrganizationUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-units"] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateOrganizationUnit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-units"] });
      setIsModalOpen(false);
      setEditingUnit(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrganizationUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-units"] });
    },
  });

  // -----------------------------
  // HANDLERS
  // -----------------------------
  const resetForm = () =>
    setFormData({ name: "", type: "department", parent_id: null });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingUnit) {
      updateMutation.mutate({
        id: editingUnit.id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      type: unit.type,
      parent_id: unit.parent_id || null,
    });
    setIsModalOpen(true);
  };

  // -----------------------------
  // STATES
  // -----------------------------
  if (isLoading) return <div className="text-gray-500">Cargando...</div>;
  if (error) return <div className="text-red-500">Error al cargar</div>;

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Estructura Organizacional
        </h1>

        {hasRole("ADMIN") && (
          <button
            onClick={() => {
              resetForm();
              setEditingUnit(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Nueva Unidad
          </button>
        )}
      </div>

      {/* TREE */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {treeData.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            onEdit={handleEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
            hasRole={hasRole}
          />
        ))}

        {treeData.length === 0 && (
          <div className="text-center text-gray-500 py-6">
            No hay estructura organizacional
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingUnit ? "Editar" : "Nueva"} Unidad
            </h2>

            <form onSubmit={handleSubmit}>
              {/* NOMBRE */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              {/* TIPO */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="company">Empresa</option>
                  <option value="department">Departamento</option>
                  <option value="area">Área</option>
                  <option value="team">Equipo</option>
                </select>
              </div>

              {/* PADRE 🔥 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad Padre
                </label>
                <select
                  value={formData.parent_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parent_id: e.target.value || null,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Sin padre (raíz)</option>

                  {units
                    .filter((u) => u.id !== editingUnit?.id) // 🔥 evitar ciclo básico
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingUnit ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}