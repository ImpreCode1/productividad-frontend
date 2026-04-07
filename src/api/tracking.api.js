import api from "./client";

export const getTracking = () => api.get("/tracking/");

export const getTrackingById = (id) =>
  api.get(`/tracking/${id}`);

export const updateTracking = (id, data) =>
  api.patch(`/tracking/${id}`, data);

export const closeTracking = (id) =>
  api.patch(`/tracking/${id}/close`);