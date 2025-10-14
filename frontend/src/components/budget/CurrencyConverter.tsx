"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, RefreshCw } from "lucide-react";
import { Currency } from "@/types/budget";

interface CurrencyConverterProps {
  onConvert?: (amount: number, fromCurrency: string, toCurrency: string, convertedAmount: number) => void;
}

export default function CurrencyConverter({ onConvert }: CurrencyConverterProps) {
  const [amount, setAmount] = useState<number>(0);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const currencies: Currency[] = [
    { code: "USD", name: "US Dollar", symbol: "$", exchangeRate: 1 },
    { code: "EUR", name: "Euro", symbol: "€", exchangeRate: 0.85 },
    { code: "GBP", name: "British Pound", symbol: "£", exchangeRate: 0.73 },
    { code: "INR", name: "Indian Rupee", symbol: "₹", exchangeRate: 83.12 },
    { code: "JPY", name: "Japanese Yen", symbol: "¥", exchangeRate: 149.50 },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", exchangeRate: 1.36 },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", exchangeRate: 1.52 },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF", exchangeRate: 0.88 }
  ];

  useEffect(() => {
    const rates = currencies.reduce((acc, currency) => {
      acc[currency.code] = currency.exchangeRate;
      return acc;
    }, {} as Record<string, number>);
    setExchangeRates(rates);
  }, []);

  useEffect(() => {
    if (amount && exchangeRates[fromCurrency] && exchangeRates[toCurrency]) {
      const usdAmount = amount / exchangeRates[fromCurrency];
      const converted = usdAmount * exchangeRates[toCurrency];
      setConvertedAmount(converted);
    }
  }, [amount, fromCurrency, toCurrency, exchangeRates]);

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleRefreshRates = async () => {
    setLoading(true);
    try {
      // In a real app, you would fetch from an API like exchangerate-api.com
      // For demo purposes, we'll simulate a refresh with slight variations
      const updatedRates = { ...exchangeRates };
      Object.keys(updatedRates).forEach(currency => {
        if (currency !== 'USD') {
          const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
          updatedRates[currency] = updatedRates[currency] * (1 + variation);
        }
      });
      setExchangeRates(updatedRates);
    } catch (error) {
      console.error("Error refreshing exchange rates:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (code: string) => {
    return currencies.find(c => c.code === code)?.symbol || code;
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol} ${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Currency Converter</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshRates}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Enter amount"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label htmlFor="from-currency">From</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSwapCurrencies}
            className="mt-6"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </Button>

          <div className="flex-1">
            <Label htmlFor="to-currency">To</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">
              {formatCurrency(amount, fromCurrency)}
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(convertedAmount, toCurrency)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              1 {fromCurrency} = {(exchangeRates[toCurrency] / exchangeRates[fromCurrency]).toFixed(4)} {toCurrency}
            </div>
          </div>
        </div>

        {onConvert && (
          <Button
            onClick={() => onConvert(amount, fromCurrency, toCurrency, convertedAmount)}
            className="w-full"
            disabled={!amount}
          >
            Use Converted Amount
          </Button>
        )}

        <div className="text-xs text-gray-500 text-center">
          Exchange rates are for demonstration purposes only
        </div>
      </CardContent>
    </Card>
  );
}