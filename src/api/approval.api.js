import api from "./client";

export const submitTracking = (trackingId) =>
  api.patch(`/tracking/${trackingId}/submit`);

export const submitAssignment = (assignmentId) =>
  api.post(`/tracking/assignment/${assignmentId}/submit`);

export const approveTracking = (trackingId) =>
  api.patch(`/tracking/${trackingId}/approve`);

export const rejectTracking = (trackingId, comment) =>
  api.patch(`/tracking/${trackingId}/reject`, { comment });

export const uploadEvidenceToTracking = (trackingId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/evidence/tracking/${trackingId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadEvidenceToAssignment = (assignmentId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/evidence/assignment/${assignmentId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getEvidenceByTracking = (trackingId) =>
  api.get(`/evidence/${trackingId}`);

export const setTrackingValue = (assignmentId, achievedValue, achievedTotal = null) => {
  const payload = { achieved_value: achievedValue };
  if (achievedTotal != null) payload.achieved_total = achievedTotal;
  return api.patch(`/evidence/assignment/${assignmentId}/value`, payload);
};
