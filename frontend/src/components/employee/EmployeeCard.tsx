"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Calendar, Edit, Trash2 } from "lucide-react";

interface Employee {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  salary: number;
  status: 'active' | 'inactive' | 'terminated';
  hireDate: string;
}

interface EmployeeCardProps {
  employee: Employee;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'inactive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'terminated': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export default function EmployeeCard({ employee, onEdit, onDelete }: EmployeeCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-sm text-muted-foreground font-mono">{employee.employeeId}</p>
          </div>
          <Badge className={getStatusColor(employee.status)}>
            {employee.status}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span>{employee.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{employee.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Hired: {new Date(employee.hireDate).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="border-t pt-4 mb-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Department</p>
              <p className="font-medium">{employee.department}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Position</p>
              <p className="font-medium">{employee.position}</p>
            </div>
          </div>
        </div>

        {(onEdit || onDelete) && (
          <div className="flex gap-2">
            {onEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onEdit(employee._id)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 hover:text-red-700"
                onClick={() => onDelete(employee._id, `${employee.firstName} ${employee.lastName}`)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
