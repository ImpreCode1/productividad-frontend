import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchOrganizationUnits, createOrganizationUnit, updateOrganizationUnit, deleteOrganizationUnit } from "../../../api/organization.api";
import { useAuth } from "../../../hooks/useAuth";

export default function OrganizationPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [formData, setFormData] = useState({ name: "", type: "department" });

  const { data: units = [], isLoading, error } = useQuery({
    queryKey: ["organization-units"],
    queryFn: fetchOrganizationUnits,
  });

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

  const resetForm = () => setFormData({ name: "", type: "department" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (unit) => {
    setEditingUnit(unit);
    setFormData({ name: unit.name, type: unit.type });
    setIsModalOpen(true);
  };

  if (isLoading) return <div className="text-gray-500">Cargando...</div>;
  if (error) return <div className="text-red-500">Error al cargar</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Organización</h1>
        {hasRole("ADMIN") && (
          <button
            onClick={() => { resetForm(); setEditingUnit(null); setIsModalOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Nueva Unidad
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {units.map((unit) => (
              <tr key={unit.id}>
                <td className="px-6 py-4 text-sm text-gray-800">{unit.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 capitalize">{unit.type}</td>
                <td className="px-6 py-4 text-sm">
                  {hasRole("ADMIN") && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(unit)} className="text-blue-600 hover:text-blue-800">Editar</button>
                      <button onClick={() => deleteMutation.mutate(unit.id)} className="text-red-600 hover:text-red-800">Eliminar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {units.length === 0 && (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center text-gray-500">No hay unidades organizacionales</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingUnit ? "Editar" : "Nueva"} Unidad</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="company">Empresa</option>
                  <option value="department">Departamento</option>
                  <option value="area">Área</option>
                  <option value="team">Equipo</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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