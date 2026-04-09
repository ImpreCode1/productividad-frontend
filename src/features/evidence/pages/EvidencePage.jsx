import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Upload, Trash2, FileText, Image, File } from "lucide-react";
import * as trackingApi from "../../../api/tracking.api";
import * as evidenceApi from "../../../api/evidence.api";

const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function EvidencePage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

  const { data: trackingData, isLoading: trackingLoading } = useQuery({
    queryKey: ["myTracking", currentYear],
    queryFn: () => trackingApi.getMyTracking(currentYear),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ year, month, file }) => evidenceApi.uploadEvidenceToMonth(year, month, null, file),
    onSuccess: () => {
      setUploadFile(null);
      queryClient.invalidateQueries(["myTracking"]);
    },
    onError: (error) => {
      const message = error.response?.data?.detail || "Error al subir evidencia";
      alert(message);
    },
    onSettled: () => setUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: (evidenceId) => evidenceApi.deleteEvidence(evidenceId),
    onSuccess: () => {
      queryClient.invalidateQueries(["myTracking"]);
    },
    onError: (error) => {
      const message = error.response?.data?.detail || "Error al eliminar evidencia";
      alert(message);
    },
  });

  const handleUpload = () => {
    if (selectedMonth && uploadFile) {
      setUploading(true);
      uploadMutation.mutate({ year: currentYear, month: selectedMonth, file: uploadFile });
    }
  };

  const trackingList = trackingData?.data?.tracking || [];

  const getFileIcon = (path) => {
    if (!path) return <File size={16} />;
    const ext = path.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png"].includes(ext)) return <Image size={16} />;
    if (ext === "pdf") return <FileText size={16} />;
    return <File size={16} />;
  };

  const getEvidencesForMonth = (month) => {
    const monthTrackings = trackingList.filter(t => t.month === month);
    const allEvidence = [];
    monthTrackings.forEach(t => {
      if (t.evidences) {
        t.evidences.forEach(e => allEvidence.push(e));
      }
    });
    return allEvidence;
  };

  const currentMonthEvidence = getEvidencesForMonth(selectedMonth);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Paperclip className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          Evidencias
        </h1>
        <span className="text-sm text-gray-500 ml-auto">
          Año {currentYear}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Selecciona el Mes
          </h2>
          
          <div className="grid grid-cols-3 gap-2">
            {months.map((m, i) => {
              const monthTrackings = trackingList.filter(t => t.month === i + 1);
              const hasEvidence = monthTrackings.some(t => t.evidence_count > 0);
              
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
                  <div className="text-xs text-gray-500 mt-1">
                    {monthTrackings.length} indicadores
                  </div>
                  {hasEvidence && (
                    <div className="text-xs text-green-600 mt-1">
                      ✓ con evidencia
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {months[selectedMonth - 1]} - Subir Evidencia
          </h2>
          
          <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Upload size={18} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                Subir evidencia (PDF, PNG, JPG)
              </span>
            </div>
            <p className="text-xs text-green-600 mb-2">
              La evidencia se subirá a TODOS los indicadores del mes
            </p>
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploadFile && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-700">{uploadFile.name}</span>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {uploading ? "Subiendo..." : "Subir a todo el mes"}
                </button>
              </div>
            )}
          </div>

          <h3 className="text-md font-semibold text-gray-800 mb-2 mt-4">
            Evidencias de {months[selectedMonth - 1]}
          </h3>
          
          {trackingLoading ? (
            <p className="text-gray-500">Cargando...</p>
          ) : currentMonthEvidence.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No hay evidencias para este mes
            </p>
          ) : (
            <div className="space-y-2">
              {currentMonthEvidence.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(ev.file_path)}
                    <a
                      href={`${backendUrl}${ev.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {ev.file_path.split("/").pop()}
                    </a>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(ev.id)}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}