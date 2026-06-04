import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as assignmentsApi from "../../../api/assignments.api";
import * as actionPlanApi from "../../../api/actionPlan.api";

export function useAssignments(year, month) {
  return useQuery({
    queryKey: ["assignments", year, month],
    queryFn: async () => {
      const { data } = await assignmentsApi.getAssignments(year, month);
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
    mutationFn: ({ file, year, month }) => assignmentsApi.importAssignmentsExcel(file, year, month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useCloneFromPreviousMonth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ year, month }) => assignmentsApi.cloneFromPreviousMonth(year, month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useImportActionPlans() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, year, month }) => actionPlanApi.importActionPlansExcel(file, year, month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}