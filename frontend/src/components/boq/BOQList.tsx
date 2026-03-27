'use client';

import { useState } from 'react';
import { useBOQsByProject, useApproveBOQ, useActivateBOQ } from '@/hooks/useBOQ';
import { IBOQ } from '@/types/boq';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  TrendingUp,
  Eye,
  Edit,
  CheckSquare,
  PlayCircle
} from 'lucide-react';
import { useGlobalCurrency } from '@/hooks/useGlobalCurrency';

interface BOQListProps {
  projectId: string;
  onSelectBOQ?: (boq: IBOQ) => void;
}

export default function BOQList({ projectId, onSelectBOQ }: BOQListProps) {
  const { data, isLoading } = useBOQsByProject(projectId);
  const approveBOQ = useApproveBOQ();
  const activateBOQ = useActivateBOQ();
  const { formatAmount } = useGlobalCurrency();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'approved': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'revised': return 'bg-yellow-500';
      case 'closed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleApprove = async (id: string) => {
    await approveBOQ.mutateAsync(id);
  };

  const handleActivate = async (id: string) => {
    await activateBOQ.mutateAsync(id);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading BOQs...</div>;
  }

  const boqs = data?.boqs || [];
  const filteredBOQs = selectedStatus === 'all' 
    ? boqs 
    : boqs.filter(b => b.status === selectedStatus);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedStatus('all')}
        >
          All
        </Button>
        {['draft', 'approved', 'active', 'revised', 'closed'].map(status => (
          <Button
            key={status}
            variant={selectedStatus === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredBOQs.map((boq) => (
          <Card key={boq._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Version {boq.version}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(boq.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={getStatusColor(boq.status)}>
                  {boq.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{boq.overallProgress.toFixed(1)}%</span>
                </div>
                <Progress value={boq.overallProgress} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Planned</p>
                  <p className="font-semibold">
                    {formatAmount(boq.totalPlannedAmount, boq.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Actual</p>
                  <p className="font-semibold">
                    {formatAmount(boq.totalActualAmount, boq.currency)}
                  </p>
                </div>
              </div>

              <div className="text-sm">
                <p className="text-muted-foreground">Items</p>
                <p className="font-medium">{boq.items.length} items</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectBOQ?.(boq)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>

                {boq.status === 'draft' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprove(boq._id)}
                    disabled={approveBOQ.isPending}
                  >
                    <CheckSquare className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                )}

                {boq.status === 'approved' && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleActivate(boq._id)}
                    disabled={activateBOQ.isPending}
                  >
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Activate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBOQs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No BOQs found
        </div>
      )}
    </div>
  );
}
