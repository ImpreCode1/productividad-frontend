import api from "./client";

export const fetchUserDashboard = (month) =>
  api.get("/dashboard/user", { params: { month } }).then((r) => r.data);

export const fetchLeaderDashboard = (month) =>
  api.get("/dashboard/leader", { params: { month } }).then((r) => r.data);

export const fetchOrganizationDashboard = (month) =>
  api.get("/dashboard/organization", { params: { month } }).then((r) => r.data);