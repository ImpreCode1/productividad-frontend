import api from "./client";

export const fetchPositionIndicators = () =>
  api.get("/position-indicators").then((res) => res.data.position_indicators);

export const fetchPositionIndicator = (piId) =>
  api.get(`/position-indicators/${piId}`).then((res) => res.data);

export const createPositionIndicator = (data) =>
  api.post("/position-indicators", data).then((res) => res.data);

export const updatePositionIndicator = (piId, data) =>
  api.patch(`/position-indicators/${piId}`, data).then((res) => res.data);

export const deletePositionIndicator = (piId) =>
  api.delete(`/position-indicators/${piId}`).then((res) => res.data);
