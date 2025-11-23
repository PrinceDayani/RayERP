'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ResourceAllocationFormProps {
  employees: any[];
  projects: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function ResourceAllocationForm({ employees, projects, onSubmit, onCancel }: ResourceAllocationFormProps) {
  const [formData, setFormData] = useState({
    employee: '',
    project: '',
    allocatedHours: 0,
    startDate: '',
    endDate: '',
    role: '',
    status: 'planned'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Employee</Label>
        <Select value={formData.employee} onValueChange={(v) => setFormData({ ...formData, employee: v })}>
          <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
          <SelectContent>
            {employees?.length > 0 ? employees.map((emp) => (
              <SelectItem key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName} - {emp.position}
              </SelectItem>
            )) : <div className="p-2 text-sm text-muted-foreground">No employees available</div>}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Project</Label>
        <Select value={formData.project} onValueChange={(v) => setFormData({ ...formData, project: v })}>
          <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
          <SelectContent>
            {projects?.length > 0 ? projects.map((proj) => (
              <SelectItem key={proj._id} value={proj._id}>{proj.name}</SelectItem>
            )) : <div className="p-2 text-sm text-muted-foreground">No projects available</div>}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Role</Label>
        <Input value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} />
      </div>

      <div>
        <Label>Allocated Hours/Week</Label>
        <Input type="number" value={formData.allocatedHours} onChange={(e) => setFormData({ ...formData, allocatedHours: +e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit">Allocate Resource</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
