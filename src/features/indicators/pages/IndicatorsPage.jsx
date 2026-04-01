import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchIndicators, createIndicator, updateIndicator, deleteIndicator } from "../../../api/indicators.api";
import { useAuth } from "../../../hooks/useAuth";

export default function IndicatorsPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [formData, setFormData] = useState({ name: "", formula_text: "", frequency: "monthly" });

  const { data: indicators = [], isLoading, error } = useQuery({
    queryKey: ["indicators"],
    queryFn: fetchIndicators,
  });

  const createMutation = useMutation({
    mutationFn: createIndicator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicators"] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateIndicator(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicators"] });
      setIsModalOpen(false);
      setEditingIndicator(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIndicator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicators"] });
    },
  });

  const resetForm = () => setFormData({ name: "", formula_text: "", frequency: "monthly" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingIndicator) {
      updateMutation.mutate({ id: editingIndicator.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (indicator) => {
    setEditingIndicator(indicator);
    setFormData({ name: indicator.name, formula_text: indicator.formula_text || "", frequency: indicator.frequency });
    setIsModalOpen(true);
  };

  if (isLoading) return <div className="text-gray-500">Cargando...</div>;
  if (error) return <div className="text-red-500">Error al cargar</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Indicadores</h1>
        {hasRole("ADMIN") && (
          <button onClick={() => { resetForm(); setEditingIndicator(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Nuevo Indicador
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fórmula</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frecuencia</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {indicators.map((indicator) => (
              <tr key={indicator.id}>
                <td className="px-6 py-4 text-sm text-gray-800">{indicator.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 font-mono">{indicator.formula_text}</td>
                <td className="px-6 py-4 text-sm text-gray-600 capitalize">{indicator.frequency}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${indicator.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {indicator.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {hasRole("ADMIN") && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(indicator)} className="text-blue-600 hover:text-blue-800">Editar</button>
                      <button onClick={() => deleteMutation.mutate(indicator.id)} className="text-red-600 hover:text-red-800">Eliminar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {indicators.length === 0 && (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No hay indicadores</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingIndicator ? "Editar" : "Nuevo"} Indicador</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fórmula</label>
                <input type="text" value={formData.formula_text} onChange={(e) => setFormData({ ...formData, formula_text: e.target.value })} className="w-full border rounded-lg px-3 py-2 font-mono text-sm" placeholder="(valor/total)*100" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
                <select value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editingIndicator ? "Guardar" : "Crear"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}