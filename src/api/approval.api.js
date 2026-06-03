import api from "./client";

export const submitTracking = (trackingId, reason_not_met = null, action_plan = null) => {
  const payload = {};
  if (reason_not_met != null) payload.reason_not_met = reason_not_met;
  if (action_plan != null) payload.action_plan = action_plan;
  return api.patch(`/tracking/${trackingId}/submit`, payload);
};

export const submitAssignment = (assignmentId, reason_not_met = null, action_plan = null) => {
  const payload = {};
  if (reason_not_met != null) payload.reason_not_met = reason_not_met;
  if (action_plan != null) payload.action_plan = action_plan;
  return api.post(`/tracking/assignment/${assignmentId}/submit`, payload);
};

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
