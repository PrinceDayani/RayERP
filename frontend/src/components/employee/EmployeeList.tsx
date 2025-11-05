"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import EmployeeCard from "./EmployeeCard";

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

interface EmployeeListProps {
  employees: Employee[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export default function EmployeeList({ employees, onEdit, onDelete }: EmployeeListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(employee =>
    `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Search employees by name, ID, department, or position..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredEmployees.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No employees found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee._id}
              employee={employee}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
