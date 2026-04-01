import api from "./client";

export const fetchEvidences = () =>
  api.get("/evidences").then((res) => res.data);

export const fetchMyEvidences = () =>
  api.get("/evidences/my-evidences").then((res) => res.data);

export const fetchTeamEvidences = () =>
  api.get("/evidences/team-evidences").then((res) => res.data);

export const fetchEvidence = (evidenceId) =>
  api.get(`/evidences/${evidenceId}`).then((res) => res.data);

export const createEvidence = (data) =>
  api.post("/evidences", data).then((res) => res.data);

export const reviewEvidence = (evidenceId, status) =>
  api.patch(`/evidences/${evidenceId}/review`, { status }).then((res) => res.data);

export const deleteEvidence = (evidenceId) =>
  api.delete(`/evidences/${evidenceId}`).then((res) => res.data);
