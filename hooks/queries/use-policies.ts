"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  listPolicies, getPolicy, createPolicy, updatePolicy, deletePolicy, hardDeletePolicy, restorePolicy,
  getPolicyAcceptances, getComplianceReport, listActivePolicies, acceptPolicy,
  getPolicyVersions, getPolicyVersion, restorePolicyVersion,
  type PolicyFilters,
  type AcceptancesFilter,
} from "@/lib/api/policies.api";

export function usePolicies(filters: PolicyFilters = {}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.policies.list(filters as unknown as Record<string, unknown>),
    queryFn: () => listPolicies(filters),
  });
  const data = query.data ?? { policies: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } };
  return {
    policies: data.policies, pagination: data.pagination,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    invalidate: () => queryClient.invalidateQueries({ queryKey: queryKeys.policies.all }),
  };
}

export function usePolicyDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.policies.detail(id || ''),
    queryFn: () => getPolicy(id!),
    enabled: !!id,
  });
}

export function usePolicyAcceptances(id: string | null, filters: AcceptancesFilter = {}) {
  return useQuery({
    queryKey: [...queryKeys.policies.detail(id || ''), 'acceptances', filters],
    queryFn: () => getPolicyAcceptances(id!, filters),
    enabled: !!id,
  });
}

export function useComplianceReport() {
  return useQuery({
    queryKey: queryKeys.policies.compliance,
    queryFn: () => getComplianceReport(),
  });
}

export function useActivePolicies() {
  return useQuery({
    queryKey: queryKeys.policies.active,
    queryFn: () => listActivePolicies(),
  });
}

export function usePolicyVersions(policyId: string | null) {
  return useQuery({
    queryKey: queryKeys.policies.versions(policyId || ''),
    queryFn: () => getPolicyVersions(policyId!),
    enabled: !!policyId,
  });
}

export function usePolicyVersion(policyId: string | null, versionId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.policies.versions(policyId || ''), versionId],
    queryFn: () => getPolicyVersion(policyId!, versionId!),
    enabled: !!policyId && !!versionId,
  });
}

export function usePolicyMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.policies.all });

  return {
    createPolicy: useMutation({ mutationFn: createPolicy, onSuccess: invalidate }),
    updatePolicy: useMutation({
      mutationFn: ({ id, data }: { id: string; data: object }) => updatePolicy(id, data),
      onSuccess: invalidate,
    }),
    restorePolicy: useMutation({
      mutationFn: ({ id, status = 'draft' }: { id: string; status?: 'draft' | 'active' }) =>
        restorePolicy(id, status),
      onSuccess: invalidate,
    }),
    deletePolicy: useMutation({ mutationFn: deletePolicy, onSuccess: invalidate }),
    hardDeletePolicy: useMutation({ mutationFn: hardDeletePolicy, onSuccess: invalidate }),
    acceptPolicy: useMutation({
      mutationFn: acceptPolicy,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.policies.active }),
    }),
    restoreVersion: useMutation({
      mutationFn: ({ policyId, versionId, changeNote }: { policyId: string; versionId: string; changeNote?: string }) =>
        restorePolicyVersion(policyId, versionId, changeNote),
      onSuccess: invalidate,
    }),
  };
}
