"use client";

import React from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <Layout>
        {children}
      </Layout>
    </ProtectedRoute>
  );
}
