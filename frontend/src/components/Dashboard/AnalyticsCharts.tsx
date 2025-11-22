"use client";

import React, { memo, useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart4, Activity, Users } from "lucide-react";

interface AnalyticsChartsProps {
  monthlyRevenue: Array<{ month: string; revenue: number; expenses: number }>;
  taskDistribution: Array<{ name: string; value: number }>;
  teamProductivity: Array<{ name: string; completed: number; pending: number }>;
}

const AnalyticsCharts = memo(function AnalyticsCharts({ monthlyRevenue, taskDistribution, teamProductivity }: AnalyticsChartsProps) {
  const pieColors = useMemo(() => ['#10b981', '#3b82f6', '#f59e0b'], []);
  
  const chartConfig = useMemo(() => ({
    fontSize: '12px',
    fontFamily: 'inherit'
  }), []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <BarChart4 className="h-4 w-4 mr-2" />Revenue vs Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" style={chartConfig} />
              <YAxis style={chartConfig} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="expenses" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <Activity className="h-4 w-4 mr-2" />Task Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={taskDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
              >
                {taskDistribution.map((entry, index) => (
                  <Cell key={entry.name} fill={pieColors[index % 3]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <Users className="h-4 w-4 mr-2" />Team Productivity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={teamProductivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" style={chartConfig} />
              <YAxis style={chartConfig} />
              <Tooltip />
              <Bar dataKey="completed" fill="#10b981" />
              <Bar dataKey="pending" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
});

export default AnalyticsCharts;
