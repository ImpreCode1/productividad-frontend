import { useQuery } from "@tanstack/react-query";
import * as positionGroupsApi from "../../../api/positionGroups.api";

export function usePositionGroupsTree() {
  return useQuery({
    queryKey: ["positionGroups", "tree"],
    queryFn: async () => {
      const { data } = await positionGroupsApi.getPositionGroupsTree();
      return data;
    },
  });
}
