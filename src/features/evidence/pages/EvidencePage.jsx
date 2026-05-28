import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Upload, Trash2, FileText, Image, File, Send, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
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
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: trackingData, isLoading: trackingLoading } = useQuery({
    queryKey: ["myTracking", year],
    queryFn: () => trackingApi.getMyTracking(year),
  });

  const trackingList = trackingData?.data?.tracking || [];
  const monthTrackings = trackingList.filter(t => t.month === selectedMonth);

  const groupedByIndicator = monthTrackings.reduce((acc, t) => {
    const assignmentId = t.assignment_id;
    if (!acc[assignmentId]) {
      acc[assignmentId] = {
        assignment_id: assignmentId,
        indicator_name: t.indicator_name || "Indicador",
        target_value: t.target_value,
        weight: t.weight,
        trackings: [],
      };
    }
    acc[assignmentId].trackings.push(t);
    return acc;
  }, {});

  const uploadMutation = useMutation({
    mutationFn: ({ trackingId, file }) => approvalApi.uploadEvidenceToTracking(trackingId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTracking", year] });
      setUploadFile({});
    },
    onError: (error) => {
      alert(error.response?.data?.detail || "Error al subir evidencia");
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

  const handleUpload = (trackingId) => {
    const file = uploadFile[trackingId];
    if (!file) return;
    setUploading(prev => ({ ...prev, [trackingId]: true }));
    uploadMutation.mutate({ trackingId, file });
  };

  const getFileIcon = (path) => {
    if (!path) return <File size={16} />;
    const ext = path.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png"].includes(ext)) return <Image size={16} />;
    if (ext === "pdf") return <FileText size={16} />;
    return <File size={16} />;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Paperclip className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Evidencias</h1>
            <p className="text-sm text-gray-500">Sube evidencias por cada KPI mensual</p>
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
              const hasData = trackingList.some(t => t.month === i + 1 && (t.achieved_value != null || t.evidence_count > 0));
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
                  {hasData && (
                    <div className="text-xs text-green-600 mt-1">✓ datos</div>
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

            {trackingLoading ? (
              <p className="text-gray-500">Cargando...</p>
            ) : Object.keys(groupedByIndicator).length === 0 ? (
              <div className="text-center py-8">
                <Paperclip className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No hay indicadores asignados para este mes</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.values(groupedByIndicator).map((group) => {
                  const trackingId = group.trackings[0]?.id;
                  const evidences = group.trackings[0]?.evidences || [];
                  const status = group.trackings[0]?.approval_status || "PENDIENTE";
                  const rejectionComment = group.trackings[0]?.rejection_comment;
                  const isBlocked = status === "APROBADO";
                  const isRejected = status === "RECHAZADO";

                  return (
                    <div key={group.assignment_id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{group.indicator_name}</h3>
                            <p className="text-xs text-gray-500">
                              Meta: {group.target_value}% • Peso: {group.weight}%
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

                      <div className="p-4">
                        {!isBlocked && (
                          <div className="mb-4 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                            <input
                              type="file"
                              accept="application/pdf,image/png,image/jpeg"
                              onChange={(e) => setUploadFile(prev => ({ ...prev, [trackingId]: e.target.files[0] }))}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {uploadFile[trackingId] && (
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-sm text-gray-700">{uploadFile[trackingId].name}</span>
                                <button
                                  onClick={() => handleUpload(trackingId)}
                                  disabled={uploading[trackingId]}
                                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                  <Upload className="h-4 w-4 inline mr-1" />
                                  {uploading[trackingId] ? "Subiendo..." : "Subir"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Evidencias ({evidences.length})
                        </h4>
                        {evidences.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-3">Sin evidencias aún</p>
                        ) : (
                          <div className="space-y-1">
                            {evidences.map((ev) => (
                              <div key={ev.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  {getFileIcon(ev.file_path)}
                                  <a
                                    href={`${backendUrl}${ev.file_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    {ev.original_filename || ev.file_path.split("/").pop()}
                                  </a>
                                  {ev.file_size && (
                                    <span className="text-xs text-gray-400">
                                      ({(ev.file_size / 1024).toFixed(1)} KB)
                                    </span>
                                  )}
                                </div>
                                {!isBlocked && (
                                  <button
                                    onClick={() => deleteMutation.mutate(ev.id)}
                                    disabled={deleteMutation.isPending}
                                    className="text-red-500 hover:text-red-700"
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
