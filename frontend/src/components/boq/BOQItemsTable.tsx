'use client';

import { useState } from 'react';
import { useUpdateBOQItem, useDeleteBOQItem } from '@/hooks/useBOQ';
import { IBOQItem } from '@/types/boq';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Edit, Save, X, Trash2 } from 'lucide-react';
import { useGlobalCurrency } from '@/hooks/useGlobalCurrency';

interface BOQItemsTableProps {
  boqId: string;
  items: IBOQItem[];
  currency: string;
  readonly?: boolean;
}

export default function BOQItemsTable({ boqId, items, currency, readonly = false }: BOQItemsTableProps) {
  const updateBOQItem = useUpdateBOQItem();
  const deleteBOQItem = useDeleteBOQItem();
  const { formatAmount } = useGlobalCurrency();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<IBOQItem>>({});

  const handleEdit = (item: IBOQItem) => {
    setEditingId(item._id || null);
    setEditData({
      actualQuantity: item.actualQuantity,
      status: item.status,
      notes: item.notes
    });
  };

  const handleSave = async (itemId: string) => {
    await updateBOQItem.mutateAsync({
      boqId,
      itemId,
      data: {
        actualQuantity: editData.actualQuantity,
        status: editData.status,
        notes: editData.notes
      }
    });
    setEditingId(null);
    setEditData({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteBOQItem.mutateAsync({ boqId, itemId });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'material': return 'bg-blue-500';
      case 'labor': return 'bg-green-500';
      case 'equipment': return 'bg-yellow-500';
      case 'subcontractor': return 'bg-purple-500';
      case 'other': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not-started': return 'bg-gray-500';
      case 'in-progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'on-hold': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Planned Qty</TableHead>
            <TableHead className="text-right">Actual Qty</TableHead>
            <TableHead className="text-right">Unit Rate</TableHead>
            <TableHead className="text-right">Planned Amount</TableHead>
            <TableHead className="text-right">Actual Amount</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
            {!readonly && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isEditing = editingId === item._id;

            return (
              <TableRow key={item._id}>
                <TableCell className="font-medium">{item.itemCode}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>
                  <Badge className={getCategoryColor(item.category)}>
                    {item.category}
                  </Badge>
                </TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell className="text-right">{item.plannedQuantity}</TableCell>
                <TableCell className="text-right">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editData.actualQuantity}
                      onChange={(e) => setEditData({ ...editData, actualQuantity: parseFloat(e.target.value) })}
                      className="w-24"
                    />
                  ) : (
                    item.actualQuantity
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatAmount(item.unitRate, currency)}
                </TableCell>
                <TableCell className="text-right">
                  {formatAmount(item.plannedAmount, currency)}
                </TableCell>
                <TableCell className="text-right">
                  {formatAmount(item.actualAmount, currency)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Progress value={item.completionPercentage} className="w-20" />
                    <span className="text-xs">{item.completionPercentage.toFixed(0)}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Select
                      value={editData.status}
                      onValueChange={(value) => setEditData({ ...editData, status: value as any })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not-started">Not Started</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  )}
                </TableCell>
                {!readonly && (
                  <TableCell>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSave(item._id!)}
                            disabled={updateBOQItem.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(item._id!)}
                            disabled={deleteBOQItem.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No items found
        </div>
      )}
    </div>
  );
}
