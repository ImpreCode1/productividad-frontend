import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Mail, Users, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import api from "../../../api/client";

const monthsList = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function NotificationsPage() {
  const [recipientType, setRecipientType] = useState("all_leaders");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [template, setTemplate] = useState("calification_reminder");
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [showUserSelector, setShowUserSelector] = useState(false);

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["notifications", "users"],
    queryFn: async () => {
      const { data } = await api.get("/notifications/users");
      return data.users || [];
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        recipient_type: recipientType,
        recipient_ids: recipientType === "specific" ? selectedUsers : null,
        template,
        month,
        year,
      };
      const { data } = await api.post("/notifications/send", payload);
      return data;
    },
  });

  const handleSend = async () => {
    if (recipientType === "specific" && selectedUsers.length === 0) {
      alert("Por favor selecciona al menos un usuario");
      return;
    }
    await sendMutation.mutateAsync();
  };

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const leaders = usersData?.filter((u) => u.role.includes("LEADER")) || [];
  const employees = usersData?.filter((u) => u.role.includes("EMPLOYEE")) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="h-7 w-7" />
            Enviar Notificaciones
          </h1>
          <p className="text-gray-500 mt-1">
            Envía recordatorios por correo electrónico a usuarios del sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Destinatarios
          </h2>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="recipient"
                checked={recipientType === "all_leaders"}
                onChange={() => { setRecipientType("all_leaders"); setShowUserSelector(false); }}
                className="h-4 w-4 text-blue-600"
              />
              <div>
                <span className="font-medium text-gray-900">Todos los líderes</span>
                <p className="text-xs text-gray-500">Enviar a todos los usuarios con rol de líder</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="recipient"
                checked={recipientType === "all_employees"}
                onChange={() => { setRecipientType("all_employees"); setShowUserSelector(false); }}
                className="h-4 w-4 text-blue-600"
              />
              <div>
                <span className="font-medium text-gray-900">Todos los empleados</span>
                <p className="text-xs text-gray-500">Enviar a todos los usuarios con rol de empleado</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="recipient"
                checked={recipientType === "specific"}
                onChange={() => { setRecipientType("specific"); setShowUserSelector(true); }}
                className="h-4 w-4 text-blue-600"
              />
              <div>
                <span className="font-medium text-gray-900">Usuarios específicos</span>
                <p className="text-xs text-gray-500">Seleccionar usuarios manualmente</p>
              </div>
            </label>

            {showUserSelector && (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Líderes</h3>
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {leaders.map((leader) => (
                      <label key={leader.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(leader.id)}
                          onChange={() => toggleUser(leader.id)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm">{leader.name}</span>
                        <span className="text-xs text-gray-400">({leader.email})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Empleados</h3>
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {employees.map((emp) => (
                      <label key={emp.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(emp.id)}
                          onChange={() => toggleUser(emp.id)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm">{emp.name}</span>
                        <span className="text-xs text-gray-400">({emp.email})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  {selectedUsers.length} usuario(s) seleccionado(s)
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Configuración del Mensaje
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plantilla
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="calification_reminder">
                  Recordatorio de calificación (para líderes)
                </option>
                <option value="evidence_reminder">
                  Recordatorio de evidencias (para empleados)
                </option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mes
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {monthsList.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={currentYear}>{currentYear}</option>
                  <option value={currentYear - 1}>{currentYear - 1}</option>
                  <option value={currentYear - 2}>{currentYear - 2}</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Vista previa del mensaje:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Para:</strong> {
                  recipientType === "all_leaders" ? "Todos los líderes" :
                  recipientType === "all_employees" ? "Todos los empleados" :
                  `${selectedUsers.length} usuario(s) seleccionado(s)`
                }</p>
                <p><strong>Asunto:</strong> {
                  template === "calification_reminder" 
                    ? `Recordatorio: Califica los indicadores de tu equipo - ${monthsList[month-1].label} ${year}`
                    : `Recordatorio: Sube tus evidencias de ${monthsList[month-1].label} ${year}`
                }</p>
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={sendMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              {sendMutation.isPending ? "Enviando..." : "Enviar Notificaciones"}
            </button>

            {sendMutation.isSuccess && (
              <div className="flex items-center gap-2 p-4 bg-green-50 text-green-800 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span>{sendMutation.data.message}</span>
              </div>
            )}

            {sendMutation.isError && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-800 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span>Error al enviar notificaciones</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}