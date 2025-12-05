'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getNumberFormat, setNumberFormat, type NumberFormat } from '@/utils/currency';
import { useState, useEffect } from 'react';

export default function NumberFormatSwitcher() {
  const [format, setFormat] = useState<NumberFormat>('indian');

  useEffect(() => {
    setFormat(getNumberFormat());
  }, []);

  const handleChange = (value: NumberFormat) => {
    setFormat(value);
    setNumberFormat(value);
    window.location.reload(); // Reload to apply changes
  };

  return (
    <Select value={format} onValueChange={handleChange}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="indian">Indian</SelectItem>
        <SelectItem value="international">International</SelectItem>
        <SelectItem value="auto">Auto</SelectItem>
      </SelectContent>
    </Select>
  );
}
