import api from "./client";

export const uploadEvidence = (trackingId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post(`/evidence/${trackingId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadEvidenceToMonth = (year, month, targetUserId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("year", year);
  formData.append("month", month);
  if (targetUserId) {
    formData.append("target_user_id", targetUserId);
  }

  return api.post(`/evidence/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    params: { year, month },
  });
};

export const getEvidence = (trackingId) =>
  api.get(`/evidence/${trackingId}`);

export const deleteEvidence = (id) =>
  api.delete(`/evidence/${id}`);