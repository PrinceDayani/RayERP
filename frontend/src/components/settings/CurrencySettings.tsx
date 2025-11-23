"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import toast from "react-hot-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { setNumberFormat, getNumberFormat } from "@/utils/currency";

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN", region: "Asia" },
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US", region: "Americas" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE", region: "Europe" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB", region: "Europe" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP", region: "Asia" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", locale: "en-CA", region: "Americas" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU", region: "Oceania" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", locale: "de-CH", region: "Europe" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", locale: "ar-AE", region: "Middle East" },
  { code: "SAR", symbol: "ر.س", name: "Saudi Riyal", locale: "ar-SA", region: "Middle East" },
  { code: "QAR", symbol: "ر.ق", name: "Qatari Riyal", locale: "ar-QA", region: "Middle East" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar", locale: "ar-KW", region: "Middle East" },
  { code: "BHD", symbol: "د.ب", name: "Bahraini Dinar", locale: "ar-BH", region: "Middle East" },
  { code: "OMR", symbol: "ر.ع", name: "Omani Rial", locale: "ar-OM", region: "Middle East" },
  { code: "JOD", symbol: "د.ا", name: "Jordanian Dinar", locale: "ar-JO", region: "Middle East" },
  { code: "ILS", symbol: "₪", name: "Israeli Shekel", locale: "he-IL", region: "Middle East" },
  { code: "LBP", symbol: "ل.ل", name: "Lebanese Pound", locale: "ar-LB", region: "Middle East" },
  { code: "EGP", symbol: "ج.م", name: "Egyptian Pound", locale: "ar-EG", region: "Middle East" },
  { code: "IQD", symbol: "ع.د", name: "Iraqi Dinar", locale: "ar-IQ", region: "Middle East" },
  { code: "SYP", symbol: "ل.س", name: "Syrian Pound", locale: "ar-SY", region: "Middle East" },
  { code: "YER", symbol: "ر.ي", name: "Yemeni Rial", locale: "ar-YE", region: "Middle East" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", locale: "tr-TR", region: "Middle East" },
  { code: "IRR", symbol: "﷼", name: "Iranian Rial", locale: "fa-IR", region: "Middle East" }
];

export default function CurrencySettings() {
  const { currency, setCurrency: updateCurrency, formatAmount } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [numberFormat, setNumberFormatState] = useState<'indian' | 'international' | 'auto'>('auto');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedCurrency(currency);
    setNumberFormatState(getNumberFormat());
  }, [currency]);

  const handleSave = () => {
    setSaving(true);
    updateCurrency(selectedCurrency);
    setNumberFormat(numberFormat);
    setTimeout(() => {
      setSaving(false);
      toast.success(`Settings saved: ${selectedCurrency} with ${numberFormat} format`);
      window.location.reload(); // Reload to apply changes
    }, 300);
  };

  const selectedCurrencyData = CURRENCIES.find(c => c.code === selectedCurrency);

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="currency">Preferred Currency</Label>
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{curr.symbol}</span>
                    <span className="font-medium">{curr.code}</span>
                    <span className="text-muted-foreground text-xs">- {curr.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="numberFormat">Number Format</Label>
          <Select value={numberFormat} onValueChange={(value: any) => setNumberFormatState(value)}>
            <SelectTrigger id="numberFormat">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                <div className="flex flex-col">
                  <span className="font-medium">Auto (Recommended)</span>
                  <span className="text-xs text-muted-foreground">INR: Lakhs/Crores, Others: Million/Billion</span>
                </div>
              </SelectItem>
              <SelectItem value="indian">
                <div className="flex flex-col">
                  <span className="font-medium">Indian Format</span>
                  <span className="text-xs text-muted-foreground">Lakhs (L) and Crores (Cr)</span>
                </div>
              </SelectItem>
              <SelectItem value="international">
                <div className="flex flex-col">
                  <span className="font-medium">International Format</span>
                  <span className="text-xs text-muted-foreground">Million (M) and Billion (B)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {numberFormat === 'indian' && 'Example: INR 50 L (50 Lakhs), INR 5 Cr (5 Crores)'}
            {numberFormat === 'international' && 'Example: USD 500K, USD 5M (5 Million)'}
            {numberFormat === 'auto' && 'Automatically uses best format for selected currency'}
          </p>
        </div>

        <Card className="bg-slate-50 dark:bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Symbol:</span>
                <span className="font-medium text-lg">{selectedCurrencyData?.symbol}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Code:</span>
                <span className="font-medium">{selectedCurrencyData?.code}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{selectedCurrencyData?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Region:</span>
                <span className="font-medium">{selectedCurrencyData?.region}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Example (Standard):</span>
                <span className="font-medium">{selectedCurrencyData?.code} 1,000.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Example (Large):</span>
                <span className="font-medium">{formatAmount(5000000)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Check className="w-4 h-4 mr-2" />
        {saving ? "Saving..." : "Save Currency Preference"}
      </Button>
    </div>
  );
}
