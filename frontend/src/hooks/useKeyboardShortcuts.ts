import { useEffect, useRef } from 'react';

interface KeyboardShortcut {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  callback: () => void;
}

interface SequenceShortcut {
  sequence: string[];
  altKey?: boolean;
  callback: () => void;
}

const isTyping = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e)) return;

      shortcuts.forEach(({ key, altKey, ctrlKey, shiftKey, callback }) => {
        if (
          e.key.toLowerCase() === key.toLowerCase() &&
          (altKey === undefined || e.altKey === altKey) &&
          (ctrlKey === undefined || e.ctrlKey === ctrlKey) &&
          (shiftKey === undefined || e.shiftKey === shiftKey)
        ) {
          e.preventDefault();
          callback();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export function useSequenceShortcut({ sequence, altKey, callback }: SequenceShortcut) {
  const keysPressed = useRef<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      if (altKey && !e.altKey) return;
      
      const key = e.key.toLowerCase();
      keysPressed.current.push(key);
      
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        keysPressed.current = [];
      }, 1000);
      
      if (keysPressed.current.length === sequence.length) {
        const match = sequence.every((k, i) => k.toLowerCase() === keysPressed.current[i]);
        if (match) {
          e.preventDefault();
          callback();
          keysPressed.current = [];
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutRef.current);
    };
  }, [sequence, altKey, callback]);
}

export function useCreateAccountShortcut(onOpen: () => void) {
  useKeyboardShortcuts([
    { key: 'c', altKey: true, callback: onOpen }
  ]);
}

export function useCreateAccountTypeShortcut(onOpen: () => void) {
  useSequenceShortcut({
    sequence: ['a', 't'],
    altKey: true,
    callback: onOpen
  });
}

export function useCreateEntryShortcut(onOpen: () => void, accountSpecific?: boolean) {
  const keysPressed = useRef<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      if (!e.altKey) return;
      
      const key = e.key.toLowerCase();
      if (key !== 'x') return;
      
      keysPressed.current.push(key);
      
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        keysPressed.current = [];
      }, 500);
      
      if (keysPressed.current.length === 1) {
        setTimeout(() => {
          if (keysPressed.current.length === 1) {
            e.preventDefault();
            onOpen();
            keysPressed.current = [];
          }
        }, 300);
      }
      
      if (keysPressed.current.length === 2 && accountSpecific) {
        e.preventDefault();
        window.location.href = '/dashboard/finance/journal-entry';
        keysPressed.current = [];
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutRef.current);
    };
  }, [onOpen, accountSpecific]);
}

export function useEscapeNavigation() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA' || activeElement.isContentEditable) {
          activeElement.blur();
          return;
        }
        
        if (document.querySelector('[role="dialog"]')) {
          return;
        }
        
        window.history.back();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

export function useGlobalSearch(onSearchAccount: () => void, onSearchEntry: () => void) {
  const keysPressed = useRef<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      
      if (!e.altKey) {
        keysPressed.current = [];
        return;
      }
      
      const key = e.key.toLowerCase();
       if (key === 's') {
        e.preventDefault();
        keysPressed.current = ['s'];
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          keysPressed.current = [];
        }, 1000);
        return;
      }
      
      if (keysPressed.current[0] === 's') {
        if (key === 'a') {
          e.preventDefault();
          onSearchAccount();
          keysPressed.current = [];
        } else if (key === 'e') {
          e.preventDefault();
          onSearchEntry();
          keysPressed.current = [];
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutRef.current);
    };
  }, [onSearchAccount, onSearchEntry]);
}

export function useQuickNavigation() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      if (!e.altKey) return;
      
      const key = e.key.toLowerCase();
      if (key === 'h') {
        e.preventDefault();
        window.location.href = '/dashboard';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
