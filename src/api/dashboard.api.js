import api from "./client";

export const getMyDashboard = (year) =>
  api.get(`/dashboard/me?year=${year}`);

export const getUserDashboard = (userId, year) =>
  api.get(`/dashboard/user/${userId}?year=${year}`);

export const getTeamDashboard = (year) =>
  api.get(`/dashboard/team?year=${year}`);

export const getGlobalDashboard = (year, month = null, area = null) => {
  const params = new URLSearchParams({ year });
  if (month) params.append("month", month);
  if (area) params.append("area", area);
  return api.get(`/dashboard/global?${params.toString()}`);
};