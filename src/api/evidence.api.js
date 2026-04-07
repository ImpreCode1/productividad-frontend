import api from "./client";

export const uploadEvidence = (trackingId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post(`/evidence/${trackingId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getEvidence = (trackingId) =>
  api.get(`/evidence/${trackingId}`);

export const deleteEvidence = (id) =>
  api.delete(`/evidence/${id}`);