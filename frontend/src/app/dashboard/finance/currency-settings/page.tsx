'use client';

import CurrencySettings from '@/components/finance/CurrencySettings';

export default function CurrencySettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Currency Settings</h1>
      <CurrencySettings />
    </div>
  );
}
