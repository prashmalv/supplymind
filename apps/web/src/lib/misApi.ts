import { useQuery } from '@tanstack/react-query';
import { ExecutiveMis, ProcurementMis, InventoryMis, MisAlert, ReportTable, ForecastMis } from '@supplymind/shared';
import { api } from './apiClient';
import { useAuth } from '../auth/AuthProvider';

/** React Query hooks for the MIS API, keyed by the active org so switching
 *  organizations automatically refetches and isolates cache. */
export function useExecutiveMis() {
  const { currentOrgId } = useAuth();
  return useQuery({
    queryKey: ['mis', 'executive', currentOrgId],
    queryFn: () => api.get<ExecutiveMis>('/mis/executive'),
    enabled: !!currentOrgId,
  });
}

export function useProcurementMis() {
  const { currentOrgId } = useAuth();
  return useQuery({
    queryKey: ['mis', 'procurement', currentOrgId],
    queryFn: () => api.get<ProcurementMis>('/mis/procurement'),
    enabled: !!currentOrgId,
  });
}

export function useInventoryMis() {
  const { currentOrgId } = useAuth();
  return useQuery({
    queryKey: ['mis', 'inventory', currentOrgId],
    queryFn: () => api.get<InventoryMis>('/mis/inventory'),
    enabled: !!currentOrgId,
  });
}

export function useMisAlerts() {
  const { currentOrgId } = useAuth();
  return useQuery({
    queryKey: ['mis', 'alerts', currentOrgId],
    queryFn: () => api.get<MisAlert[]>('/mis/alerts'),
    enabled: !!currentOrgId,
  });
}

export function useMisReports() {
  const { currentOrgId } = useAuth();
  return useQuery({
    queryKey: ['mis', 'reports', currentOrgId],
    queryFn: () => api.get<ReportTable[]>('/mis/reports'),
    enabled: !!currentOrgId,
  });
}

export function useForecastMis() {
  const { currentOrgId } = useAuth();
  return useQuery({
    queryKey: ['mis', 'forecast', currentOrgId],
    queryFn: () => api.get<ForecastMis | null>('/mis/forecast'),
    enabled: !!currentOrgId,
  });
}
