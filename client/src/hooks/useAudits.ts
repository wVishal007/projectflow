import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditsApi } from '../api/audits.api';
import toast from 'react-hot-toast';

export function useAudits(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['audits', params],
    queryFn: () => auditsApi.list(params),
  });
}

export function useAudit(id: string) {
  return useQuery({
    queryKey: ['audit', id],
    queryFn: () => auditsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: auditsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      toast.success('Audit completed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: auditsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      toast.success('Audit deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
