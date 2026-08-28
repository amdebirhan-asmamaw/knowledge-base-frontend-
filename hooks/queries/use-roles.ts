import useSWR from "swr";
import { rolesApi, type Role } from "@/lib/api/roles.api";
import { useToast } from "@/hooks/use-toast";
import type { Permission } from "@/lib/permissions";

export function useRoles() {
  const { data, error, isLoading, mutate } = useSWR<Role[]>(
    "roles",
    rolesApi.getAll
  );

  return {
    roles: data || [],
    isLoading,
    error: error instanceof Error ? error.message : error ? "Failed to load roles" : null,
    invalidate: () => mutate(),
  };
}

export function useRoleMutations() {
  const { toast } = useToast();

  const createRole = async (data: { name: string; description?: string; permissions?: Permission[] }) => {
    try {
      const result = await rolesApi.create(data);
      toast({
        title: "Role created",
        description: `Successfully created ${result.name}`,
      });
      return result;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create role",
      });
      throw err;
    }
  };

  const updateRole = async ({ id, data }: { id: string; data: { name?: string; description?: string; permissions?: Permission[] } }) => {
    try {
      const result = await rolesApi.update(id, data);
      toast({
        title: "Role updated",
        description: `Successfully updated ${result.name}`,
      });
      return result;
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update role",
      });
      throw err;
    }
  };

  const deleteRole = async (id: string) => {
    try {
      await rolesApi.delete(id);
      toast({
        title: "Role deleted",
        description: "Successfully deleted role",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete role",
      });
      throw err;
    }
  };

  return { createRole, updateRole, deleteRole };
}
