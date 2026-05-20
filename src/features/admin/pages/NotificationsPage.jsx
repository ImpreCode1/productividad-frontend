import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Mail, Users, Send, CheckCircle, AlertCircle, Loader2, Filter, Building2, X, Search } from "lucide-react";
import api from "../../../api/client";
import { getAreas } from "../../../api/users.api";

const normalizeArea = (area) => {
  if (!area) return null;
  const areaStr = area.trim().toLowerCase();
  const areaMapping = {
    "innovation business": "INNOVATION",
    "innovation": "INNOVATION",
    "human talent and administrative vice president": "HUMAN TALENT AND ADMINISTRATIVE",
    "human talent and administrative": "HUMAN TALENT AND ADMINISTRATIVE",
    "human talent": "HUMAN TALENT AND ADMINISTRATIVE",
    "human talent & administrative": "HUMAN TALENT AND ADMINISTRATIVE",
    "financial officer": "FINANCIAL OFFICER",
    "go to market": "GO TO MARKET",
    "it solutions": "IT SOLUTIONS",
    "executive office": "EXECUTIVE OFFICE",
    "expansion": "EXPANSION",
    "presidency": "PRESIDENCY",
  };
  return areaMapping.get(areaStr, areaStr.toUpperCase());
};

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

export default function NotificationsPage() {
  const [recipientType, setRecipientType] = useState("all_leaders");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [template, setTemplate] = useState("calification_reminder");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [filterArea, setFilterArea] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: usersData } = useQuery({
    queryKey: ["notifications", "users"],
    queryFn: async () => {
      const { data } = await api.get("/notifications/users");
      return data.users || [];
    },
  });

  const { data: areas } = useQuery({
    queryKey: ["areas"],
    queryFn: async () => {
      const { data } = await getAreas();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        recipient_type: recipientType,
        recipient_ids: recipientType === "specific" ? selectedUsers : null,
        filter_area: filterArea || null,
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

  const removeUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((id) => id !== userId));
  };

  const selectAll = (users) => {
    const userIds = users.map((u) => u.id);
    setSelectedUsers((prev) => [...new Set([...prev, ...userIds])]);
  };

  const clearAll = () => {
    setSelectedUsers([]);
  };

  const getUserRole = (user) => {
    const roleStr = JSON.stringify(user.roles || user.role || "").toUpperCase();
    if (roleStr.includes("LEADER")) return "LEADER";
    if (roleStr.includes("EMPLOYEE")) return "EMPLOYEE";
    return "OTHER";
  };

  const usersWithRole = usersData || [];
  const leaders = usersWithRole.filter((u) => getUserRole(u) === "LEADER");
  const employees = usersWithRole.filter((u) => getUserRole(u) === "EMPLOYEE");
  const allUsers = [...leaders, ...employees];

  const filteredUsersByRole = useMemo(() => {
    if (recipientType === "all_leaders") return leaders;
    if (recipientType === "all_employees") return employees;
    return allUsers;
  }, [recipientType, leaders, employees, allUsers]);

  const filteredUsersByArea = useMemo(() => {
    if (!filterArea) return filteredUsersByRole;
    return filteredUsersByRole.filter((u) => u.area && u.area.toLowerCase().includes(filterArea.toLowerCase()));
  }, [filteredUsersByRole, filterArea]);

  const filteredUsersBySearch = useMemo(() => {
    if (!searchTerm) return filteredUsersByArea;
    const term = searchTerm.toLowerCase();
    return filteredUsersByArea.filter((u) =>
      u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
    );
  }, [filteredUsersByArea, searchTerm]);

  const selectedUsersData = useMemo(() => {
    return selectedUsers.map((id) => allUsers.find((u) => u.id === id)).filter(Boolean);
  }, [selectedUsers, allUsers]);

  const recipientCount = recipientType === "specific"
    ? selectedUsers.length
    : filteredUsersByArea.length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Enviar Notificaciones</h1>
              <p className="text-sm text-gray-500">Envía recordatorios por correo electrónico a usuarios del sistema</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">Selección de Destinatarios</span>
                {filterArea && (
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    <Building2 className="h-3 w-3" />
                    {filterArea}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => { setRecipientType("all_leaders"); setShowUserSelector(false); }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    recipientType === "all_leaders"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-sm">Todos los Líderes</div>
                  <div className="text-xs text-gray-500">{leaders.length} usuarios</div>
                </button>
                <button
                  onClick={() => { setRecipientType("all_employees"); setShowUserSelector(false); }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    recipientType === "all_employees"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-sm">Todos los Empleados</div>
                  <div className="text-xs text-gray-500">{employees.length} usuarios</div>
                </button>
                <button
                  onClick={() => { setRecipientType("specific"); setShowUserSelector(true); }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    recipientType === "specific"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-sm">Usuarios Específicos</div>
                  <div className="text-xs text-gray-500">{selectedUsers.length} seleccionados</div>
                </button>
              </div>
            </div>

            {showUserSelector && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Seleccionar Usuarios</h3>
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      onClick={() => {
                        const leadersList = filteredUsersBySearch.filter((u) => getUserRole(u) === "LEADER");
                        selectAll(leadersList);
                      }}
                      className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                      Seleccionar Líderes
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => {
                        const employeesList = filteredUsersBySearch.filter((u) => getUserRole(u) === "EMPLOYEE");
                        selectAll(employeesList);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Seleccionar Empleados
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={clearAll}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o correo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {filteredUsersBySearch.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No se encontraron usuarios
                    </div>
                  ) : (() => {
                    const leadersList = filteredUsersBySearch.filter((u) => getUserRole(u) === "LEADER");
                    const employeesList = filteredUsersBySearch.filter((u) => getUserRole(u) === "EMPLOYEE");
                    
                    return (
                      <>
                        {leadersList.length > 0 && (
                          <div className="mb-4">
                            <div className="px-4 py-2 bg-purple-50 text-purple-700 text-xs font-medium uppercase sticky top-0">
                              Líderes ({leadersList.length})
                            </div>
                            <table className="w-full">
                              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                  <th className="px-4 py-2 text-left font-medium">Nombre</th>
                                  <th className="px-4 py-2 text-left font-medium">Correo</th>
                                  <th className="px-4 py-2 text-left font-medium">Vicepresidencia</th>
                                  <th className="px-4 py-2 text-center font-medium w-12">Seleccionar</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {leadersList.map((user) => (
                                  <tr key={user.id} className="hover:bg-purple-50">
                                    <td className="px-4 py-2 text-sm text-gray-900">{user.name}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">{user.email}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">{user.area || "-"}</td>
                                    <td className="px-4 py-2 text-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => toggleUser(user.id)}
                                        className="h-4 w-4 text-purple-600 rounded"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {employeesList.length > 0 && (
                          <div>
                            <div className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-medium uppercase sticky top-0">
                              Empleados ({employeesList.length})
                            </div>
                            <table className="w-full">
                              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                  <th className="px-4 py-2 text-left font-medium">Nombre</th>
                                  <th className="px-4 py-2 text-left font-medium">Correo</th>
                                  <th className="px-4 py-2 text-left font-medium">Vicepresidencia</th>
                                  <th className="px-4 py-2 text-center font-medium w-12">Seleccionar</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {employeesList.map((user) => (
                                  <tr key={user.id} className="hover:bg-blue-50">
                                    <td className="px-4 py-2 text-sm text-gray-900">{user.name}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">{user.email}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">{user.area || "-"}</td>
                                    <td className="px-4 py-2 text-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => toggleUser(user.id)}
                                        className="h-4 w-4 text-blue-600 rounded"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {recipientType === "specific" && selectedUsers.length > 0 && (() => {
              const selectedLeaders = selectedUsersData.filter((u) => getUserRole(u) === "LEADER");
              const selectedEmployees = selectedUsersData.filter((u) => getUserRole(u) === "EMPLOYEE");
              return (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">
                      Destinatarios Seleccionados ({selectedUsers.length})
                    </h3>
                    <button
                      onClick={clearAll}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Limpiar selección
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {selectedLeaders.length > 0 && (
                      <div className="p-3 border-b border-gray-100">
                        <div className="text-xs font-medium text-gray-500 mb-2">
                          Líderes ({selectedLeaders.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedLeaders.map((user) => (
                            <div
                              key={user.id}
                              className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs"
                            >
                              <span className="truncate max-w-[150px]">{user.name}</span>
                              <button
                                onClick={() => removeUser(user.id)}
                                className="hover:text-purple-900"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedEmployees.length > 0 && (
                      <div className="p-3">
                        <div className="text-xs font-medium text-gray-500 mb-2">
                          Empleados ({selectedEmployees.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedEmployees.map((user) => (
                            <div
                              key={user.id}
                              className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs"
                            >
                              <span className="truncate max-w-[150px]">{user.name}</span>
                              <button
                                onClick={() => removeUser(user.id)}
                                className="hover:text-blue-900"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {(recipientType === "all_leaders" || recipientType === "all_employees") && filteredUsersByArea.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-medium text-gray-900">
                    Destinatarios ({filteredUsersByArea.length})
                  </h3>
                </div>
                <div className="max-h-48 overflow-y-auto p-2">
                  <div className="flex flex-wrap gap-2">
                    {filteredUsersByArea.slice(0, 50).map((user) => (
                      <div
                        key={user.id}
                        className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs"
                      >
                        <span className="truncate max-w-[150px]">{user.name}</span>
                      </div>
                    ))}
                    {filteredUsersByArea.length > 50 && (
                      <div className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                        +{filteredUsersByArea.length - 50} más
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="font-medium text-gray-900 mb-4">Configuración</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Filtro por Vicepresidencia</label>
                  <select
                    value={filterArea}
                    onChange={(e) => setFilterArea(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todas las Vicepresidencias</option>
                    {areas?.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Plantilla</label>
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="calification_reminder">
                      Recordatorio de calificación (líderes)
                    </option>
                    <option value="evidence_reminder">
                      Recordatorio de evidencias (empleados)
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">Mes</label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {monthsList.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">Año</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={currentYear}>{currentYear}</option>
                      <option value={currentYear - 1}>{currentYear - 1}</option>
                      <option value={currentYear - 2}>{currentYear - 2}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
              <h2 className="font-medium text-gray-900 mb-3">Resumen</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipo:</span>
                  <span className="text-gray-900 font-medium">
                    {recipientType === "all_leaders" && "Todos los líderes"}
                    {recipientType === "all_employees" && "Todos los empleados"}
                    {recipientType === "specific" && "Usuarios específicos"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Destinatarios:</span>
                  <span className="text-blue-600 font-semibold">{recipientCount}</span>
                </div>
                {filterArea && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Filtro:</span>
                    <span className="text-gray-900">{filterArea}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-500">Asunto:</span>
                  <p className="text-gray-900 mt-1">
                    {template === "calification_reminder"
                      ? `Recordatorio: Califica los indicadores de tu equipo - ${monthsList[month-1].label} ${year}`
                      : `Recordatorio: Sube tus evidencias de ${monthsList[month-1].label} ${year}`}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={sendMutation.isPending || (recipientType === "specific" && selectedUsers.length === 0)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              {sendMutation.isPending ? "Enviando..." : "Enviar Notificaciones"}
            </button>

            {sendMutation.isSuccess && (
              <div className="flex items-center gap-2 p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{sendMutation.data.message}</span>
              </div>
            )}

            {sendMutation.isError && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">Error al enviar notificaciones</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}