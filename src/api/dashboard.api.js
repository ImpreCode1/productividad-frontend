import api from "./client";

export const getMyDashboard = (year) =>
  api.get(`/dashboard/me?year=${year}`);

export const getUserDashboard = (userId, year) =>
  api.get(`/dashboard/user/${userId}?year=${year}`);

export const getTeamDashboard = (year) =>
  api.get(`/dashboard/team?year=${year}`);