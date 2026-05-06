import { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/Modal";

export function AssignmentModal({ isOpen, onClose, assignment, users, year, onSave }) {
  const [formData, setFormData] = useState({
    user_id: "",
    indicator_name: "",
    formula: "",
    target_value: 100,
    weight: "",
    frequency: "MONTHLY",
    is_active: true,
    start_month: 1,
    end_month: 12,
  });

  useEffect(() => {
    if (assignment) {
      setFormData({
        user_id: assignment.user_id || "",
        indicator_name: assignment.indicator_name || "",
        formula: assignment.formula || "",
        target_value: assignment.target_value ?? 100,
        weight: assignment.weight ?? "",
        frequency: assignment.frequency || "MONTHLY",
        is_active: assignment.is_active ?? true,
        start_month: assignment.start_month ?? 1,
        end_month: assignment.end_month ?? 12,
      });
    } else {
      setFormData({
        user_id: "",
        indicator_name: "",
        formula: "",
        target_value: 100,
        weight: "",
        frequency: "MONTHLY",
        is_active: true,
        start_month: 1,
        end_month: 12,
      });
    }
  }, [assignment, isOpen]);

  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave({
        ...formData,
        year: parseInt(year),
        target_value: parseFloat(formData.target_value),
        weight: parseFloat(formData.weight),
        start_month: formData.start_month ? parseInt(formData.start_month) : undefined,
        end_month: formData.end_month ? parseInt(formData.end_month) : undefined,
      });
      onClose();
    } catch (error) {
      console.error("Error saving assignment:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={assignment ? "Editar asignación" : "Nueva asignación"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Usuario
          </label>
          <select
            value={formData.user_id}
            onChange={(e) => handleChange("user_id", e.target.value)}
            required
            disabled={!!assignment}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="">Seleccionar usuario</option>
            {users?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Indicador
          </label>
          <input
            type="text"
            value={formData.indicator_name}
            onChange={(e) => handleChange("indicator_name", e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: Ventas, Productividad, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fórmula
          </label>
          <input
            type="text"
            value={formData.formula}
            onChange={(e) => handleChange("formula", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: suma(ventas), promedio(tiempo), etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Frecuencia
          </label>
          <select
            value={formData.frequency}
            onChange={(e) => handleChange("frequency", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="MONTHLY">Mensual</option>
            <option value="BIMONTHLY">Bimestral</option>
            <option value="QUARTERLY">Trimestral</option>
            <option value="SEMIANNUAL">Semestral</option>
            <option value="ANNUAL">Anual</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.target_value}
              onChange={(e) => handleChange("target_value", e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Por defecto 100%"
            />
            <p className="text-xs text-gray-500 mt-1">
              Porcentaje a superar. Por ejemplo: si la fórmula da 90% y la meta es 100%, el logro será 90%.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peso (%)
            </label>
            <input
              type="number"
              step="0.01"
              max="100"
              value={formData.weight}
              onChange={(e) => handleChange("weight", e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mes inicio
            </label>
            <select
              value={formData.start_month}
              onChange={(e) => handleChange("start_month", parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mes fin
            </label>
            <select
              value={formData.end_month}
              onChange={(e) => handleChange("end_month", parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        {assignment && (
          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleChange("is_active", e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Activo
              </span>
            </label>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}