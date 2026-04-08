import api from "./client";

export const getMyTracking = (year) => api.get(`/tracking/me?year=${year}`);

export const getTracking = (userId, year) => 
  api.get(`/tracking/?user_id=${userId}&year=${year}`);

export const getTrackingById = (id) =>
  api.get(`/tracking/${id}`);

export const updateTracking = (id, data) =>
  api.patch(`/tracking/${id}`, data);

export const closeTracking = (id) =>
  api.patch(`/tracking/${id}/close`);