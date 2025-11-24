'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Globe, DollarSign, TrendingUp } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { setNumberFormat, getNumberFormat, type NumberFormat } from '@/utils/currency';

const CurrencySettings = () => {
  const { currency, setCurrency, formatAmount, formatCompact } = useCurrency();
  const [numberFormat, setNumberFormatState] = useState<NumberFormat>(getNumberFormat());

  const currencies = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' }
  ];

  const handleNumberFormatChange = (format: NumberFormat) => {
    setNumberFormatState(format);
    setNumberFormat(format);
    window.location.reload(); // Reload to apply changes
  };

  const sampleAmount = 1234567.89;

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-200">
            <Globe className="h-5 w-5" />
            Currency Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Currency Selection */}
          <div className="space-y-2">
            <Label className="text-gray-300">Default Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(curr => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.code} - {curr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-400">
              Selected currency will be used across all financial reports
            </p>
          </div>

          {/* Number Format */}
          <div className="space-y-2">
            <Label className="text-gray-300">Number Format</Label>
            <Select value={numberFormat} onValueChange={(v) => handleNumberFormatChange(v as NumberFormat)}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indian">Indian (Lakhs/Crores)</SelectItem>
                <SelectItem value="international">International (Million/Billion)</SelectItem>
                <SelectItem value="auto">Auto (Based on Currency)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-400">
              Choose how large numbers are displayed
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-3 p-4 bg-gray-700/50 rounded-lg">
            <h4 className="font-semibold text-gray-200">Preview</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Standard:</span>
                <span className="font-mono text-white">{formatAmount(sampleAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Compact:</span>
                <span className="font-mono text-white">{formatCompact(sampleAmount)}</span>
              </div>
            </div>
          </div>

          {/* Current Settings */}
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
              Currency: {currency}
            </Badge>
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
              Format: {numberFormat}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Examples */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-200">
            <TrendingUp className="h-5 w-5" />
            Format Examples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1000, 50000, 100000, 1000000, 10000000, 100000000].map(amount => (
              <div key={amount} className="flex justify-between items-center p-3 bg-gray-700/50 rounded">
                <span className="text-gray-400">{amount.toLocaleString()}</span>
                <div className="flex gap-4">
                  <span className="font-mono text-white">{formatAmount(amount)}</span>
                  <span className="font-mono text-blue-400">{formatCompact(amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrencySettings;
