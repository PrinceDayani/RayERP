import { useState, useEffect } from "react";
import { tasksAPI } from "@/lib/api/tasksAPI";

export function useTaskAnalytics(projectId?: string, startDate?: string, endDate?: string) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [velocity, setVelocity] = useState<any>(null);
  const [teamPerformance, setTeamPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [projectId, startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsData, velocityData, teamData] = await Promise.all([
        tasksAPI.getAnalytics(projectId, startDate, endDate),
        tasksAPI.getVelocity(projectId),
        tasksAPI.getTeamPerformance(projectId),
      ]);

      setAnalytics(analyticsData);
      setVelocity(velocityData);
      setTeamPerformance(teamData);
    } catch (err) {
      setError("Failed to fetch analytics");
      console.error("Analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchAnalytics();
  };

  return {
    analytics,
    velocity,
    teamPerformance,
    loading,
    error,
    refresh,
  };
}
