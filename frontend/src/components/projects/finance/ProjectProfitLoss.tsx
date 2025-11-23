"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";

interface ProjectProfitLossProps {
  projectId: string;
}

export default function ProjectProfitLoss({ projectId }: ProjectProfitLossProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Profit & Loss Statement</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Contract Value</span>
                <span className="font-medium">₹150,000</span>
              </div>
              <div className="flex justify-between">
                <span>Billed Amount</span>
                <span className="font-medium">₹120,000</span>
              </div>
              <div className="flex justify-between">
                <span>Unbilled Amount</span>
                <span className="font-medium">₹30,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Direct Costs</span>
                <span className="font-medium">₹80,000</span>
              </div>
              <div className="flex justify-between">
                <span>Indirect Costs</span>
                <span className="font-medium">₹15,000</span>
              </div>
              <div className="flex justify-between">
                <span>Overheads</span>
                <span className="font-medium">₹10,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Gross Profit</span>
                <span className="font-medium text-green-600">₹45,000</span>
              </div>
              <div className="flex justify-between">
                <span>Net Profit</span>
                <span className="font-medium text-green-600">₹35,000</span>
              </div>
              <div className="flex justify-between">
                <span>Profit Margin</span>
                <span className="font-medium">23.33%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}