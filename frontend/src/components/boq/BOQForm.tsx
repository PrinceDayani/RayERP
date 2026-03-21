'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBOQ } from '@/hooks/useBOQ';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { IBOQItem } from '@/types/boq';

interface BOQFormProps {
  projectId: string;
}

export default function BOQForm({ projectId }: BOQFormProps) {
  const router = useRouter();
  const { createBOQ } = useBOQ();
  const [currency, setCurrency] = useState('USD');
  const [items, setItems] = useState<Partial<IBOQItem>[]>([
    {
      itemCode: '',
      description: '',
      category: 'material',
      unit: '',
      plannedQuantity: 0,
      unitRate: 0,
      actualQuantity: 0,
      status: 'not-started'
    }
  ]);

  const addItem = () => {
    setItems([...items, {
      itemCode: '',
      description: '',
      category: 'material',
      unit: '',
      plannedQuantity: 0,
      unitRate: 0,
      actualQuantity: 0,
      status: 'not-started'
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createBOQ.mutateAsync({
      projectId,
      items,
      currency
    });

    router.push(`/dashboard/projects/${projectId}/boq`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>BOQ Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>BOQ Items</CardTitle>
          <Button type="button" onClick={addItem} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label>Item Code</Label>
                    <Input
                      value={item.itemCode}
                      onChange={(e) => updateItem(index, 'itemCode', e.target.value)}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={item.category}
                      onValueChange={(value) => updateItem(index, 'category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="material">Material</SelectItem>
                        <SelectItem value="labor">Labor</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="subcontractor">Subcontractor</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Input
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Planned Quantity</Label>
                    <Input
                      type="number"
                      value={item.plannedQuantity}
                      onChange={(e) => updateItem(index, 'plannedQuantity', parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <Label>Unit Rate</Label>
                    <Input
                      type="number"
                      value={item.unitRate}
                      onChange={(e) => updateItem(index, 'unitRate', parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={createBOQ.isPending}>
          {createBOQ.isPending ? 'Creating...' : 'Create BOQ'}
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
