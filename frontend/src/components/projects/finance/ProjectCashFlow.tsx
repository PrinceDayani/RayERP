"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";

interface ProjectCashFlowProps {
  projectId: string;
}

export default function ProjectCashFlow({ projectId }: ProjectCashFlowProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Cash Flow Statement</h3>
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
            <CardTitle className="text-green-600">Operating Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Cash Receipts</span>
                <span className="font-medium">₹120,000</span>
              </div>
              <div className="flex justify-between">
                <span>Cash Payments</span>
                <span className="font-medium text-red-600">(₹95,000)</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>Net Operating Cash Flow</span>
                <span className="text-green-600">₹25,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Investing Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Equipment Purchase</span>
                <span className="font-medium text-red-600">(₹60,000)</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>Net Investing Cash Flow</span>
                <span className="text-red-600">(₹60,000)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-purple-600">Financing Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Project Funding</span>
                <span className="font-medium">₹50,000</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>Net Financing Cash Flow</span>
                <span className="text-green-600">₹50,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Cash Flow Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Opening Cash Balance</span>
                <span className="font-medium">₹10,000</span>
              </div>
              <div className="flex justify-between">
                <span>Net Cash Flow</span>
                <span className="font-medium">₹15,000</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold text-lg">
                <span>Closing Cash Balance</span>
                <span className="text-green-600">₹25,000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}