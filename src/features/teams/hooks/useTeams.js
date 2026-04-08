import { useQuery } from "@tanstack/react-query";
import api from "../../../api/client";

export function useAllTeams() {
  return useQuery({
    queryKey: ["teams", "all"],
    queryFn: async () => {
      const { data } = await api.get("/team/all");
      return data.teams;
    },
  });
}

export function useTeamMembers(userId) {
  return useQuery({
    queryKey: ["team", userId],
    queryFn: async () => {
      const { data } = await api.get(`/team/${userId}/members`);
      return data.members;
    },
    enabled: !!userId,
  });
}