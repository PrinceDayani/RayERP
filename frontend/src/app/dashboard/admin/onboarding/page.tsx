'use client';

import UserOnboarding from '@/components/admin/UserOnboarding';
import { useAuth } from '@/contexts/AuthContext';

export default function OnboardingPage() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user || user.role.name === 'Normal') return <div>Access denied</div>;

  return <UserOnboarding />;
}
