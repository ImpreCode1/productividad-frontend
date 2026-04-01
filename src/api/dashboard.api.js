import api from "./client";

export const fetchUserDashboard = (userId, month) =>
  api.get("/dashboard/user", { params: { user_id: userId, month } });

export const fetchLeaderDashboard = (leaderId, month) =>
  api.get("/dashboard/leader", { params: { leader_id: leaderId, month } });

export const fetchOrganizationDashboard = (month) =>
  api.get("/dashboard/organization", { params: { month } });
