import api from "./client";

export const getPositionGroupsTree = () => api.get("/position-groups/tree");
