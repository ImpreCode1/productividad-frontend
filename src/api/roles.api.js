import api from "./client";

export const getRoles = () => api.get("/roles/");

export const createRole = (data) =>
  api.post("/roles/", data);

export const updateRole = (id, data) =>
  api.patch(`/roles/${id}`, data);

export const deleteRole = (id) =>
  api.delete(`/roles/${id}`);

export const assignRolesToUser = (userId, roleIds) =>
  api.patch(`/roles/users/${userId}`, { role_ids: roleIds });