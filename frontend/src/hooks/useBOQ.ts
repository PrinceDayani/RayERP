import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boqApi } from '@/lib/api/boq';
import { toast } from '@/hooks/use-toast';
import {
  CreateBOQRequest,
  UpdateBOQItemRequest,
  AddBOQItemRequest
} from '@/types/boq';

export const useAllBOQs = (params?: { status?: string; projectId?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['boqs', 'all', params],
    queryFn: () => boqApi.getAllBOQs(params)
  });
};

export const useBOQsByProject = (projectId: string, params?: { status?: string; version?: number; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['boqs', projectId, params],
    queryFn: () => boqApi.getBOQsByProject(projectId, params),
    enabled: !!projectId && projectId.length > 0
  });
};

export const useBOQById = (id: string) => {
  return useQuery({
    queryKey: ['boq', id],
    queryFn: () => boqApi.getBOQById(id),
    enabled: !!id && id.length > 0
  });
};

export const useAuditTrail = (id: string, params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['boq-audit', id, params],
    queryFn: () => boqApi.getAuditTrail(id, params),
    enabled: !!id && id.length > 0
  });
};

export const useCreateBOQ = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateBOQRequest) => boqApi.createBOQ(data),
    onSuccess: (data) => {
      const projectId = typeof data.boq.project === 'string' ? data.boq.project : data.boq.project._id;
      queryClient.invalidateQueries({ queryKey: ['boqs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['boqs', 'all'] });
      toast({
        title: 'Success',
        description: 'BOQ created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create BOQ',
        variant: 'destructive'
      });
    }
  });
};

export const useUpdateBOQItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ boqId, itemId, data }: { boqId: string; itemId: string; data: UpdateBOQItemRequest }) =>
      boqApi.updateBOQItem(boqId, itemId, data),
    onSuccess: (data) => {
      const projectId = typeof data.boq.project === 'string' ? data.boq.project : data.boq.project._id;
      queryClient.invalidateQueries({ queryKey: ['boq', data.boq._id] });
      queryClient.invalidateQueries({ queryKey: ['boqs', projectId] });
      toast({
        title: 'Success',
        description: 'BOQ item updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update BOQ item',
        variant: 'destructive'
      });
    }
  });
};

export const useAddBOQItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ boqId, data }: { boqId: string; data: AddBOQItemRequest }) =>
      boqApi.addBOQItem(boqId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boq', data.boq._id] });
      toast({
        title: 'Success',
        description: 'BOQ item added successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add BOQ item',
        variant: 'destructive'
      });
    }
  });
};

export const useDeleteBOQItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ boqId, itemId }: { boqId: string; itemId: string }) =>
      boqApi.deleteBOQItem(boqId, itemId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boq', data.boq._id] });
      toast({
        title: 'Success',
        description: 'BOQ item deleted successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete BOQ item',
        variant: 'destructive'
      });
    }
  });
};

export const useApproveBOQ = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => boqApi.approveBOQ(id),
    onSuccess: (data) => {
      const projectId = typeof data.boq.project === 'string' ? data.boq.project : data.boq.project._id;
      queryClient.invalidateQueries({ queryKey: ['boq', data.boq._id] });
      queryClient.invalidateQueries({ queryKey: ['boqs', projectId] });
      toast({
        title: 'Success',
        description: 'BOQ approved successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve BOQ',
        variant: 'destructive'
      });
    }
  });
};

export const useActivateBOQ = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => boqApi.activateBOQ(id),
    onSuccess: (data) => {
      const projectId = typeof data.boq.project === 'string' ? data.boq.project : data.boq.project._id;
      queryClient.invalidateQueries({ queryKey: ['boq', data.boq._id] });
      queryClient.invalidateQueries({ queryKey: ['boqs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['boqs', 'all'] });
      toast({
        title: 'Success',
        description: 'BOQ activated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to activate BOQ',
        variant: 'destructive'
      });
    }
  });
};
