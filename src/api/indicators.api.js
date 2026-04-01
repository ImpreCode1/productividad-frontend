import api from "./client";

export const fetchIndicators = () =>
  api.get("/indicators").then((res) => res.data.indicators);

export const fetchIndicator = (indicatorId) =>
  api.get(`/indicators/${indicatorId}`).then((res) => res.data);

export const createIndicator = (data) =>
  api.post("/indicators", data).then((res) => res.data);

export const updateIndicator = (indicatorId, data) =>
  api.patch(`/indicators/${indicatorId}`, data).then((res) => res.data);

export const deleteIndicator = (indicatorId) =>
  api.delete(`/indicators/${indicatorId}`).then((res) => res.data);
