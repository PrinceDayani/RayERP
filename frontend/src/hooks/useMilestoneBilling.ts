import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '@/lib/api/billing';
import { toast } from '@/hooks/use-toast';
import {
  CreateMilestoneBillingRequest,
  UpdateBillingRequest,
  GenerateInvoiceRequest,
  RecordPaymentRequest,
  RejectBillingRequest,
  IPaymentSchedule
} from '@/types/billing';

export const useAllBillings = (
  params?: { status?: string; approvalStatus?: string; projectId?: string; page?: number; limit?: number }
) => {
  return useQuery({
    queryKey: ['billings', 'all', params],
    queryFn: () => billingApi.getAllBillings(params)
  });
};

export const useBillingsByProject = (
  projectId: string,
  params?: { status?: string; approvalStatus?: string; page?: number; limit?: number }
) => {
  return useQuery({
    queryKey: ['billings', projectId, params],
    queryFn: () => billingApi.getBillingsByProject(projectId, params),
    enabled: !!projectId && projectId.length > 0
  });
};

export const useBillingById = (id: string) => {
  return useQuery({
    queryKey: ['billing', id],
    queryFn: () => billingApi.getBillingById(id),
    enabled: !!id && id.length > 0
  });
};

export const useBillingAnalytics = (projectId: string) => {
  return useQuery({
    queryKey: ['billing-analytics', projectId],
    queryFn: () => billingApi.getBillingAnalytics(projectId),
    enabled: !!projectId && projectId.length > 0
  });
};

export const useBillingAuditTrail = (id: string, params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['billing-audit', id, params],
    queryFn: () => billingApi.getAuditTrail(id, params),
    enabled: !!id && id.length > 0
  });
};

export const useCreateMilestoneBilling = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateMilestoneBillingRequest) => billingApi.createMilestoneBilling(data),
    retry: false,
    onSuccess: (data) => {
      const projectId = typeof data.billing.project === 'string' ? data.billing.project : data.billing.project._id;
      queryClient.invalidateQueries({ queryKey: ['billings', projectId] });
      queryClient.invalidateQueries({ queryKey: ['billings', 'all'] });
      toast({
        title: 'Success',
        description: 'Milestone billing created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create billing',
        variant: 'destructive'
      });
    }
  });
};

export const useUpdateBilling = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBillingRequest }) =>
      billingApi.updateBilling(id, data),
    retry: false,
    onSuccess: (data) => {
      const projectId = typeof data.billing.project === 'string' ? data.billing.project : data.billing.project._id;
      queryClient.invalidateQueries({ queryKey: ['billing', data.billing._id] });
      queryClient.invalidateQueries({ queryKey: ['billings', projectId] });
      toast({
        title: 'Success',
        description: 'Billing updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update billing',
        variant: 'destructive'
      });
    }
  });
};

export const useSubmitForApproval = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => billingApi.submitForApproval(id),
    retry: false,
    onSuccess: (data) => {
      const projectId = typeof data.billing.project === 'string' ? data.billing.project : data.billing.project._id;
      queryClient.invalidateQueries({ queryKey: ['billing', data.billing._id] });
      queryClient.invalidateQueries({ queryKey: ['billings', projectId] });
      toast({
        title: 'Success',
        description: 'Billing submitted for approval'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit billing',
        variant: 'destructive'
      });
    }
  });
};

export const useApproveBilling = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => billingApi.approveBilling(id),
    retry: false,
    onSuccess: (data) => {
      const projectId = typeof data.billing.project === 'string' ? data.billing.project : data.billing.project._id;
      queryClient.invalidateQueries({ queryKey: ['billing', data.billing._id] });
      queryClient.invalidateQueries({ queryKey: ['billings', projectId] });
      toast({
        title: 'Success',
        description: 'Billing approved successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve billing',
        variant: 'destructive'
      });
    }
  });
};

export const useRejectBilling = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectBillingRequest }) =>
      billingApi.rejectBilling(id, data),
    retry: false,
    onSuccess: (data) => {
      const projectId = typeof data.billing.project === 'string' ? data.billing.project : data.billing.project._id;
      queryClient.invalidateQueries({ queryKey: ['billing', data.billing._id] });
      queryClient.invalidateQueries({ queryKey: ['billings', projectId] });
      toast({
        title: 'Success',
        description: 'Billing rejected'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject billing',
        variant: 'destructive'
      });
    }
  });
};

export const useGenerateInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GenerateInvoiceRequest }) =>
      billingApi.generateInvoice(id, data),
    retry: false,
    onSuccess: (data) => {
      const projectId = typeof data.billing.project === 'string' ? data.billing.project : data.billing.project._id;
      queryClient.invalidateQueries({ queryKey: ['billing', data.billing._id] });
      queryClient.invalidateQueries({ queryKey: ['billings', projectId] });
      toast({
        title: 'Success',
        description: 'Invoice generated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to generate invoice',
        variant: 'destructive'
      });
    }
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecordPaymentRequest }) =>
      billingApi.recordPayment(id, data),
    retry: false,
    onSuccess: (data) => {
      const projectId = typeof data.billing.project === 'string' ? data.billing.project : data.billing.project._id;
      queryClient.invalidateQueries({ queryKey: ['billing', data.billing._id] });
      queryClient.invalidateQueries({ queryKey: ['billings', projectId] });
      queryClient.invalidateQueries({ queryKey: ['billing-analytics', projectId] });
      toast({
        title: 'Success',
        description: 'Payment recorded successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to record payment',
        variant: 'destructive'
      });
    }
  });
};

export const useAddPaymentSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IPaymentSchedule> }) =>
      billingApi.addPaymentSchedule(id, data),
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['billing', data.billing._id] });
      toast({
        title: 'Success',
        description: 'Payment schedule added successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add payment schedule',
        variant: 'destructive'
      });
    }
  });
};

export const useUpdatePaymentSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, scheduleId, data }: { id: string; scheduleId: string; data: Partial<IPaymentSchedule> }) =>
      billingApi.updatePaymentSchedule(id, scheduleId, data),
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['billing', data.billing._id] });
      toast({
        title: 'Success',
        description: 'Payment schedule updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update payment schedule',
        variant: 'destructive'
      });
    }
  });
};

export const useReconcilePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, paymentId }: { id: string; paymentId: string }) =>
      billingApi.reconcilePayment(id, paymentId),
    retry: false,
    onSuccess: (data) => {
      const projectId = typeof data.billing.project === 'string' ? data.billing.project : data.billing.project._id;
      queryClient.invalidateQueries({ queryKey: ['billing', data.billing._id] });
      queryClient.invalidateQueries({ queryKey: ['billings', projectId] });
      queryClient.invalidateQueries({ queryKey: ['billings', 'all'] });
      toast({
        title: 'Success',
        description: 'Payment reconciled successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reconcile payment',
        variant: 'destructive'
      });
    }
  });
};
