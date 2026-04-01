import api from "./client";

export const fetchActionPlans = () =>
  api.get("/action-plans").then((res) => res.data);

export const fetchActionPlan = (planId) =>
  api.get(`/action-plans/${planId}`).then((res) => res.data);

export const createActionPlan = (data) =>
  api.post("/action-plans", data).then((res) => res.data);

export const updateActionPlan = (planId, data) =>
  api.patch(`/action-plans/${planId}`, data).then((res) => res.data);
