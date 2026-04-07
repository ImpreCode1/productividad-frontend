import api from "./client";

export const createActionPlan = (trackingId, data) =>
  api.post(`/action-plan/${trackingId}`, data);

export const getActionPlans = (trackingId) =>
  api.get(`/action-plan/${trackingId}`);

export const updateActionPlan = (id, data) =>
  api.patch(`/action-plan/${id}`, data);