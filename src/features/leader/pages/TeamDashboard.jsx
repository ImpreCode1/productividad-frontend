import { useState } from "react";
import { Users, CheckCircle, Lock, Unlock, X, ChevronDown, ChevronRight } from "lucide-react";
import { useTeamDashboard } from "../hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as trackingApi from "../../../api/tracking.api";

export default function TeamDashboard() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data: dashboard, isLoading } = useTeamDashboard(year);
  const queryClient = useQueryClient();

  const [expandedMembers, setExpandedMembers] = useState({});
  const [expandedIndicators, setExpandedIndicators] = useState({});
  const [closeModal, setCloseModal] = useState({ open: false, month: null, indicator: null });
  const [caseInput, setCaseInput] = useState({ casos: "", total: "" });

  const closeMutation = useMutation({
    mutationFn: ({ trackingId, achievedValue, achievedTotal }) => 
      trackingApi.closeTracking(trackingId, achievedValue, achievedTotal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "dashboard", year] });
      setCloseModal({ open: false, month: null, indicator: null });
      setCaseInput({ casos: "", total: "" });
    },
  });

  const toggleMember = (userId) => {
    setExpandedMembers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const toggleIndicator = (indicatorKey) => {
    setExpandedIndicators(prev => ({
      ...prev,
      [indicatorKey]: !prev[indicatorKey]
    }));
  };

  const handleOpenCloseModal = (month, indicator) => {
    console.log("Opening modal - month:", month, "indicator:", indicator);
    setCloseModal({ open: true, month, indicator });
    setCaseInput({ casos: "", total: "" });
  };

  const handleClose = async () => {
    if (!closeModal.month?.tracking_id) {
      alert("Error: ID de tracking no disponible. Refresca la página.");
      return;
    }

    let finalValue = null;
    let finalTotal = null;
    
    // Solo usar el cálculo de casos (Logrado / Total) * 100
    if (caseInput.casos && caseInput.total) {
      const casos = parseFloat(caseInput.casos);
      const total = parseFloat(caseInput.total);
      if (total > 0) {
        finalValue = casos;
        finalTotal = total;
      }
    }

    if (finalValue === null || finalTotal === null) {
      alert("Por favor ingresa los valores de la fórmula");
      return;
    }

    try {
      await closeMutation.mutateAsync({
        trackingId: closeModal.month.tracking_id,
        achievedValue: finalValue,
        achievedTotal: finalTotal,
      });
    } catch (error) {
      alert(error.response?.data?.detail || "Error al cerrar evaluación");
    }
  };

  const getMonthName = (month) => {
    const months = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];
    return months[month - 1];
  };

  const getStatusBadge = (month) => {
    if (month.is_closed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Lock className="h-3 w-3" />
          Cerrado
        </span>
      );
    }
    if (month.status === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3" />
          Completado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <Unlock className="h-3 w-3" />
        Pendiente
      </span>
    );
  };

  const canRegister = (month) => !month.is_closed && (!month.status || month.status === "PENDING");
  const canClose = (month) => !month.is_closed && month.status === "COMPLETED";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-7 w-7" />
            Mi Equipo
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona y revisa el desempeño de tu equipo
          </p>
        </div>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={currentYear}>{currentYear}</option>
          <option value={currentYear - 1}>{currentYear - 1}</option>
          <option value={currentYear - 2}>{currentYear - 2}</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="text-gray-500">Cargando equipo...</div>
        </div>
      ) : dashboard?.team?.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sin miembros en tu equipo
          </h3>
          <p className="text-gray-500">
            Aún no tienes colaboradores asignados a tu equipo
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {dashboard?.team?.map((member) => (
            <div
              key={member.user_id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div 
                className="px-6 py-4 border-b border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleMember(member.user_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedMembers[member.user_id] ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {member.name || member.user_name || "Sin nombre"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {member.position_name || member.position || "Sin cargo"} • {member.email || member.user_email || "Sin correo"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {member.indicators?.length || 0} indicadores
                  </div>
                </div>
              </div>

              {expandedMembers[member.user_id] && (
                <div className="p-4">
                  {member.indicators?.length > 0 ? (
                    <div className="space-y-2">
                      {member.indicators.map((indicator) => {
                        const indicatorKey = `${member.user_id}-${indicator.indicator_name}`;
                        return (
                          <div key={indicatorKey} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div 
                              className="px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                              onClick={() => toggleIndicator(indicatorKey)}
                            >
                              <div className="flex items-center gap-2">
                                {expandedIndicators[indicatorKey] ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                                <div>
                                  <span className="font-medium text-gray-900">
                                    {indicator.indicator_name}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    Meta: {indicator.target_value} • Peso: {indicator.weight}%
                                  </span>
                                  {indicator.formula && (
                                    <span className="ml-2 text-xs text-blue-600">
                                      Fórmula: {indicator.formula}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {indicator.months?.filter(m => m.is_closed).length}/{indicator.months?.length || 0} meses
                              </div>
                            </div>

                            {expandedIndicators[indicatorKey] && (
                              <div className="overflow-x-auto">
                                <table className="min-w-full">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mes</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Meta</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Logrado</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cumplimiento</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Estado</th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Acción</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {indicator.months?.map((month) => (
                                      <tr key={month.month} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                          {getMonthName(month.month)}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                          {indicator.target_value}%
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                          {month.achieved_value != null && month.achieved_total != null
                                            ? `${month.achieved_value}/${month.achieved_total}`
                                            : month.achieved_value != null 
                                              ? Number(month.achieved_value).toFixed(2) + "%"
                                              : "-"}
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                          {month.achieved_value != null && month.achieved_total != null ? (
                                            (() => {
                                              const percentage = (Number(month.achieved_value) / Number(month.achieved_total)) * 100;
                                              return percentage >= Number(indicator.target_value) ? (
                                                <span className="text-green-600 font-medium">CUMPLIDO</span>
                                              ) : (
                                                <span className="text-red-600 font-medium">NO CUMPLIDO</span>
                                              );
                                            })()
                                          ) : "-"}
                                        </td>
                                        <td className="px-4 py-2">
                                          {getStatusBadge(month)}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                          {canRegister(month) && (
                                            <button
                                              onClick={() => handleOpenCloseModal(month, indicator)}
                                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                                            >
                                              Registrar
                                            </button>
                                          )}
                                          {canClose(month) && (
                                            <button
                                              onClick={() => handleOpenCloseModal(month, indicator)}
                                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                            >
                                              Cerrar
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Sin indicadores asignados
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {closeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                Registrar Avance
              </h3>
              <button
                onClick={() => setCloseModal({ open: false, month: null, indicator: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Indicador</p>
                <p className="font-medium">{closeModal.indicator?.indicator_name}</p>
                <p className="text-sm text-gray-500">
                  Meta: {closeModal.indicator?.target_value}% • Peso: {closeModal.indicator?.weight}%
                </p>
                {closeModal.indicator?.formula && (
                  <p className="text-xs text-blue-600 mt-1">
                    Fórmula: {closeModal.indicator.formula}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valores de la fórmula
                </label>
                <div className="text-xs text-gray-500 mb-2">
                  Ingresa los valores para calcular el porcentaje de la fórmula
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logrado
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={caseInput.casos}
                    onChange={(e) => setCaseInput({ ...caseInput, casos: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Valor logrado (numerador)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={caseInput.total}
                    onChange={(e) => setCaseInput({ ...caseInput, total: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Valor total (denominador)"
                  />
                </div>
              </div>

              {caseInput.casos && caseInput.total && parseFloat(caseInput.total) > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Resultado (se guardará como logrado):</p>
                  <p className="text-lg font-bold text-blue-600">
                    {((parseFloat(caseInput.casos) / parseFloat(caseInput.total)) * 100).toFixed(2)}%
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setCloseModal({ open: false, month: null, indicator: null })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClose}
                  disabled={closeMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {closeMutation.isPending ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}