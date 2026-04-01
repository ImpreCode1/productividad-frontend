import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTeamEvidences, reviewEvidence } from "../../../api/evidence.api";
import { useAuth } from "../../../hooks/useAuth";

export default function TeamReviewPage() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();

  const { data: evidences = [], isLoading, error } = useQuery({
    queryKey: ["team-evidences"],
    queryFn: fetchTeamEvidences,
    enabled: hasRole("LEADER") || hasRole("ADMIN"),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ evidenceId, status }) => reviewEvidence(evidenceId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-evidences"] });
    },
  });

  const handleReview = (evidenceId, status) => {
    reviewMutation.mutate({ evidenceId, status });
  };

  if (isLoading) {
    return <div className="text-gray-500">Cargando evidencias del equipo...</div>;
  }

  if (!hasRole("LEADER") && !hasRole("ADMIN")) {
    return (
      <div className="text-gray-500">
        No tienes acceso a esta página. Solo líderes pueden revisar evidencias del equipo.
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Revisión de Evidencias del Equipo
      </h1>

      {evidences.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No hay evidencias pendientes de revisión</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Indicador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Evidencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {evidences.map((evidence) => (
                <tr key={evidence.id}>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {evidence.indicator_name || "Indicador"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {evidence.uploaded_by_name || "Usuario"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <a
                      href={evidence.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Ver archivo
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(evidence.uploaded_at).toLocaleDateString("es")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        evidence.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : evidence.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {evidence.status === "pending"
                        ? "Pendiente"
                        : evidence.status === "approved"
                        ? "Aprobado"
                        : "Rechazado"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {evidence.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(evidence.id, "approved")}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleReview(evidence.id, "rejected")}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Rechazar
                        </button>
                      </div>
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
}
