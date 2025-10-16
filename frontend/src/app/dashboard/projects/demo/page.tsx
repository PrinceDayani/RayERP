"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectProfitLoss from "@/components/projects/finance/ProjectProfitLoss";
import ProjectTrialBalance from "@/components/projects/finance/ProjectTrialBalance";
import ProjectBalanceSheet from "@/components/projects/finance/ProjectBalanceSheet";
import ProjectCashFlow from "@/components/projects/finance/ProjectCashFlow";
import ProjectLedger from "@/components/projects/finance/ProjectLedger";

const DemoFinancePage = () => {
  return (
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Demo Project Finance</h1>
          <p className="text-muted-foreground">Testing all finance components</p>
        </div>

        <Tabs defaultValue="profit-loss" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
            <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
            <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
            <TabsTrigger value="ledger">Ledger & Journal</TabsTrigger>
          </TabsList>

          <TabsContent value="profit-loss">
            <ProjectProfitLoss projectId="demo-123" />
          </TabsContent>

          <TabsContent value="trial-balance">
            <ProjectTrialBalance projectId="demo-123" />
          </TabsContent>

          <TabsContent value="balance-sheet">
            <ProjectBalanceSheet projectId="demo-123" />
          </TabsContent>

          <TabsContent value="cash-flow">
            <ProjectCashFlow projectId="demo-123" />
          </TabsContent>

          <TabsContent value="ledger">
            <ProjectLedger projectId="demo-123" />
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default DemoFinancePage;