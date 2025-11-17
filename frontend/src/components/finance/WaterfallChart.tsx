"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";

interface WaterfallData {
  label: string;
  value: number;
  isTotal?: boolean;
}

interface WaterfallChartProps {
  data: WaterfallData[];
}

export function WaterfallChart({ data }: WaterfallChartProps) {
  let runningTotal = 0;
  const maxValue = Math.max(...data.map(d => Math.abs(d.value)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue to Net Income Waterfall</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, idx) => {
            const prevTotal = runningTotal;
            runningTotal += item.value;
            const height = Math.abs(item.value) / maxValue * 100;
            const isPositive = item.value >= 0;

            return (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium">{item.label}</div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="relative w-full h-12 bg-gray-100 rounded">
                    <div
                      className={`absolute h-full rounded ${
                        item.isTotal
                          ? 'bg-blue-500'
                          : isPositive
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${height}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                      ₹{Math.abs(item.value).toLocaleString()}
                    </div>
                  </div>
                  {!item.isTotal && (
                    isPositive ? (
                      <ArrowUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowDown className="h-5 w-5 text-red-600" />
                    )
                  )}
                </div>
                <div className="w-32 text-right text-sm font-medium">
                  ₹{runningTotal.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
