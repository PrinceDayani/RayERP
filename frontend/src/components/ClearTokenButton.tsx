'use client';

import { Button } from './ui/button';

export default function ClearTokenButton() {
  const handleClear = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <Button onClick={handleClear} variant="destructive">
      Clear Session & Login Again
    </Button>
  );
}
