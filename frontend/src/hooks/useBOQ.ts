import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boqApi } from '@/lib/api/boq';
import { toast } from '@/hooks/use-toast';
import {
  CreateBOQRequest,
  UpdateBOQItemRequest,
  AddBOQItemRequest
} from '@/types/boq';

export const useBOQ = () => {
  const queryClient = useQueryClient();

  // Get BOQs by project
  const useBOQsByProject = (projectId: string, params?: { status?: string; version?: number }) => {
    return useQuery({
      queryKey: ['boqs', projectId, params],
      queryFn: () => boqApi.getBOQsByProject(projectId, params),
      enabled: !!projectId && projectId.length > 0
    });
  };

  // Get BOQ by ID
  const useBOQById = (id: string) => {
    return useQuery({
      queryKey: ['boq', id],
      queryFn: () => boqApi.getBOQById(id),
      enabled: !!id && id.length > 0
    });
  };

  // Create BOQ
  const createBOQ = useMutation({
    mutationFn: (data: CreateBOQRequest) => boqApi.createBOQ(data),
    onSuccess: (data) => {
      const projectId = typeof data.boq.project === 'string' ? data.boq.project : data.boq.project._id;
      queryClient.invalidateQueries({ queryKey: ['boqs', projectId] });
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

  // Update BOQ item
  const updateBOQItem = useMutation({
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

  // Add BOQ item
  const addBOQItem = useMutation({
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

  // Delete BOQ item
  const deleteBOQItem = useMutation({
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

  // Approve BOQ
  const approveBOQ = useMutation({
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

  // Activate BOQ
  const activateBOQ = useMutation({
    mutationFn: (id: string) => boqApi.activateBOQ(id),
    onSuccess: (data) => {
      const projectId = typeof data.boq.project === 'string' ? data.boq.project : data.boq.project._id;
      queryClient.invalidateQueries({ queryKey: ['boq', data.boq._id] });
      queryClient.invalidateQueries({ queryKey: ['boqs', projectId] });
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

  return {
    useBOQsByProject,
    useBOQById,
    createBOQ,
    updateBOQItem,
    addBOQItem,
    deleteBOQItem,
    approveBOQ,
    activateBOQ
  };
};
