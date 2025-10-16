'use client';

import { useParams } from 'next/navigation';
import AccountLedger from '@/components/finance/AccountLedger';

export default function AccountLedgerPage() {
  const params = useParams();
  const accountId = params.id as string;

  return <AccountLedger accountId={accountId} />;
}