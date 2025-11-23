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
  const [fromCurrency, setFromCurrency] = useState("INR");
  const [toCurrency, setToCurrency] = useState("INR");
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const currencies: Currency[] = [
    { code: "INR", name: "Indian Rupee", symbol: "₹", exchangeRate: 1 },
    { code: "USD", name: "US Dollar", symbol: "$", exchangeRate: 83.12 },
    { code: "EUR", name: "Euro", symbol: "€", exchangeRate: 90.45 },
    { code: "GBP", name: "British Pound", symbol: "£", exchangeRate: 105.23 },
    { code: "JPY", name: "Japanese Yen", symbol: "¥", exchangeRate: 0.56 },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", exchangeRate: 61.34 },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", exchangeRate: 54.78 },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF", exchangeRate: 95.67 },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ", exchangeRate: 22.63 },
    { code: "SAR", name: "Saudi Riyal", symbol: "ر.س", exchangeRate: 22.17 },
    { code: "QAR", name: "Qatari Riyal", symbol: "ر.ق", exchangeRate: 22.83 },
    { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", exchangeRate: 270.45 },
    { code: "BHD", name: "Bahraini Dinar", symbol: "د.ب", exchangeRate: 220.34 },
    { code: "OMR", name: "Omani Rial", symbol: "ر.ع", exchangeRate: 216.12 },
    { code: "JOD", name: "Jordanian Dinar", symbol: "د.ا", exchangeRate: 117.23 },
    { code: "ILS", name: "Israeli Shekel", symbol: "₪", exchangeRate: 22.45 },
    { code: "LBP", name: "Lebanese Pound", symbol: "ل.ل", exchangeRate: 0.055 },
    { code: "EGP", name: "Egyptian Pound", symbol: "ج.م", exchangeRate: 2.67 },
    { code: "IQD", name: "Iraqi Dinar", symbol: "ع.د", exchangeRate: 0.063 },
    { code: "SYP", name: "Syrian Pound", symbol: "ل.س", exchangeRate: 0.033 },
    { code: "YER", name: "Yemeni Rial", symbol: "ر.ي", exchangeRate: 0.33 },
    { code: "TRY", name: "Turkish Lira", symbol: "₺", exchangeRate: 2.56 },
    { code: "IRR", name: "Iranian Rial", symbol: "﷼", exchangeRate: 0.002 }
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
      const inrAmount = amount / exchangeRates[fromCurrency];
      const converted = inrAmount * exchangeRates[toCurrency];
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
        if (currency !== 'INR') {
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