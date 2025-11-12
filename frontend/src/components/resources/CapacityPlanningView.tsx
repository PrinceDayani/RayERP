'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CapacityPlan } from '@/types/resource';

interface CapacityPlanningViewProps {
  data: CapacityPlan[];
}

export default function CapacityPlanningView({ data }: CapacityPlanningViewProps) {
  return (
    <div className="space-y-4">
      {data.map((plan) => (
        <Card key={plan.employee._id}>
          <CardHeader>
            <CardTitle className="text-lg">
              {plan.employee.name} - {plan.employee.position}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Capacity: {plan.capacity}h/week</span>
                <span>Allocated: {plan.allocated}h</span>
                <span>Available: {plan.available}h</span>
              </div>
              <Progress value={plan.utilizationRate} className="h-2" />
              <div className="text-sm text-muted-foreground">
                Utilization: {plan.utilizationRate.toFixed(1)}%
              </div>
              {plan.employee.skills.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2">
                  {plan.employee.skills.map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
