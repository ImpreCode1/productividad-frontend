import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Plus, Trash2, Edit3, CheckCircle, X, ChevronDown, ChevronRight } from "lucide-react";
import * as approvalConfigApi from "../../../api/approvalConfig.api";

const CONFIG_TYPES = [
  { value: "area", label: "Área / Vicepresidencia" },
  { value: "position", label: "Cargo" },
  { value: "team", label: "Equipo (por líder)" },
  { value: "user", label: "Colaborador específico" },
];

const LOAD_MODES = [
  { value: "employee", label: "Colaborador carga, Líder aprueba", desc: "Modo estándar" },
  { value: "leader", label: "Líder carga directamente", desc: "Modo especial" },
  { value: "admin", label: "Admin carga directamente", desc: "Modo especial" },
];

export default function ApprovalConfigPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editConfig, setEditConfig] = useState(null);
  const [formData, setFormData] = useState({ config_type: "area", config_value: "", load_mode: "employee" });
  const queryClient = useQueryClient();

  const { data: configsData, isLoading } = useQuery({
    queryKey: ["approvalConfigs"],
    queryFn: () => approvalConfigApi.getApprovalConfigs(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => approvalConfigApi.createApprovalConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvalConfigs"] });
      setShowCreateModal(false);
      setFormData({ config_type: "area", config_value: "", load_mode: "employee" });
    },
    onError: (error) => {
      alert(error.response?.data?.detail || "Error al crear configuración");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => approvalConfigApi.updateApprovalConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvalConfigs"] });
      setEditConfig(null);
    },
    onError: (error) => {
      alert(error.response?.data?.detail || "Error al actualizar configuración");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => approvalConfigApi.deleteApprovalConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvalConfigs"] });
    },
    onError: (error) => {
      alert(error.response?.data?.detail || "Error al eliminar configuración");
    },
  });

  const handleCreate = () => {
    if (!formData.config_value.trim()) {
      alert("El valor de configuración es obligatorio");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editConfig) return;
    updateMutation.mutate({ id: editConfig.id, data: { load_mode: editConfig.load_mode } });
  };

  const getTypeLabel = (type) => {
    const t = CONFIG_TYPES.find(ct => ct.value === type);
    return t ? t.label : type;
  };

  const getModeBadge = (mode) => {
    const m = LOAD_MODES.find(lm => lm.value === mode);
    const colors = {
      employee: "bg-blue-100 text-blue-700",
      leader: "bg-purple-100 text-purple-700",
      admin: "bg-red-100 text-red-700",
    };
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${colors[mode] || "bg-gray-100 text-gray-600"}`}>
        {m ? m.label : mode}
      </span>
    );
  };

  const configs = configsData?.data?.configs || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración de Carga</h1>
            <p className="text-sm text-gray-500">
              Define qué áreas/cargos/equipos usan modo estándar o especial
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Nueva Configuración
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : configs.length === 0 ? (
          <div className="p-8 text-center">
            <Settings className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin configuraciones</h3>
            <p className="text-gray-500">Crea configuraciones para definir qué áreas usan modo especial de carga</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Modo de Carga</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Creado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {configs.map((config) => (
                <tr key={config.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{getTypeLabel(config.config_type)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{config.config_value}</td>
                  <td className="px-4 py-3">{getModeBadge(config.load_mode)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {config.created_at ? new Date(config.created_at).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => setEditConfig({ id: config.id, load_mode: config.load_mode })}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => { if (confirm("¿Eliminar esta configuración?")) deleteMutation.mutate(config.id); }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Nueva Configuración de Carga</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de configuración</label>
                <select value={formData.config_type}
                  onChange={(e) => setFormData({ ...formData, config_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {CONFIG_TYPES.map(ct => (
                    <option key={ct.value} value={ct.value}>{ct.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.config_type === "area" ? "Nombre del Área" :
                   formData.config_type === "position" ? "Nombre del Cargo" :
                   formData.config_type === "team" ? "ID del Líder" :
                   "ID del Usuario"}
                </label>
                <input type="text" value={formData.config_value}
                  onChange={(e) => setFormData({ ...formData, config_value: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder={
                    formData.config_type === "area" ? "Ej: Logística" :
                    formData.config_type === "position" ? "Ej: Conductor" :
                    formData.config_type === "team" ? "ID del líder" :
                    "UUID del usuario"
                  } />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modo de carga</label>
                <div className="space-y-2">
                  {LOAD_MODES.map(lm => (
                    <label key={lm.value} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${
                      formData.load_mode === lm.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                    }`}>
                      <input type="radio" name="load_mode" value={lm.value}
                        checked={formData.load_mode === lm.value}
                        onChange={(e) => setFormData({ ...formData, load_mode: e.target.value })}
                        className="mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{lm.label}</p>
                        <p className="text-xs text-gray-500">{lm.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button onClick={handleCreate} disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {createMutation.isPending ? "Creando..." : "Crear"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Editar Modo de Carga</h3>
              <button onClick={() => setEditConfig(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modo de carga</label>
                <div className="space-y-2">
                  {LOAD_MODES.map(lm => (
                    <label key={lm.value} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${
                      editConfig.load_mode === lm.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                    }`}>
                      <input type="radio" name="edit_load_mode" value={lm.value}
                        checked={editConfig.load_mode === lm.value}
                        onChange={(e) => setEditConfig({ ...editConfig, load_mode: e.target.value })}
                        className="mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{lm.label}</p>
                        <p className="text-xs text-gray-500">{lm.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditConfig(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button onClick={handleUpdate} disabled={updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {updateMutation.isPending ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
