import api from "./client";

export const fetchTracking = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.userId) queryParams.append("user_id", params.userId);
  if (params.month) queryParams.append("month", params.month);
  if (params.year) queryParams.append("year", params.year);
  if (params.positionIndicatorId)
    queryParams.append("position_indicator_id", params.positionIndicatorId);

  const query = queryParams.toString();
  return api.get(`/indicator-tracking${query ? `?${query}` : ""}`).then((res) => res.data);
};

export const fetchTrackingById = (trackingId) =>
  api.get(`/indicator-tracking/${trackingId}`).then((res) => res.data);

export const createTracking = (data) =>
  api.post("/indicator-tracking", data).then((res) => res.data);

export const updateTracking = (trackingId, achievedValue) =>
  api.patch(`/indicator-tracking/${trackingId}`, { achieved_value: achievedValue }).then((res) => res.data);
