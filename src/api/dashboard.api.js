import api from "./client";

export const getUserDashboard = (userId) =>
  api.get(`/dashboard/user/${userId}`);

export const getTeamDashboard = () =>
  api.get("/dashboard/team");