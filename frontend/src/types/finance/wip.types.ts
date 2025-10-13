export interface WorkOrder {
  id: string;
  orderNumber: string;
  productId: string;
  quantity: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  totalCost: number;
}

export interface MaterialConsumption {
  id: string;
  workOrderId: string;
  materialId: string;
  quantityUsed: number;
  unitCost: number;
  totalCost: number;
  date: Date;
}

export interface LaborTracking {
  id: string;
  workOrderId: string;
  employeeId: string;
  hoursWorked: number;
  hourlyRate: number;
  totalCost: number;
  date: Date;
}

export interface OverheadAllocation {
  id: string;
  workOrderId: string;
  overheadType: string;
  allocationBase: 'labor_hours' | 'machine_hours' | 'material_cost';
  rate: number;
  amount: number;
}