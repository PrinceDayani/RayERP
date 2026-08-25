"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/contexts/PreferencesContext";
import type { NumberFormat } from "@/lib/api/preferencesAPI";
import { useCurrency } from "@/contexts/CurrencyContext";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", region: "Asia" },
  { code: "USD", symbol: "$", name: "US Dollar", region: "Americas" },
  { code: "EUR", symbol: "€", name: "Euro", region: "Europe" },
  { code: "GBP", symbol: "£", name: "British Pound", region: "Europe" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", region: "Asia" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", region: "Americas" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", region: "Oceania" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", region: "Europe" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", region: "Middle East" },
  { code: "SAR", symbol: "ر.س", name: "Saudi Riyal", region: "Middle East" },
  { code: "QAR", symbol: "ر.ق", name: "Qatari Riyal", region: "Middle East" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar", region: "Middle East" },
  { code: "BHD", symbol: "د.ب", name: "Bahraini Dinar", region: "Middle East" },
  { code: "OMR", symbol: "ر.ع", name: "Omani Rial", region: "Middle East" },
  { code: "JOD", symbol: "د.ا", name: "Jordanian Dinar", region: "Middle East" },
  { code: "ILS", symbol: "₪", name: "Israeli Shekel", region: "Middle East" },
  { code: "LBP", symbol: "ل.ل", name: "Lebanese Pound", region: "Middle East" },
  { code: "EGP", symbol: "ج.م", name: "Egyptian Pound", region: "Middle East" },
  { code: "IQD", symbol: "ع.د", name: "Iraqi Dinar", region: "Middle East" },
  { code: "SYP", symbol: "ل.س", name: "Syrian Pound", region: "Middle East" },
  { code: "YER", symbol: "ر.ي", name: "Yemeni Rial", region: "Middle East" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", region: "Middle East" },
  { code: "IRR", symbol: "﷼", name: "Iranian Rial", region: "Middle East" }
];

const FORMAT_OPTIONS: Array<{ value: NumberFormat; label: string; hint: string; example: string }> = [
  {
    value: "auto",
    label: "Auto (Recommended)",
    hint: "INR uses lakhs and crores, other currencies use millions and billions",
    example: "Chosen automatically for the selected currency"
  },
  {
    value: "indian",
    label: "Indian Format",
    hint: "Lakhs (L) and Crores (Cr)",
    example: "50 L (50 Lakhs) · 5 Cr (5 Crores)"
  },
  {
    value: "international",
    label: "International Format",
    hint: "Million (M) and Billion (B)",
    example: "500K · 5M (5 Million)"
  }
];

export default function CurrencySettings() {
  const { preferences, loading, saveState, saveError, update, flush } = usePreferences();
  const { formatCurrency } = useCurrency();

  const selected = useMemo(
    () => CURRENCIES.find(currency => currency.code === preferences.currency),
    [preferences.currency]
  );

  const activeFormat = useMemo(
    () => FORMAT_OPTIONS.find(option => option.value === preferences.numberFormat),
    [preferences.numberFormat]
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-11 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-11 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-40 rounded-xl bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{saveError} Your changes are not stored yet.</span>
            <Button variant="outline" size="sm" onClick={() => flush()} disabled={saveState === 'saving'}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5">
        <div className="space-y-2">
          <Label htmlFor="currency">Preferred Currency</Label>
          <Select value={preferences.currency} onValueChange={value => update({ currency: value })}>
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(currency => (
                <SelectItem key={currency.code} value={currency.code}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currency.symbol}</span>
                    <span className="font-medium">{currency.code}</span>
                    <span className="text-xs text-muted-foreground">- {currency.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Controls how amounts are displayed to you. It does not convert stored values or change the
            organisation's base currency.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="numberFormat">Number Format</Label>
          <Select
            value={preferences.numberFormat}
            onValueChange={value => update({ numberFormat: value as NumberFormat })}
          >
            <SelectTrigger id="numberFormat">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMAT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.hint}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeFormat && <p className="text-xs text-muted-foreground">Example: {activeFormat.example}</p>}
        </div>

        <Card className="bg-slate-50 dark:bg-slate-800/50">
          <CardContent className="space-y-2 pt-6 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Symbol</span>
              <span className="text-lg font-medium">{selected?.symbol ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Code</span>
              <span className="font-medium">{preferences.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{selected?.name ?? 'Custom currency'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Region</span>
              <span className="font-medium">{selected?.region ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Large amount</span>
              <span className="font-medium">{formatCurrency(5000000, preferences.currency)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-800/50">
        {saveState === 'saving' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving…</span>
          </>
        ) : saveState === 'error' ? (
          <>
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span>Your last change could not be saved</span>
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Saved to your account and applied across your devices</span>
          </>
        )}
      </div>
    </div>
  );
}
