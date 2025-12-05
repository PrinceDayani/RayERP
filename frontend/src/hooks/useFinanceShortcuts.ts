import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useFinanceShortcuts = () => {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;

      const shortcuts: Record<string, string> = {
        'j': '/dashboard/finance/journal-entry',
        'a': '/dashboard/finance/accounts',
        'l': '/dashboard/finance/account-ledger',
        'c': '/dashboard/finance/chart-of-accounts',
        'i': '/dashboard/finance/invoices',
        'p': '/dashboard/finance/payments',
        'b': '/dashboard/finance/bills',
        't': '/dashboard/finance/trial-balance',
        's': '/dashboard/finance/balance-sheet',
        'f': '/dashboard/finance/cash-flow',
        'r': '/dashboard/finance/reports',
        'v': '/dashboard/finance/vouchers',
        'm': '/dashboard/finance/master-ledger',
        'x': '/dashboard/finance/tax-management',
        'k': '/dashboard/finance/bank-reconciliation',
        'g': '/dashboard/finance/aging-analysis',
        'd': '/dashboard/finance/documents',
        'u': '/dashboard/finance/audit-trail',
        'o': '/dashboard/finance/cost-centers',
        'y': '/dashboard/finance/currency-settings',
        'n': '/dashboard/finance/multi-currency',
        'e': '/dashboard/finance/recurring-entries',
        'w': '/dashboard/finance/approvals',
        '1': '/dashboard/finance/smart-alerts',
        'z': '/dashboard/finance/year-end',
      };

      const path = shortcuts[e.key.toLowerCase()];
      if (path) {
        e.preventDefault();
        router.push(path);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
};
