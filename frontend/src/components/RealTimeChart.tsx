"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


interface ChartData {
  time: string;
  revenue: number;
  users: number;
  orders: number;
}

export default function RealTimeChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeString = now.toLocaleTimeString();
      
      setChartData(prev => {
        const newData = [
          ...prev,
          {
            time: timeString,
            revenue: Math.floor(Math.random() * 5000) + 1000,
            users: Math.floor(Math.random() * 50) + 10,
            orders: Math.floor(Math.random() * 20) + 5
          }
        ].slice(-20); // Keep only last 20 data points
        
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Real-Time Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Revenue ($)"
              />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Active Users"
              />
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke="#ffc658" 
                strokeWidth={2}
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}