'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CapacityPlan } from '@/types/resource';
import { resourceApi } from '@/lib/api/resources';
import { employeesAPI } from '@/lib/api/employeesAPI';
import { Users, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export default function CapacityPlanningView() {
  const [data, setData] = useState<CapacityPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('current');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  useEffect(() => {
    fetchCapacityData();
  }, [timeRange]);

  const fetchCapacityData = async () => {
    try {
      setLoading(true);
      
      // Get date range based on selection
      const now = new Date();
      const startDate = timeRange === 'next' 
        ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
        : new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      try {
        const response = await resourceApi.getCapacityPlanning({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
        setData(response.data || []);
      } catch (error) {
        // Fallback to mock data if API not available
        const employeesData = await employeesAPI.getAll();
        const employees = Array.isArray(employeesData) ? employeesData : employeesData?.data || [];
        
        const mockCapacityData: CapacityPlan[] = employees.slice(0, 8).map(emp => {
          const capacity = 40; // 40 hours per week
          const allocated = Math.floor(Math.random() * 45); // Random allocation
          const available = Math.max(0, capacity - allocated);
          const utilizationRate = (allocated / capacity) * 100;
          
          return {
            employee: {
              _id: emp._id,
              name: `${emp.firstName} ${emp.lastName}`,
              position: emp.position || 'Developer',
              skills: ['JavaScript', 'React', 'Node.js'].slice(0, Math.floor(Math.random() * 3) + 1)
            },
            capacity,
            allocated,
            available,
            utilizationRate,
            allocations: [] // Mock empty allocations
          };
        });
        
        setData(mockCapacityData);
      }
    } catch (error) {
      console.error('Error fetching capacity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate < 70) return 'text-green-600';
    if (rate < 90) return 'text-yellow-600';
    if (rate <= 100) return 'text-blue-600';
    return 'text-red-600';
  };

  const getUtilizationIcon = (rate: number) => {
    if (rate < 70) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (rate < 90) return <TrendingUp className="w-4 h-4 text-yellow-600" />;
    if (rate <= 100) return <Users className="w-4 h-4 text-blue-600" />;
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  const filteredData = data.filter(plan => 
    departmentFilter === 'all' || plan.employee.position.toLowerCase().includes(departmentFilter.toLowerCase())
  );

  const avgUtilization = filteredData.length > 0 
    ? filteredData.reduce((sum, plan) => sum + plan.utilizationRate, 0) / filteredData.length
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading capacity planning...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Capacity Planning</h2>
          <p className="text-muted-foreground">Monitor team capacity and resource utilization</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Month</SelectItem>
              <SelectItem value="next">Next Month</SelectItem>
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="developer">Developers</SelectItem>
              <SelectItem value="manager">Managers</SelectItem>
              <SelectItem value="designer">Designers</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchCapacityData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Resources</p>
                <p className="text-2xl font-bold">{filteredData.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Utilization</p>
                <p className={`text-2xl font-bold ${getUtilizationColor(avgUtilization)}`}>
                  {avgUtilization.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredData.filter(p => p.utilizationRate < 80).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Over-allocated</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredData.filter(p => p.utilizationRate > 100).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capacity Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredData.map((plan) => (
          <Card key={plan.employee._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {plan.employee.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.employee.position}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getUtilizationIcon(plan.utilizationRate)}
                  <Badge variant={plan.utilizationRate > 100 ? "destructive" : plan.utilizationRate > 80 ? "default" : "secondary"}>
                    {plan.utilizationRate.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Capacity:</span>
                  <span className="font-medium">{plan.capacity}h/week</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Allocated:</span>
                  <span className="font-medium">{plan.allocated}h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available:</span>
                  <span className={`font-medium ${plan.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {plan.available}h
                  </span>
                </div>
                
                <Progress 
                  value={Math.min(plan.utilizationRate, 100)} 
                  className="h-2" 
                />
                
                {plan.employee.skills.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-3">
                    {plan.employee.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredData.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No capacity data available</h3>
            <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
