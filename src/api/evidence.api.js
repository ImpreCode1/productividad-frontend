import api from "./client";

export const fetchEvidences = () =>
  api.get("/evidences").then((res) => res.data);

export const fetchEvidence = (evidenceId) =>
  api.get(`/evidences/${evidenceId}`).then((res) => res.data);

export const createEvidence = (data) =>
  api.post("/evidences", data).then((res) => res.data);

export const deleteEvidence = (evidenceId) =>
  api.delete(`/evidences/${evidenceId}`).then((res) => res.data);
