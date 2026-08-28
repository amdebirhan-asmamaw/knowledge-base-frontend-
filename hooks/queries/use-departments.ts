"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  listDepartments,
  updateDepartment,
  setDepartmentHead,
  assignDepartmentMembers,
  removeDepartmentMember,
  transferDepartmentMembers,
  reactivateDepartment,
  type Department,
  type DepartmentDetail,
} from "@/lib/api/departments.api";

type DepartmentFilters = {
  search?: string;
  isActive?: boolean;
};

/**
 * Fetch a filtered list of departments.
 */
export function useDepartments(filters: DepartmentFilters = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.departments.list(filters as Record<string, unknown>),
    queryFn: () => listDepartments(filters),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
  };

  return {
    departments: query.data ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
        ? String(query.error)
        : null,
    invalidate,
  };
}

/**
 * Fetch detailed department information including full member roster.
 */
export function useDepartmentDetail(id: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: id ? queryKeys.departments.detail(id) : ["departments", "detail", "null"],
    queryFn: () => (id ? getDepartment(id) : null),
    enabled: !!id,
  });

  const invalidate = () => {
    if (id) queryClient.invalidateQueries({ queryKey: queryKeys.departments.detail(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
  };

  return {
    department: query.data ?? null,
    isLoading: query.isLoading,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
        ? String(query.error)
        : null,
    invalidate,
  };
}

export function useDepartmentMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
  };

  const create = useMutation({
    mutationFn: createDepartment,
    onSuccess: invalidateAll,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateDepartment>[1] }) =>
      updateDepartment(id, data),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: ({ id, reassignTo }: { id: string; reassignTo?: string }) =>
      deleteDepartment(id, reassignTo),
    onSuccess: invalidateAll,
  });

  const setHead = useMutation({
    mutationFn: ({ deptId, headId }: { deptId: string; headId: string | null }) =>
      setDepartmentHead(deptId, headId),
    onSuccess: invalidateAll,
  });

  const assignMembers = useMutation({
    mutationFn: ({ deptId, userIds }: { deptId: string; userIds: string[] }) =>
      assignDepartmentMembers(deptId, userIds),
    onSuccess: invalidateAll,
  });

  const removeMember = useMutation({
    mutationFn: ({ deptId, userId }: { deptId: string; userId: string }) =>
      removeDepartmentMember(deptId, userId),
    onSuccess: invalidateAll,
  });

  const transferMembers = useMutation({
    mutationFn: ({
      deptId,
      data,
    }: {
      deptId: string;
      data: { targetDepartmentId: string; userIds?: string[] };
    }) => transferDepartmentMembers(deptId, data),
    onSuccess: invalidateAll,
  });

  const activate = useMutation({
    mutationFn: (deptId: string) => reactivateDepartment(deptId),
    onSuccess: invalidateAll,
  });

  return {
    createDepartment: create,
    updateDepartment: update,
    deleteDepartment: remove,
    setDepartmentHead: setHead,
    assignDepartmentMembers: assignMembers,
    removeDepartmentMember: removeMember,
    transferDepartmentMembers: transferMembers,
    reactivateDepartment: activate,
  };
}
