import api from "./client";

export const fetchOrganizationUnits = () =>
  api.get("/organization-units").then((res) => res.data.units);

export const fetchOrganizationUnit = (unitId) =>
  api.get(`/organization-units/${unitId}`).then((res) => res.data);

export const fetchOrganizationTree = () =>
  api.get("/organization-units/tree").then((res) => res.data);

export const createOrganizationUnit = (data) =>
  api.post("/organization-units", data).then((res) => res.data);

export const updateOrganizationUnit = (unitId, data) =>
  api.patch(`/organization-units/${unitId}`, data).then((res) => res.data);

export const deleteOrganizationUnit = (unitId) =>
  api.delete(`/organization-units/${unitId}`).then((res) => res.data);
