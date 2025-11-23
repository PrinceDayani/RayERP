"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CURRENCY_CONFIG } from "@/config/currency.config";

export default function CurrencySwitcher() {
  const { currency, setCurrency, symbol } = useCurrency();

  return (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger className="w-[180px]">
        <SelectValue>
          {symbol} {currency}
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
