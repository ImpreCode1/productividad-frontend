import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Upload, Trash2, FileText, Image, File } from "lucide-react";
import * as trackingApi from "../../../api/tracking.api";
import * as evidenceApi from "../../../api/evidence.api";

const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function EvidencePage() {
  const [selectedTracking, setSelectedTracking] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

  const { data: trackingData, isLoading: trackingLoading } = useQuery({
    queryKey: ["myTracking", currentYear],
    queryFn: () => trackingApi.getMyTracking(currentYear),
  });

  const { data: evidenceData, isLoading: evidenceLoading, refetch: refetchEvidence } = useQuery({
    queryKey: ["evidence", selectedTracking],
    queryFn: () => selectedTracking ? evidenceApi.getEvidence(selectedTracking) : Promise.resolve({ data: { evidence: [] } }),
    enabled: !!selectedTracking,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ trackingId, file }) => evidenceApi.uploadEvidence(trackingId, file),
    onSuccess: () => {
      setUploadFile(null);
      refetchEvidence();
      queryClient.invalidateQueries(["myTracking"]);
    },
    onError: (error) => {
      const message = error.response?.data?.detail || "Error al subir evidencia";
      alert(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (evidenceId) => evidenceApi.deleteEvidence(evidenceId),
    onSuccess: () => refetchEvidence(),
    onError: (error) => {
      const message = error.response?.data?.detail || "Error al eliminar evidencia";
      alert(message);
    },
  });

  const handleUpload = () => {
    if (selectedTracking && uploadFile) {
      uploadMutation.mutate({ trackingId: selectedTracking, file: uploadFile });
    }
  };

  const trackingList = trackingData?.data?.tracking || [];
  const evidenceList = evidenceData?.data?.evidence || [];

  const getFileIcon = (path) => {
    if (!path) return <File size={16} />;
    const ext = path.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png"].includes(ext)) return <Image size={16} />;
    if (ext === "pdf") return <FileText size={16} />;
    return <File size={16} />;
  };

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
            Mis Seguimientos
          </h2>
          {trackingLoading ? (
            <p className="text-gray-500">Cargando...</p>
          ) : trackingList.length === 0 ? (
            <p className="text-gray-500">No hay seguimientos para este año.</p>
          ) : (
            <div className="space-y-2">
              {trackingList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedTracking(item.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedTracking === item.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">
                      {months[item.month - 1]}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.is_closed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {item.is_closed ? "Cerrado" : "Abierto"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.indicator_name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Evidencias del Mes
          </h2>
          
          {!selectedTracking ? (
            <p className="text-gray-500 text-center py-8">
              Selecciona un seguimiento para ver sus evidencias
            </p>
          ) : (
            <>
              <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Upload size={18} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Subir evidencia (PDF, PNG, JPG)
                  </span>
                </div>
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
                      disabled={uploadMutation.isPending}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploadMutation.isPending ? "Subiendo..." : "Subir"}
                    </button>
                  </div>
                )}
              </div>

              {evidenceLoading ? (
                <p className="text-gray-500">Cargando...</p>
              ) : evidenceList.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay evidencias para este seguimiento
                </p>
              ) : (
                <div className="space-y-2">
                  {evidenceList.map((ev) => (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}