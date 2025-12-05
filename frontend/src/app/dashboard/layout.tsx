"use client";

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useEscapeNavigation, useGlobalSearch, useQuickNavigation } from '@/hooks/useKeyboardShortcuts';
import { useFinanceShortcuts } from '@/hooks/useFinanceShortcuts';
import GlobalSearch from '@/components/finance/GlobalSearch';
import ShortcutsPanel from '@/components/ShortcutsPanel';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchType, setSearchType] = useState<'account' | 'entry'>('account');
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  
  useEscapeNavigation();
  useQuickNavigation();
  useFinanceShortcuts();
  useGlobalSearch(
    () => { setSearchType('account'); setSearchOpen(true); },
    () => { setSearchType('entry'); setSearchOpen(true); }
  );

  // Ctrl + K to toggle shortcuts panel
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShortcutsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <ProtectedRoute>
      <Layout>
        {children}
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} type={searchType} />
        <ShortcutsPanel open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      </Layout>
    </ProtectedRoute>
  );
}
