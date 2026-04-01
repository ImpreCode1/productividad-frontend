import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPositions, createPosition, updatePosition, deletePosition } from "../../../api/positions.api";
import { fetchOrganizationUnits } from "../../../api/organization.api";
import { useAuth } from "../../../hooks/useAuth";

export default function PositionsPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [formData, setFormData] = useState({ name: "", organization_unit_id: "" });

  const { data: positions = [], isLoading: loadingPositions } = useQuery({
    queryKey: ["positions"],
    queryFn: fetchPositions,
  });

  const { data: units = [] } = useQuery({
    queryKey: ["organization-units"],
    queryFn: fetchOrganizationUnits,
  });

  const createMutation = useMutation({
    mutationFn: createPosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePosition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setIsModalOpen(false);
      setEditingPosition(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePosition,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["positions"] }),
  });

  const resetForm = () => setFormData({ name: "", organization_unit_id: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPosition) {
      updateMutation.mutate({ id: editingPosition.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (position) => {
    setEditingPosition(position);
    setFormData({ name: position.name, organization_unit_id: position.organization_unit_id || "" });
    setIsModalOpen(true);
  };

  const getUnitName = (unitId) => {
    const unit = units?.find(u => u.id === unitId);
    return unit?.name || "—";
  };

  if (loadingPositions) return <div className="text-gray-500">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cargos</h1>
        {hasRole("ADMIN") && (
          <button onClick={() => { resetForm(); setEditingPosition(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Nuevo Cargo
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad Organizacional</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {positions.map((position) => (
              <tr key={position.id}>
                <td className="px-6 py-4 text-sm text-gray-800">{position.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{getUnitName(position.organization_unit_id)}</td>
                <td className="px-6 py-4 text-sm">
                  {hasRole("ADMIN") && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(position)} className="text-blue-600 hover:text-blue-800">Editar</button>
                      <button onClick={() => deleteMutation.mutate(position.id)} className="text-red-600 hover:text-red-800">Eliminar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {positions.length === 0 && (
              <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-500">No hay cargos</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingPosition ? "Editar" : "Nuevo"} Cargo</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cargo</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad Organizacional</label>
                <select value={formData.organization_unit_id} onChange={(e) => setFormData({ ...formData, organization_unit_id: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Seleccionar unidad</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editingPosition ? "Guardar" : "Crear"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}