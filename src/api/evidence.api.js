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
  formData.append("year", String(year));
  formData.append("month", String(month));
  if (targetUserId) {
    formData.append("target_user_id", String(targetUserId));
  }

  return api.post(`/evidence/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getEvidence = (trackingId) =>
  api.get(`/evidence/${trackingId}`);

export const getEvidencesByMonth = (year, month, targetUserId) => {
  const params = { year, month };
  if (targetUserId) {
    params.target_user_id = targetUserId;
  }
  return api.get(`/evidence/`, { params });
};

export const deleteEvidence = (id) =>
  api.delete(`/evidence/${id}`);