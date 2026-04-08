import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "../../../api/users.api";
import * as rolesApi from "../../../api/roles.api";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await usersApi.getUsers();
      return data.users;
    },
  });
}

export function useUser(id) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const { data } = await usersApi.getUser(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_active }) => usersApi.changeUserStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useAssignLeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, leader_id }) => usersApi.assignLeader(id, leader_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useImportUsersExcel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file) => usersApi.importUsersExcel(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUserRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data } = await rolesApi.getRoles();
      return data.roles;
    },
  });
}

export function useAssignRolesToUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roles }) => rolesApi.assignRolesToUser(userId, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => usersApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}