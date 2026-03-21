'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMilestoneBilling } from '@/hooks/useMilestoneBilling';
import { useBOQ } from '@/hooks/useBOQ';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BillingFormProps {
  projectId: string;
}

export default function BillingForm({ projectId }: BillingFormProps) {
  const router = useRouter();
  const { createMilestoneBilling } = useMilestoneBilling();
  const { useBOQsByProject } = useBOQ();
  const { data: boqsData } = useBOQsByProject(projectId, { status: 'active' });

  const [formData, setFormData] = useState({
    boqId: '',
    milestoneId: '',
    milestoneName: '',
    billingType: 'milestone' as const,
    totalContractValue: 0,
    retentionPercentage: 0,
    currency: 'USD',
    paymentTerms: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createMilestoneBilling.mutateAsync({
      projectId,
      ...formData
    });

    router.push(`/dashboard/projects/${projectId}/billing`);
  };

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Billing Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>BOQ</Label>
            <Select value={formData.boqId} onValueChange={(value) => updateField('boqId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select BOQ" />
              </SelectTrigger>
              <SelectContent>
                {boqsData?.boqs.map((boq) => (
                  <SelectItem key={boq._id} value={boq._id}>
                    Version {boq.version} - {boq.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Milestone ID</Label>
              <Input
                value={formData.milestoneId}
                onChange={(e) => updateField('milestoneId', e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Milestone Name</Label>
              <Input
                value={formData.milestoneName}
                onChange={(e) => updateField('milestoneName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Billing Type</Label>
              <Select
                value={formData.billingType}
                onValueChange={(value) => updateField('billingType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="time-based">Time Based</SelectItem>
                  <SelectItem value="completion">Completion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => updateField('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Total Contract Value</Label>
              <Input
                type="number"
                value={formData.totalContractValue}
                onChange={(e) => updateField('totalContractValue', parseFloat(e.target.value))}
                required
              />
            </div>
            <div>
              <Label>Retention Percentage</Label>
              <Input
                type="number"
                value={formData.retentionPercentage}
                onChange={(e) => updateField('retentionPercentage', parseFloat(e.target.value))}
                min="0"
                max="100"
              />
            </div>
          </div>

          <div>
            <Label>Payment Terms</Label>
            <Input
              value={formData.paymentTerms}
              onChange={(e) => updateField('paymentTerms', e.target.value)}
              placeholder="e.g., Net 30 days"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={createMilestoneBilling.isPending}>
          {createMilestoneBilling.isPending ? 'Creating...' : 'Create Billing'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
