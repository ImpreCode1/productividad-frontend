import api from "./client";

export const getApprovalConfigs = (configType) => {
  const params = {};
  if (configType) params.config_type = configType;
  return api.get("/approval-config/", { params });
};

export const createApprovalConfig = (data) =>
  api.post("/approval-config/", data);

export const updateApprovalConfig = (id, data) =>
  api.patch(`/approval-config/${id}`, data);

export const deleteApprovalConfig = (id) =>
  api.delete(`/approval-config/${id}`);

export const checkLoadMode = (userId) =>
  api.get(`/approval-config/check/${userId}`);
