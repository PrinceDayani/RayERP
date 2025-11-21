// project\frontend\src\context\DashboardContext.tsx

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { initializeSocket, getSocket } from '@/lib/socket';
import reportsAPI from '@/lib/api/reportsAPI';
import analyticsAPI from '@/lib/api/analyticsAPI';
import { toast } from '@/components/ui/use-toast';

interface DashboardContextProps {
  stats: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    lowStockItems: number;
    totalCustomers: number;
    totalProducts: number;
  };
  salesData: any[];
  productData: any[];
  inventoryData: any[];
  recentOrders: any[];
  dataLoading: boolean;
  socketConnected: boolean;
  refreshData: () => Promise<void>;
  isRefreshing: boolean;
}

const DashboardContext = createContext<DashboardContextProps | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    totalCustomers: 0,
    totalProducts: 0,
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [productData, setProductData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      // Fetch all data in parallel for better performance
      const [orderStatsData, customerStatsData, inventorySummaryData] = await Promise.all([
        reportsAPI.getOrderStatus().catch((err: any) => {
          console.error("Error fetching order stats:", err);
          return {};
        }),
        analyticsAPI.getDashboardStats().catch((err: any) => {
          console.error("Error fetching customer stats:", err);
          return {};
        }),
        reportsAPI.getInventoryStatus().catch((err: any) => {
          console.error("Error fetching inventory summary:", err);
          return {};
        })
      ]);

      // Set dashboard stats
      setStats({
        totalOrders: orderStatsData.totalOrders || 0,
        totalRevenue: orderStatsData.totalRevenue || 0,
        pendingOrders: orderStatsData.pendingOrders || 0,
        lowStockItems: inventorySummaryData.lowStockCount || 0,
        totalCustomers: customerStatsData.totalCount || 0,
        totalProducts: inventorySummaryData.totalItems || 0,
      });

      // Set sales data
      if (orderStatsData.monthlySales && Array.isArray(orderStatsData.monthlySales)) {
        setSalesData(orderStatsData.monthlySales.map((item: any) => ({
          name: item.month,
          sales: item.orderCount,
          revenue: item.revenue
        })));
      }

      // Set product category data
      if (orderStatsData.categoryDistribution && Array.isArray(orderStatsData.categoryDistribution)) {
        setProductData(orderStatsData.categoryDistribution.map((item: any) => ({
          name: item.category || 'Unknown',
          value: item.percentage || 0
        })));
      }

      // Set inventory data
      setInventoryData([
        { name: 'In Stock', value: inventorySummaryData.healthyStockCount || 0 },
        { name: 'Low Stock', value: inventorySummaryData.lowStockCount || 0 },
        { name: 'Out of Stock', value: inventorySummaryData.outOfStockCount || 0 },
      ]);

      // Set recent orders
      if (orderStatsData.recentOrders && Array.isArray(orderStatsData.recentOrders)) {
        setRecentOrders(orderStatsData.recentOrders);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setDataLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (!token) {
      setDataLoading(false);
      return;
    }
    
    const socketPromise = initializeSocket();
    
    socketPromise.then(socket => {
      if (!socket) return;
      
      // Connection events
      socket.on("connect", () => {
        console.log("Socket connected in context");
        setSocketConnected(true);
        
        // Clear polling interval if it exists
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        toast({
          title: "Connected",
          description: "Real-time updates are now active",
          variant: "default",
        });
      });

      socket.on("disconnect", (reason: any) => {
        console.log("Socket disconnected in context:", reason);
        setSocketConnected(false);
        
        // Set up polling as fallback
        if (!pollingIntervalRef.current) {
          pollingIntervalRef.current = setInterval(fetchDashboardData, 30000);
          console.log("Falling back to polling every 30 seconds");
        }
      });

      socket.on("connect_error", (err: any) => {
        console.error("Socket connection error in context:", err.message);
        setSocketConnected(false);
        
        // Set up polling as fallback
        if (!pollingIntervalRef.current) {
          pollingIntervalRef.current = setInterval(fetchDashboardData, 30000);
          console.log("Falling back to polling every 30 seconds");
        }
      });

      // Order events
      socket.on("order:new", (order: any) => {
        console.log("New order received:", order);
        
        // Update recent orders
        setRecentOrders((prev) => {
          const newOrders = [order, ...prev];
          return newOrders.slice(0, 5); // Keep only the most recent 5 orders
        });
        
        // Update stats
        setStats((prev) => ({
          ...prev,
          totalOrders: prev.totalOrders + 1,
          totalRevenue: prev.totalRevenue + (order.totalAmount || 0),
          pendingOrders: order.status === "pending" ? prev.pendingOrders + 1 : prev.pendingOrders
        }));
        
        toast({
          title: "New Order",
          description: `Order #${order.orderNumber || order._id} has been placed`,
          variant: "default",
        });
      });

      socket.on("order:updated", (order: any) => {
        // Update recent orders list
        setRecentOrders((prev) => {
          const orderExists = prev.some(o => o._id === order._id);
          
          if (!orderExists) return prev;
          
          return prev.map((o) => {
            if (o._id === order._id) {
              // If status changed from pending to something else
              if (o.status === "pending" && order.status !== "pending") {
                setStats(prevStats => ({
                  ...prevStats,
                  pendingOrders: Math.max(0, prevStats.pendingOrders - 1)
                }));
              }
              // If status changed from something else to pending
              else if (o.status !== "pending" && order.status === "pending") {
                setStats(prevStats => ({
                  ...prevStats,
                  pendingOrders: prevStats.pendingOrders + 1
                }));
              }
              
              return { ...o, ...order };
            }
            return o;
          });
        });
      });

      socket.on("order:deleted", (data: any) => {
        // Check if the deleted order is in our recent orders
        setRecentOrders(prev => {
          const orderToDelete = prev.find(o => o._id === data._id);
          
          if (orderToDelete) {
            // Update stats
            setStats(prevStats => ({
              ...prevStats,
              totalOrders: Math.max(0, prevStats.totalOrders - 1),
              // If deleted order was pending, decrement pending count
              pendingOrders: orderToDelete.status === "pending" 
                ? Math.max(0, prevStats.pendingOrders - 1) 
                : prevStats.pendingOrders
            }));
          }
          
          // Remove the order from the list
          return prev.filter(o => o._id !== data._id);
        });
      });

      // Initial data fetch
      fetchDashboardData();

      // Cleanup on unmount
      return () => {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
        socket.off("order:new");
        socket.off("order:updated");
        socket.off("order:deleted");
        
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }).catch(() => {
      // If socket initialization failed, fall back to regular data fetching
      fetchDashboardData();
    });
  }, [fetchDashboardData]);

  return (
    <DashboardContext.Provider
      value={{
        stats,
        salesData,
        productData,
        inventoryData,
        recentOrders,
        dataLoading,
        socketConnected,
        refreshData: fetchDashboardData,
        isRefreshing
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};