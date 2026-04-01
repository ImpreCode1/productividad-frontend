import api from "./client";

export const fetchPositions = () =>
  api.get("/positions").then((res) => res.data.positions);

export const fetchPosition = (positionId) =>
  api.get(`/positions/${positionId}`).then((res) => res.data);

export const createPosition = (data) =>
  api.post("/positions", data).then((res) => res.data);

export const updatePosition = (positionId, data) =>
  api.patch(`/positions/${positionId}`, data).then((res) => res.data);

export const deletePosition = (positionId) =>
  api.delete(`/positions/${positionId}`).then((res) => res.data);
