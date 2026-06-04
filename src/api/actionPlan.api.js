import api from "./client";

export const getActionPlans = (trackingId) =>
  api.get(`/action-plan/${trackingId}`).then((r) => r.data.action_plans);

export const getTeamActionPlans = (leaderId, year) =>
  api.get(`/action-plan/team/${leaderId}/${year}`).then((r) => r.data.action_plans);

export const getMyActionPlans = (year) =>
  api.get(`/action-plan/me/${year}`).then((r) => r.data.action_plans);

export const createActionPlan = (trackingId, data) =>
  api.post(`/action-plan/${trackingId}`, data).then((r) => r.data);

export const updateActionPlan = (actionPlanId, data) =>
  api.patch(`/action-plan/${actionPlanId}`, data).then((r) => r.data);

export const importActionPlansExcel = (file, year, month) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("year", String(year));
  formData.append("month", String(month));

  return api.post("/action-plan/import-excel", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};