"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesApi, type Role } from "@/lib/api/roles.api";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/hooks/use-toast";
import type { Permission } from "@/lib/permissions";

export function useRoles() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.roles.all,
    queryFn: () => rolesApi.getAll(),
  });

  return {
    roles: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    invalidate: () => queryClient.invalidateQueries({ queryKey: queryKeys.roles.all }),
  };
}

export function useRoleMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });

  const create = useMutation({
    mutationFn: (data: { name: string; description?: string; permissions?: Permission[] }) =>
      rolesApi.create(data),
    onSuccess: (result) => {
      invalidate();
      toast({
        title: "Role created",
        description: `Successfully created ${result.name}`,
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create role",
      });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; permissions?: Permission[] } }) =>
      rolesApi.update(id, data),
    onSuccess: (result) => {
      invalidate();
      toast({
        title: "Role updated",
        description: `Successfully updated ${result.name}`,
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update role",
      });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      invalidate();
      toast({
        title: "Role deleted",
        description: "Successfully deleted role",
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete role",
      });
    },
  });

  return {
    createRole: create.mutateAsync,
    updateRole: update.mutateAsync,
    deleteRole: remove.mutateAsync,
  };
}
