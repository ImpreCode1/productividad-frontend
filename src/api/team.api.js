import api from "./client";

export const getTeamMembers = () => api.get("/team/members");

export const getTeamDashboard = (year) => api.get(`/dashboard/team?year=${year}`);
