import api from "./client";

export const getUsers = () => api.get("/users/");
export const getMe = () => api.get("/users/me");
export const getUser = (id) => api.get(`/users/${id}`);

export const changeUserStatus = (id, is_active) =>
  api.patch(`/users/${id}/status`, { is_active });

export const assignLeader = (id, leader_id) =>
  api.patch(`/users/${id}/leader`, { leader_id });

export const importUsersExcel = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/users/import-excel", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateUser = (id, data) => api.patch(`/users/${id}`, data);