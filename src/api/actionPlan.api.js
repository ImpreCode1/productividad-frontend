import api from "./client";

export const getActionPlans = (trackingId) =>
  api.get(`/action-plan/${trackingId}`).then((r) => r.data.action_plans);

export const getTeamActionPlans = (leaderId, year) =>
  api.get(`/action-plan/team/${leaderId}/${year}`).then((r) => r.data.action_plans);

export const createActionPlan = (trackingId, data) =>
  api.post(`/action-plan/${trackingId}`, data).then((r) => r.data);

export const updateActionPlan = (actionPlanId, data) =>
  api.patch(`/action-plan/${actionPlanId}`, data).then((r) => r.data);