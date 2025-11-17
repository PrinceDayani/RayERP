'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Globe, TrendingUp, RefreshCw, Plus, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Currency {
  _id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isBaseCurrency: boolean;
  isActive: boolean;
  lastUpdated: Date;
}

export default function MultiCurrencyPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([
    { _id: '1', code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 83.12, isBaseCurrency: false, isActive: true, lastUpdated: new Date() },
    { _id: '2', code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 90.45, isBaseCurrency: false, isActive: true, lastUpdated: new Date() },
    { _id: '3', code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 1, isBaseCurrency: true, isActive: true, lastUpdated: new Date() }
  ]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    exchangeRate: 1,
    isBaseCurrency: false,
    isActive: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCurrency: Currency = {
      _id: Date.now().toString(),
      ...formData,
      lastUpdated: new Date()
    };
    setCurrencies([...currencies, newCurrency]);
    setIsDialogOpen(false);
    setFormData({ code: '', name: '', symbol: '', exchangeRate: 1, isBaseCurrency: false, isActive: true });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="w-8 h-8 text-blue-600" />
            Multi-Currency Management
          </h1>
          <p className="text-gray-600 mt-2">Manage currencies and exchange rates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Rates
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Currency
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Currency</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="code">Currency Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="USD, EUR, GBP..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Currency Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="US Dollar, Euro..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                    placeholder="$, €, £..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="exchangeRate">Exchange Rate (to base currency)</Label>
                  <Input
                    id="exchangeRate"
                    type="number"
                    step="0.0001"
                    value={formData.exchangeRate}
                    onChange={(e) => setFormData({...formData, exchangeRate: parseFloat(e.target.value)})}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Active Currencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {currencies.filter(c => c.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Base Currency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencies.find(c => c.isBaseCurrency)?.code || 'INR'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Last Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              {new Date().toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Currencies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currencies.map((currency) => (
              <div key={currency._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{currency.symbol}</div>
                  <div>
                    <div className="font-semibold">{currency.code}</div>
                    <div className="text-sm text-gray-600">{currency.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-semibold">{currency.exchangeRate}</div>
                    <div className="text-sm text-gray-600">Rate</div>
                  </div>
                  {currency.isBaseCurrency && <Badge>Base</Badge>}
                  {currency.isActive && <Badge variant="secondary">Active</Badge>}
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}