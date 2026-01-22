"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCY_CONFIG } from "@/config/currency.config";
import { useGlobalCurrency } from '@/hooks/useGlobalCurrency';

interface ProjectCurrencySwitcherProps {
  className?: string;
}

export const ProjectCurrencySwitcher: React.FC<ProjectCurrencySwitcherProps> = ({ 
  className = "" 
}) => {
  const { displayCurrency, setGlobalCurrency } = useGlobalCurrency();

  const formatCurrencyDisplay = (currency: string): string => {
    if (currency === 'Original') return 'Original Currency';
    
    const currencyConfig = CURRENCY_CONFIG.supported.find(c => c.code === currency);
    return currencyConfig ? `${currencyConfig.symbol} ${currency}` : currency;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-muted-foreground">Currency:</span>
      <Select value={displayCurrency} onValueChange={setGlobalCurrency}>
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            {formatCurrencyDisplay(displayCurrency)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Original">
            <span className="font-medium">Original Currency</span>
          </SelectItem>
          {CURRENCY_CONFIG.supported.slice(0, 10).map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              {currency.symbol} {currency.code} - {currency.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProjectCurrencySwitcher;