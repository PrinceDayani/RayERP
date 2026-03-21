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

export const useMilestoneBilling = () => {
  const queryClient = useQueryClient();

  // Get billings by project
  const useBillingsByProject = (
    projectId: string,
    params?: { status?: string; approvalStatus?: string }
  ) => {
    return useQuery({
      queryKey: ['billings', projectId, params],
      queryFn: () => billingApi.getBillingsByProject(projectId, params),
      enabled: !!projectId && projectId.length > 0
    });
  };

  // Get billing by ID
  const useBillingById = (id: string) => {
    return useQuery({
      queryKey: ['billing', id],
      queryFn: () => billingApi.getBillingById(id),
      enabled: !!id && id.length > 0
    });
  };

  // Get billing analytics
  const useBillingAnalytics = (projectId: string) => {
    return useQuery({
      queryKey: ['billing-analytics', projectId],
      queryFn: () => billingApi.getBillingAnalytics(projectId),
      enabled: !!projectId && projectId.length > 0
    });
  };

  // Create milestone billing
  const createMilestoneBilling = useMutation({
    mutationFn: (data: CreateMilestoneBillingRequest) => billingApi.createMilestoneBilling(data),
    onSuccess: (data) => {
      const projectId = typeof data.billing.project === 'string' ? data.billing.project : data.billing.project._id;
      queryClient.invalidateQueries({ queryKey: ['billings', projectId] });
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

  // Update billing
  const updateBilling = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBillingRequest }) =>
      billingApi.updateBilling(id, data),
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

  // Submit for approval
  const submitForApproval = useMutation({
    mutationFn: (id: string) => billingApi.submitForApproval(id),
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

  // Approve billing
  const approveBilling = useMutation({
    mutationFn: (id: string) => billingApi.approveBilling(id),
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

  // Reject billing
  const rejectBilling = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectBillingRequest }) =>
      billingApi.rejectBilling(id, data),
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

  // Generate invoice
  const generateInvoice = useMutation({
    mutationFn: ({ id, data }: { id: string; data: GenerateInvoiceRequest }) =>
      billingApi.generateInvoice(id, data),
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

  // Record payment
  const recordPayment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecordPaymentRequest }) =>
      billingApi.recordPayment(id, data),
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

  // Add payment schedule
  const addPaymentSchedule = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IPaymentSchedule> }) =>
      billingApi.addPaymentSchedule(id, data),
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

  // Update payment schedule
  const updatePaymentSchedule = useMutation({
    mutationFn: ({ id, scheduleId, data }: { id: string; scheduleId: string; data: Partial<IPaymentSchedule> }) =>
      billingApi.updatePaymentSchedule(id, scheduleId, data),
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

  return {
    useBillingsByProject,
    useBillingById,
    useBillingAnalytics,
    createMilestoneBilling,
    updateBilling,
    submitForApproval,
    approveBilling,
    rejectBilling,
    generateInvoice,
    recordPayment,
    addPaymentSchedule,
    updatePaymentSchedule
  };
};
