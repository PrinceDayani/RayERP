"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";

interface ProjectBalanceSheetProps {
  projectId: string;
}

export default function ProjectBalanceSheet({ projectId }: ProjectBalanceSheetProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Balance Sheet</h3>
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

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Current Assets</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Cash</span>
                      <span>$25,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Accounts Receivable</span>
                      <span>$30,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Work in Progress</span>
                      <span>$15,000</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Fixed Assets</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Equipment</span>
                      <span>$50,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Software</span>
                      <span>$10,000</span>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total Assets</span>
                    <span>$130,000</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Liabilities & Equity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Current Liabilities</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Accounts Payable</span>
                      <span>$15,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Accrued Expenses</span>
                      <span>$5,000</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Long-term Liabilities</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Equipment Loan</span>
                      <span>$25,000</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Equity</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Project Capital</span>
                      <span>$50,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retained Earnings</span>
                      <span>$35,000</span>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total Liabilities & Equity</span>
                    <span>$130,000</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}