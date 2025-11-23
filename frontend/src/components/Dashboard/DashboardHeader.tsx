'use client';

import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Wifi, WifiOff } from "lucide-react";

interface DashboardHeaderProps {
  user: any;
  isAuthenticated: boolean;
  socketConnected: boolean;
  refreshData?: () => void;
  dashboardStats?: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    lowStockItems: number;
  };
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  user, 
  isAuthenticated,
  socketConnected,
  refreshData,
  dashboardStats
}) => {
  // Get current date and time
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(currentDate);
  
  // Format time
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(currentDate);

  // Format currency using context
  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      maximumFractionDigits: 0 
    }).format(amount);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Calendar className="mr-1 h-4 w-4" />
            <span>{formattedDate}</span>
            <span className="mx-2">•</span>
            <Clock className="mr-1 h-4 w-4" />
            <span>{formattedTime}</span>
            {isAuthenticated && (
              <>
                <span className="mx-2">•</span>
                {socketConnected ? (
                  <div className="flex items-center text-green-600">
                    <Wifi className="mr-1 h-4 w-4" />
                    <span>Live</span>
                  </div>
                ) : (
                  <div className="flex items-center text-amber-600">
                    <WifiOff className="mr-1 h-4 w-4" />
                    <span>Polling</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          {isAuthenticated && (
            <>
              <Button 
                variant="outline" 
                className="h-9"
                onClick={() => {
                  if (refreshData) {
                    refreshData();
                    // Show a brief loading state or toast
                    const button = document.activeElement as HTMLButtonElement;
                    if (button) {
                      const originalText = button.textContent;
                      button.textContent = 'Refreshing...';
                      button.disabled = true;
                      setTimeout(() => {
                        button.textContent = originalText;
                        button.disabled = false;
                      }, 1000);
                    }
                  }
                }}
              >
                Refresh Dashboard
              </Button>

            </>
          )}
        </div>
      </div>

      {isAuthenticated && dashboardStats && (
        <Card className="bg-white dark:bg-gray-950">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h2 className="text-2xl font-bold">
                  {formatCurrency(dashboardStats.totalRevenue)}
                </h2>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <h2 className="text-2xl font-bold">{dashboardStats.totalOrders}</h2>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                <h2 className="text-2xl font-bold">{dashboardStats.pendingOrders}</h2>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                <h2 className="text-2xl font-bold">{dashboardStats.lowStockItems}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardHeader;