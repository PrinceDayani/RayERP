'use client';

import UserOnboarding from '@/components/admin/UserOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/PageLoader';

export default function OnboardingPage() {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user || user.role.name === 'Normal') return <div>Access denied</div>;

  return <UserOnboarding />;
}
