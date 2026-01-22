"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGlobalCurrency } from "@/hooks/useGlobalCurrency";
import { CURRENCY_CONFIG } from "@/config/currency.config";

export default function CurrencySwitcher() {
  const { displayCurrency, setGlobalCurrency } = useGlobalCurrency();

  const currentCurrencyConfig = CURRENCY_CONFIG.supported.find(c => c.code === displayCurrency);

  return (
    <Select value={displayCurrency} onValueChange={setGlobalCurrency}>
      <SelectTrigger className="w-[180px]">
        <SelectValue>
          {currentCurrencyConfig?.symbol} {displayCurrency}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CURRENCY_CONFIG.supported.map((curr) => (
          <SelectItem key={curr.code} value={curr.code}>
            {curr.symbol} {curr.code} - {curr.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
