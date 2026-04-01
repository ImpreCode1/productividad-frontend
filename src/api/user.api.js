import api from "./client";

export const fetchUsers = () =>
  api.get("/users").then((res) => res.data.users);

export const fetchUser = (userId) =>
  api.get(`/users/${userId}`).then((res) => res.data);

export const changeUserStatus = (userId, isActive) =>
  api.patch(`/users/${userId}/status`, { is_active: isActive }).then((res) => res.data);

export const assignUserRoles = (userId, roleIds) =>
  api.patch(`/users/${userId}/roles`, { role_ids: roleIds }).then((res) => res.data);

export const assignUserLeader = (userId, leaderId) =>
  api.patch(`/users/${userId}/leader`, { leader_id: leaderId }).then((res) => res.data);

export const changeUserPosition = (userId, positionId) =>
  api.patch(`/users/${userId}/position`, { position_id: positionId }).then((res) => res.data);
