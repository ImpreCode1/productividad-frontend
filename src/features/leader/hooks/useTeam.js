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

export function useTeamDashboard(year, month = null) {
  return useQuery({
    queryKey: ["team", "dashboard", year, month],
    queryFn: async () => {
      const params = new URLSearchParams({ year: year.toString() });
      if (month && month !== 0) {
        params.append("month", month.toString());
      }
      const { data } = await api.get(`/dashboard/team?${params}`);
      return data;
    },
    enabled: !!year,
  });
}
