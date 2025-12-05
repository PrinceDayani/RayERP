import { useEffect } from 'react';

export function useDateShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLInputElement;
      if (target.type !== 'date') return;

      const today = new Date();
      let newDate: Date | null = null;

      switch(e.key.toLowerCase()) {
        case 't':
          newDate = today;
          break;
        case 'y':
          newDate = new Date(today);
          newDate.setDate(today.getDate() - 1);
          break;
        case 'm':
          newDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        case '+':
          if (target.value) {
            newDate = new Date(target.value);
            newDate.setDate(newDate.getDate() + 1);
          }
          break;
        case '-':
          if (target.value) {
            newDate = new Date(target.value);
            newDate.setDate(newDate.getDate() - 1);
          }
          break;
        default:
          return;
      }

      if (newDate) {
        e.preventDefault();
        target.value = newDate.toISOString().split('T')[0];
        target.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
