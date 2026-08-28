"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  assignClients,
  createEmployee,
  deactivateEmployee,
  listEmployees,
  resetPassword,
  setEmployeeRole,
  updateEmployee,
  type Employee,
} from "@/lib/api/employees.api";

type EmployeeFilters = {
  search?: string;
  department?: string;
  isActive?: boolean;
  role?: string;
};

/**
 * Fetch a filtered list of employees.
 * Pass filters to narrow results; pass `{}` to fetch all.
 */
export function useEmployees(filters: EmployeeFilters = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.employees.list(filters as Record<string, unknown>),
    queryFn: () => listEmployees(filters),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });

  return {
    employees: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error
      ? query.error.message
      : query.error ? String(query.error) : null,
    invalidate,
  };
}

export function useEmployeeMutations() {
  const queryClient = useQueryClient();
  const invalidateEmployees = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });

  const create = useMutation({
    mutationFn: createEmployee,
    onSuccess: invalidateEmployees,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: Parameters<typeof updateEmployee> extends [infer Id, infer Data] ? { id: Id; data: Data } : never) =>
      updateEmployee(id as string, data as Parameters<typeof updateEmployee>[1]),
    onSuccess: (employee) => {
      invalidateEmployees();
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(employee._id) });
    },
  });

  const assign = useMutation({
    mutationFn: ({ id, clientIds }: { id: string; clientIds: string[] }) =>
      assignClients(id, clientIds),
    onSuccess: (employee) => {
      invalidateEmployees();
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(employee._id) });
    },
  });

  const deactivate = useMutation({
    mutationFn: deactivateEmployee,
    onSuccess: (_data, id) => {
      invalidateEmployees();
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(id) });
    },
  });

  const reset = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      resetPassword(id, newPassword),
  });

  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      setEmployeeRole(id, role),
    onSuccess: (employee) => {
      invalidateEmployees();
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(employee._id) });
    },
  });

  return {
    createEmployee: create,
    updateEmployee: update,
    assignClients: assign,
    deactivateEmployee: deactivate,
    resetPassword: reset,
    setEmployeeRole: setRole,
  };
}
