import api from "./client";

export const getAssignments = (year) => {
  const params = year ? `?year=${year}` : "";
  return api.get(`/assignments/${params}`);
};

export const getUserAssignments = (userId, year) =>
  api.get(`/assignments/?user_id=${userId}&year=${year}`);

export const createAssignment = (data) =>
  api.post("/assignments/", data);

export const updateAssignment = (id, data) =>
  api.patch(`/assignments/${id}`, data);

export const deleteAssignment = (id) =>
  api.delete(`/assignments/${id}`);

export const importAssignmentsExcel = (file, year) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("year", year);

  return api.post("/assignments/import-excel", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};