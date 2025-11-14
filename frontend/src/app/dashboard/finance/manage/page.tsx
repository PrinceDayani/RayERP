'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Scale, Clock, Lock, Shield, CheckCircle, FileCheck, Zap } from 'lucide-react';

// Import sub-components
import MultiCurrency from './multi-currency';
import TaxManagement from './tax-management';
import AgingAnalysis from './aging-analysis';
import YearEndClosing from './year-end';
import AuditTrail from './audit-trail';
import ApprovalWorkflows from './approvals';
import DocumentManager from './documents';
import SmartAlerts from './smart-alerts';

export default function FinanceManagePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advanced Finance Management</h1>
        <p className="text-gray-600">Enterprise-grade financial tools</p>
      </div>

      <Tabs defaultValue="currency" className="space-y-4">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2">
          <TabsTrigger value="currency"><Globe className="w-4 h-4 mr-2" />Currency</TabsTrigger>
          <TabsTrigger value="tax"><Scale className="w-4 h-4 mr-2" />Tax</TabsTrigger>
          <TabsTrigger value="aging"><Clock className="w-4 h-4 mr-2" />Aging</TabsTrigger>
          <TabsTrigger value="yearend"><Lock className="w-4 h-4 mr-2" />Year-End</TabsTrigger>
          <TabsTrigger value="audit"><Shield className="w-4 h-4 mr-2" />Audit</TabsTrigger>
          <TabsTrigger value="approvals"><CheckCircle className="w-4 h-4 mr-2" />Approvals</TabsTrigger>
          <TabsTrigger value="documents"><FileCheck className="w-4 h-4 mr-2" />Documents</TabsTrigger>
          <TabsTrigger value="alerts"><Zap className="w-4 h-4 mr-2" />Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="currency"><MultiCurrency /></TabsContent>
        <TabsContent value="tax"><TaxManagement /></TabsContent>
        <TabsContent value="aging"><AgingAnalysis /></TabsContent>
        <TabsContent value="yearend"><YearEndClosing /></TabsContent>
        <TabsContent value="audit"><AuditTrail /></TabsContent>
        <TabsContent value="approvals"><ApprovalWorkflows /></TabsContent>
        <TabsContent value="documents"><DocumentManager /></TabsContent>
        <TabsContent value="alerts"><SmartAlerts /></TabsContent>
      </Tabs>
    </div>
  );
}
