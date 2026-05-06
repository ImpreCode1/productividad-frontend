import { useQuery } from "@tanstack/react-query";
import api from "../../../api/client";

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team", "members"],
    queryFn: async () => {
      const { data } = await api.get("/team/members");
      return data.members;
    },
  });
}

export function useTeamDashboard(year) {
  return useQuery({
    queryKey: ["team", "dashboard", year],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/team?year=${year}`);
      return data;
    },
    enabled: !!year,
  });
}
