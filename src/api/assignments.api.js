import api from "./client";

export const getAssignments = (year, month) => {
  let params = year ? `?year=${year}` : "";
  if (month) {
    params += params ? `&month=${month}` : `?month=${month}`;
  }
  return api.get(`/assignments/${params}`);
};

export const getUserAssignments = (userId, year, month) => {
  let params = `?user_id=${userId}&year=${year}`;
  if (month) params += `&month=${month}`;
  return api.get(`/assignments/${params}`);
};

export const createAssignment = (data) =>
  api.post("/assignments/", data);

export const updateAssignment = (id, data) =>
  api.patch(`/assignments/${id}`, data);

export const deleteAssignment = (id) =>
  api.delete(`/assignments/${id}`);

export const importAssignmentsExcel = (file, year, month = null) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("year", year);
  if (month != null && month !== undefined) formData.append("month", month);

  return api.post("/assignments/import-excel", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const cloneFromPreviousMonth = (year, month) =>
  api.post(`/assignments/clone-previous-month?year=${year}&month=${month}`);