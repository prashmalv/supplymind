import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Automation, CreateAutomationInput } from '@supplymind/shared';
import { api } from './apiClient';
import { useAuth } from '../auth/AuthProvider';

export function useAutomations() {
  const { currentOrgId } = useAuth();
  return useQuery({
    queryKey: ['automations', currentOrgId],
    queryFn: () => api.get<Automation[]>('/automations'),
    enabled: !!currentOrgId,
  });
}

export function useCreateAutomation() {
  const { currentOrgId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAutomationInput) => api.post<Automation>('/automations', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations', currentOrgId] }),
  });
}

export function useDeleteAutomation() {
  const { currentOrgId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/automations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations', currentOrgId] }),
  });
}
