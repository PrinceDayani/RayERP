import { useEffect, useState } from 'react';

interface UseKeyboardNavigationOptions<T> {
  items: T[];
  onSelect?: (item: T, index: number) => void;
  enabled?: boolean;
}

export function useKeyboardNavigation<T>({ 
  items, 
  onSelect, 
  enabled = true 
}: UseKeyboardNavigationOptions<T>) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    document.getElementById(`row-${selectedIndex}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  useEffect(() => {
    if (!enabled || items.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (onSelect && items[selectedIndex]) {
            onSelect(items[selectedIndex], selectedIndex);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onSelect, enabled]);

  const getRowProps = (index: number) => ({
    id: `row-${index}`,
    className: `cursor-pointer hover:bg-muted/50 transition-colors ${
      index === selectedIndex ? 'bg-primary/10 ring-2 ring-primary' : ''
    }`,
    tabIndex: 0 as const
  });

  return { selectedIndex, setSelectedIndex, getRowProps };
}
