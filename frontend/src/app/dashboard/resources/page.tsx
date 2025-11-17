'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resourceApi } from '@/lib/api/resources';
import ResourceAllocationForm from '@/components/resources/ResourceAllocationForm';
import CapacityPlanningView from '@/components/resources/CapacityPlanningView';
import SkillMatrixView from '@/components/resources/SkillMatrixView';
import { Plus } from 'lucide-react';

export default function ResourceManagementPage() {
  const [showForm, setShowForm] = useState(false);
  const [allocations, setAllocations] = useState([]);
  const [capacityData, setCapacityData] = useState([]);
  const [skillMatrix, setSkillMatrix] = useState({ matrix: [], allSkills: [] });
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allocRes, capacityRes, skillRes] = await Promise.all([
        resourceApi.getResourceAllocations(),
        resourceApi.getCapacityPlanning({ 
          startDate: new Date().toISOString(), 
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
        }),
        resourceApi.getSkillMatrix()
      ]);
      setAllocations(allocRes.data);
      setCapacityData(capacityRes.data);
      setSkillMatrix(skillRes.data);
    } catch (error) {
      console.error('Failed to load resource data:', error);
    }
  };

  const handleAllocate = async (data: any) => {
    try {
      await resourceApi.allocateResource(data);
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to allocate resource:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Resource Management</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Allocate Resource
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Resource Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResourceAllocationForm
              employees={employees}
              projects={projects}
              onSubmit={handleAllocate}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="capacity">
        <TabsList>
          <TabsTrigger value="capacity">Capacity Planning</TabsTrigger>
          <TabsTrigger value="skills">Skill Matrix</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
        </TabsList>

        <TabsContent value="capacity">
          <CapacityPlanningView data={capacityData} />
        </TabsContent>

        <TabsContent value="skills">
          <SkillMatrixView matrix={skillMatrix.matrix} allSkills={skillMatrix.allSkills} />
        </TabsContent>

        <TabsContent value="allocations">
          <Card>
            <CardHeader>
              <CardTitle>Resource Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allocations.map((alloc: any) => (
                  <div key={alloc._id} className="p-4 border rounded">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{alloc.employee?.firstName} {alloc.employee?.lastName}</div>
                        <div className="text-sm text-muted-foreground">{alloc.project?.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{alloc.allocatedHours}h/week</div>
                        <div className="text-sm text-muted-foreground">{alloc.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
