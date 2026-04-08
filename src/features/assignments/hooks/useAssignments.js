import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as assignmentsApi from "../../../api/assignments.api";

export function useAssignments(year) {
  return useQuery({
    queryKey: ["assignments", year],
    queryFn: async () => {
      const { data } = await assignmentsApi.getAssignments(year);
      return data.assignments;
    },
    enabled: !!year,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => assignmentsApi.createAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => assignmentsApi.updateAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => assignmentsApi.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useImportAssignments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, year }) => assignmentsApi.importAssignmentsExcel(file, year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}