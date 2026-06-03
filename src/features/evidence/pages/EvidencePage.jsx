import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Upload, Trash2, FileText, Image, File, Send, CheckCircle, XCircle, Clock, AlertTriangle, Save, Percent, Divide } from "lucide-react";
import * as assignmentsApi from "../../../api/assignments.api";
import * as trackingApi from "../../../api/tracking.api";
import * as approvalApi from "../../../api/approval.api";
import api from "../../../api/client";

const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const statusColors = {
  PENDIENTE: { bg: "bg-gray-100", text: "text-gray-600", icon: Clock, label: "Pendiente" },
  EN_REVISION: { bg: "bg-yellow-100", text: "text-yellow-700", icon: AlertTriangle, label: "En revisión" },
  APROBADO: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle, label: "Aprobado" },
  RECHAZADO: { bg: "bg-red-100", text: "text-red-700", icon: XCircle, label: "Rechazado" },
};

const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

export default function EvidencePage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [uploadFile, setUploadFile] = useState({});
  const [uploading, setUploading] = useState({});
  const [values, setValues] = useState({});
  const [dirty, setDirty] = useState({});
  const [saving, setSaving] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [inputMode, setInputMode] = useState({});
  const [errorMsg, setErrorMsg] = useState({});
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["myAssignments", year],
    queryFn: () => assignmentsApi.getMyAssignments(year),
  });

  const { data: trackingData } = useQuery({
    queryKey: ["myTracking", year],
    queryFn: () => trackingApi.getMyTracking(year),
  });

  const assignments = assignmentsData?.data?.assignments || [];
  const allTrackings = trackingData?.data?.tracking || [];

  const trackingByAssignment = {};
  allTrackings.forEach(t => {
    if (t.assignment_id) {
      trackingByAssignment[t.assignment_id] = t;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: ({ assignmentId, file }) => approvalApi.uploadEvidenceToAssignment(assignmentId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTracking", year] });
      setUploadFile({});
    },
    onError: (error, variables) => {
      setErrorMsg(prev => ({ ...prev, [variables.assignmentId]: error.response?.data?.detail || "Error al subir evidencia" }));
    },
    onSettled: () => setUploading({}),
  });

  const deleteMutation = useMutation({
    mutationFn: (evidenceId) => api.delete(`/evidence/${evidenceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTracking", year] });
    },
    onError: (error) => {
      alert(error.response?.data?.detail || "Error al eliminar evidencia");
    },
  });

  const valueMutation = useMutation({
    mutationFn: ({ assignmentId, achievedValue, achievedTotal }) =>
      approvalApi.setTrackingValue(assignmentId, achievedValue, achievedTotal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTracking", year] });
      queryClient.invalidateQueries({ queryKey: ["myAssignments", year] });
    },
    onError: (error, variables) => {
      setErrorMsg(prev => ({ ...prev, [`save_${variables.assignmentId}`]: error.response?.data?.detail || "Error al guardar valor" }));
    },
    onSettled: () => setSaving({}),
  });

  const submitMutation = useMutation({
    mutationFn: (assignmentId) => approvalApi.submitAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTracking", year] });
      queryClient.invalidateQueries({ queryKey: ["myAssignments", year] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "me", year] });
    },
    onError: (error) => {
      alert(error.response?.data?.detail || "Error al enviar a revisión");
    },
    onSettled: () => setSubmitting({}),
  });

  const handleUpload = (assignmentId) => {
    const file = uploadFile[assignmentId];
    if (!file) return;
    setUploading(prev => ({ ...prev, [assignmentId]: true }));
    setErrorMsg(prev => ({ ...prev, [assignmentId]: null }));
    uploadMutation.mutate({ assignmentId, file });
  };

  const validateAndSave = (assignmentId) => {
    const v = values[assignmentId];
    const mode = inputMode[assignmentId] || "exact";

    const errKey = `save_${assignmentId}`;

    if (!v || v.achieved_value == null || v.achieved_value === "") {
      setErrorMsg(prev => ({ ...prev, [errKey]: "Ingresa un valor logrado" }));
      return;
    }

    const numValue = parseFloat(v.achieved_value);
    if (isNaN(numValue)) {
      setErrorMsg(prev => ({ ...prev, [errKey]: "El valor logrado debe ser un número válido" }));
      return;
    }

    if (mode === "formula") {
      if (v.achieved_total == null || v.achieved_total === "") {
        setErrorMsg(prev => ({ ...prev, [errKey]: "Ingresa el total para la fórmula" }));
        return;
      }
      const numTotal = parseFloat(v.achieved_total);
      if (isNaN(numTotal) || numTotal <= 0) {
        setErrorMsg(prev => ({ ...prev, [errKey]: "El total debe ser un número mayor a 0" }));
        return;
      }
    }

    setErrorMsg(prev => ({ ...prev, [errKey]: null }));
    setSaving(prev => ({ ...prev, [assignmentId]: true }));

    const achievedTotal = mode === "formula" && v.achieved_total != null && v.achieved_total !== ""
      ? parseFloat(v.achieved_total)
      : null;

    valueMutation.mutate({
      assignmentId,
      achievedValue: numValue,
      achievedTotal,
    });
  };

  const handleSubmit = (assignmentId) => {
    if (!window.confirm("¿Enviar este KPI a revisión?")) return;
    setSubmitting(prev => ({ ...prev, [assignmentId]: true }));
    setErrorMsg(prev => ({ ...prev, [`save_${assignmentId}`]: null }));
    submitMutation.mutate(assignmentId);
  };

  const getFileIcon = (path) => {
    if (!path) return <File size={16} />;
    const ext = path.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png"].includes(ext)) return <Image size={16} />;
    if (ext === "pdf") return <FileText size={16} />;
    return <File size={16} />;
  };

  const getLivePreview = (assignment) => {
    const tracking = trackingByAssignment[assignment.id];
    const v = values[assignment.id];
    if (!v || v.achieved_value == null || v.achieved_value === "") return null;

    const numValue = parseFloat(v.achieved_value);
    if (isNaN(numValue)) return null;

    const mode = inputMode[assignment.id] || "exact";
    const targetValue = Number(assignment.target_value) || 0;
    const weight = Number(assignment.weight) || 0;

    let percentage = null;
    let met = false;
    let valid = false;

    if (mode === "exact") {
      percentage = numValue;
      met = percentage >= targetValue;
      valid = true;
    } else {
      const numTotal = v.achieved_total != null && v.achieved_total !== ""
        ? parseFloat(v.achieved_total)
        : null;
      if (numTotal != null && !isNaN(numTotal) && numTotal > 0) {
        percentage = (numValue / numTotal) * 100;
        met = percentage >= targetValue;
        valid = true;
      }
    }

    if (!valid) return null;

    const weighted = (percentage * weight) / 100;

    return (
      <div className={`mt-2 p-2 rounded-lg text-xs ${met ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
        <div className="flex items-center gap-1">
          {met ? (
            <CheckCircle className="h-3 w-3 text-green-600" />
          ) : (
            <XCircle className="h-3 w-3 text-red-600" />
          )}
          <span className={met ? "text-green-700" : "text-red-700"}>
            <strong>Cumplimiento:</strong> {percentage.toFixed(2)}%
            {met ? " ✅ Meta cumplida" : " ❌ No cumple meta"}
          </span>
        </div>
        <div className="text-gray-500 mt-0.5">
          Meta: {targetValue}% • Peso: {weight}% → Ponderado: {weighted.toFixed(2)}%
        </div>
      </div>
    );
  };

  const getSavedResults = (assignment) => {
    const tracking = trackingByAssignment[assignment.id];
    if (!tracking || tracking.achievement_percentage == null) return null;

    const met = tracking.target_met;
    return (
      <div className={`mt-2 p-2 rounded-lg text-xs ${met ? "bg-green-50 border border-green-200" : "bg-orange-50 border border-orange-200"}`}>
        <div className="flex items-center gap-1">
          {met ? (
            <CheckCircle className="h-3 w-3 text-green-600" />
          ) : (
            <AlertTriangle className="h-3 w-3 text-orange-600" />
          )}
          <span className={met ? "text-green-700 font-medium" : "text-orange-700 font-medium"}>
            {met ? "META CUMPLIDA" : "META NO CUMPLIDA"}
          </span>
          <span className="text-gray-500 ml-2">
            {tracking.achieved_value != null && tracking.achieved_total != null
              ? `${tracking.achieved_value} / ${tracking.achieved_total}`
              : `${tracking.achieved_value}%`}
          </span>
        </div>
        <div className="text-gray-500 mt-0.5">
          Cumplimiento: {Number(tracking.achievement_percentage).toFixed(2)}% • Ponderado: {Number(tracking.weighted_score).toFixed(2)}%
        </div>
      </div>
    );
  };

  const StatusBadge = ({ status }) => {
    const config = statusColors[status] || statusColors.PENDIENTE;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const getMonthStatus = (monthIndex) => {
    const monthNum = monthIndex + 1;
    const monthAssignments = assignments.filter(a => a.month === null || a.month === monthNum);
    if (monthAssignments.length === 0) return "none";

    let allComplete = true;
    let anyPending = false;
    let anyInReview = false;

    for (const a of monthAssignments) {
      const tracking = trackingByAssignment[a.id];
      if (!tracking || tracking.approval_status === "RECHAZADO") {
        anyPending = true;
        allComplete = false;
      } else if (tracking.approval_status === "EN_REVISION") {
        anyInReview = true;
        allComplete = false;
      } else if (tracking.approval_status !== "APROBADO") {
        anyPending = true;
        allComplete = false;
      }
    }

    if (allComplete) return "complete";
    if (anyPending) return "pending";
    if (anyInReview) return "in_review";
    return "pending";
  };

  const monthAssignments = useMemo(() =>
    assignments.filter(a => a.month === null || a.month === selectedMonth),
    [assignments, selectedMonth]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Paperclip className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Evaluación de KPIs</h1>
            <p className="text-sm text-gray-500">Sube tus evidencias y registra el valor alcanzado por cada indicador</p>
          </div>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
        >
          <option value={currentYear}>{currentYear}</option>
          <option value={currentYear - 1}>{currentYear - 1}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Selecciona el Mes</h2>
          <div className="grid grid-cols-3 gap-2">
            {months.map((m, i) => {
              const status = getMonthStatus(i);
              const statusConfig = {
                pending: { text: "text-amber-600", label: "⚠ pendiente" },
                in_review: { text: "text-blue-600", label: "🔄 revisión" },
                complete: { text: "text-green-600", label: "✓ completo" },
              };
              const config = statusConfig[status];
              return (
                <button
                  key={i}
                  onClick={() => setSelectedMonth(i + 1)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedMonth === i + 1
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-sm font-medium text-gray-700">{m}</div>
                  {config && (
                    <div className={`text-xs ${config.text} mt-1`}>{config.label}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {months[selectedMonth - 1]} {year}
            </h2>

            {assignmentsLoading ? (
              <p className="text-gray-500">Cargando...</p>
            ) : monthAssignments.length === 0 ? (
              <div className="text-center py-8">
                <Paperclip className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No hay indicadores asignados para este mes</p>
              </div>
            ) : (
              <div className="space-y-6">
                {monthAssignments.map((assignment) => {
                  const tracking = trackingByAssignment[assignment.id];
                  const evidences = tracking?.evidences || [];
                  const status = tracking?.approval_status || "PENDIENTE";
                  const rejectionComment = tracking?.rejection_comment;
                  const isBlocked = status === "APROBADO";
                  const isRejected = status === "RECHAZADO";
                  const isInReview = status === "EN_REVISION";
                  const key_error = `save_${assignment.id}`;

                  const currentVal = dirty[assignment.id]
                    ? (values[assignment.id] || {})
                    : {
                        achieved_value: tracking?.achieved_value ?? "",
                        achieved_total: tracking?.achieved_total ?? "",
                      };

                  const currentMode = inputMode[assignment.id] || (
                    tracking?.achieved_total != null ? "formula" : "exact"
                  );

                  const canSubmit = status === "PENDIENTE" || status === "RECHAZADO";

                  return (
                    <div key={assignment.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{assignment.indicator_name}</h3>
                            <p className="text-xs text-gray-500">
                              Meta: {assignment.target_value}% • Peso: {assignment.weight}%
                              {tracking?.achievement_percentage != null && (
                                <span className="ml-2 font-medium">
                                  • Resultado: {Number(tracking.achievement_percentage).toFixed(2)}%
                                  {tracking.target_met
                                    ? <span className="text-green-600"> ✅</span>
                                    : <span className="text-red-600"> ❌</span>
                                  }
                                </span>
                              )}
                            </p>
                          </div>
                          <StatusBadge status={status} />
                        </div>
                        {isRejected && rejectionComment && (
                          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
                            <p className="text-xs text-red-700"><strong>Motivo del rechazo:</strong> {rejectionComment}</p>
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-4">
                        {!isBlocked && !isInReview && (
                          <div className="p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="flex gap-2 mb-3">
                              <button
                                onClick={() => setInputMode(prev => ({ ...prev, [assignment.id]: "exact" }))}
                                className={`flex-1 px-3 py-1.5 text-xs rounded-lg border flex items-center justify-center gap-1 ${
                                  currentMode === "exact"
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                                }`}
                              >
                                <Percent className="h-3 w-3" />
                                Valor exacto
                              </button>
                              <button
                                onClick={() => setInputMode(prev => ({ ...prev, [assignment.id]: "formula" }))}
                                className={`flex-1 px-3 py-1.5 text-xs rounded-lg border flex items-center justify-center gap-1 ${
                                  currentMode === "formula"
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                                }`}
                              >
                                <Divide className="h-3 w-3" />
                                Fórmula (división)
                              </button>
                            </div>

                            <div className={currentMode === "formula" ? "grid grid-cols-1 sm:grid-cols-3 gap-3 items-end" : "grid grid-cols-1 sm:grid-cols-2 gap-3 items-end"}>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  {currentMode === "exact" ? "Valor logrado (%)" : "Valor logrado"}
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder={currentMode === "exact" ? "Ej: 85" : "Ej: 950"}
                                  value={currentVal.achieved_value ?? ""}
                                  onChange={(e) => {
                                    setDirty(prev => ({ ...prev, [assignment.id]: true }));
                                    setValues(prev => ({
                                      ...prev,
                                      [assignment.id]: { ...prev[assignment.id], achieved_value: e.target.value }
                                    }));
                                  }}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              {currentMode === "formula" && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Total</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Ej: 1000"
                                    value={currentVal.achieved_total ?? ""}
                                    onChange={(e) => {
                                      setDirty(prev => ({ ...prev, [assignment.id]: true }));
                                      setValues(prev => ({
                                        ...prev,
                                        [assignment.id]: { ...prev[assignment.id], achieved_total: e.target.value }
                                      }));
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              )}
                              <div>
                                <button
                                  onClick={() => validateAndSave(assignment.id)}
                                  disabled={saving[assignment.id]}
                                  className="flex items-center justify-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 w-full"
                                >
                                  <Save className="h-4 w-4" />
                                  {saving[assignment.id] ? "Guardando..." : "Guardar valor"}
                                </button>
                              </div>
                            </div>

                            {errorMsg[key_error] && (
                              <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                <XCircle className="h-3 w-3" />
                                {errorMsg[key_error]}
                              </p>
                            )}

                            {getLivePreview(assignment)}
                          </div>
                        )}

                        {tracking?.achievement_percentage != null && !dirty[assignment.id] && getSavedResults(assignment)}

                        {!isBlocked && (
                          <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg">
                            <input
                              type="file"
                              accept="application/pdf,image/png,image/jpeg"
                              onChange={(e) => {
                                setUploadFile(prev => ({ ...prev, [assignment.id]: e.target.files[0] }));
                                setErrorMsg(prev => ({ ...prev, [assignment.id]: null }));
                              }}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {uploadFile[assignment.id] && (
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-sm text-gray-700 truncate max-w-[60%]">{uploadFile[assignment.id].name}</span>
                                <button
                                  onClick={() => handleUpload(assignment.id)}
                                  disabled={uploading[assignment.id]}
                                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                  <Upload className="h-4 w-4 inline mr-1" />
                                  {uploading[assignment.id] ? "Subiendo..." : "Subir"}
                                </button>
                              </div>
                            )}
                            {errorMsg[assignment.id] && (
                              <p className="mt-1 text-xs text-red-600">{errorMsg[assignment.id]}</p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-700">
                            Evidencias ({evidences.length})
                          </h4>
                          {canSubmit && (
                            <button
                              onClick={() => handleSubmit(assignment.id)}
                              disabled={submitting[assignment.id]}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              <Send className="h-3 w-3" />
                              {submitting[assignment.id] ? "Enviando..." : "Enviar a revisión"}
                            </button>
                          )}
                        </div>

                        {evidences.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-1">Sin evidencias aún</p>
                        ) : (
                          <div className="space-y-1">
                            {evidences.map((ev) => (
                              <div key={ev.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 min-w-0">
                                  {getFileIcon(ev.file_path)}
                                  <a
                                    href={`${backendUrl}${ev.file_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline truncate"
                                  >
                                    {ev.original_filename || ev.file_path.split("/").pop()}
                                  </a>
                                  {ev.file_size && (
                                    <span className="text-xs text-gray-400 shrink-0">
                                      ({(ev.file_size / 1024).toFixed(1)} KB)
                                    </span>
                                  )}
                                </div>
                                {!isBlocked && (
                                  <button
                                    onClick={() => deleteMutation.mutate(ev.id)}
                                    disabled={deleteMutation.isPending}
                                    className="text-red-500 hover:text-red-700 shrink-0"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
