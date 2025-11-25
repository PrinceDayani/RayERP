"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Activity
} from "lucide-react";

interface AttendanceData {
  date: string;
  checkIn?: string;
  checkOut?: string;
  totalHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  breakTime?: number;
}

interface AttendanceInsightsProps {
  employeeId: string;
  attendanceData: AttendanceData[];
  period?: 'week' | 'month' | 'quarter' | 'year';
}

export default function AttendanceInsights({ employeeId, attendanceData, period = 'month' }: AttendanceInsightsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [insights, setInsights] = useState({
    totalDays: 0,
    presentDays: 0,
    lateDays: 0,
    halfDays: 0,
    absentDays: 0,
    totalHours: 0,
    averageHours: 0,
    attendanceRate: 0,
    punctualityRate: 0,
    consistencyScore: 0,
    trends: {
      hoursChange: 0,
      attendanceChange: 0,
      punctualityChange: 0
    },
    patterns: {
      mostProductiveDay: '',
      leastProductiveDay: '',
      averageCheckIn: '',
      averageCheckOut: '',
      peakHours: []
    }
  });

  useEffect(() => {
    calculateInsights();
  }, [attendanceData, selectedPeriod]);

  const calculateInsights = () => {
    if (!attendanceData.length) return;

    const totalDays = attendanceData.length;
    const presentDays = attendanceData.filter(d => d.status === 'present').length;
    const lateDays = attendanceData.filter(d => d.status === 'late').length;
    const halfDays = attendanceData.filter(d => d.status === 'half-day').length;
    const absentDays = attendanceData.filter(d => d.status === 'absent').length;
    
    const totalHours = attendanceData.reduce((sum, d) => sum + d.totalHours, 0);
    const averageHours = totalHours / Math.max(presentDays + lateDays + halfDays, 1);
    
    const attendanceRate = ((presentDays + lateDays + halfDays) / totalDays) * 100;
    const punctualityRate = (presentDays / Math.max(presentDays + lateDays, 1)) * 100;
    
    // Calculate consistency score based on variance in daily hours
    const workingDays = attendanceData.filter(d => d.status !== 'absent');
    const hoursVariance = calculateVariance(workingDays.map(d => d.totalHours));
    const consistencyScore = Math.max(0, 100 - (hoursVariance * 10));

    // Calculate day-wise patterns
    const dayWiseHours = calculateDayWiseHours();
    const mostProductiveDay = Object.entries(dayWiseHours).reduce((a, b) => 
      dayWiseHours[a[0]] > dayWiseHours[b[0]] ? a : b
    )[0];
    const leastProductiveDay = Object.entries(dayWiseHours).reduce((a, b) => 
      dayWiseHours[a[0]] < dayWiseHours[b[0]] ? a : b
    )[0];

    // Calculate average check-in and check-out times
    const checkInTimes = attendanceData.filter(d => d.checkIn).map(d => new Date(`2000-01-01T${d.checkIn}`));
    const checkOutTimes = attendanceData.filter(d => d.checkOut).map(d => new Date(`2000-01-01T${d.checkOut}`));
    
    const averageCheckIn = calculateAverageTime(checkInTimes);
    const averageCheckOut = calculateAverageTime(checkOutTimes);

    setInsights({
      totalDays,
      presentDays,
      lateDays,
      halfDays,
      absentDays,
      totalHours,
      averageHours,
      attendanceRate,
      punctualityRate,
      consistencyScore,
      trends: {
        hoursChange: 0, // Would need historical data to calculate
        attendanceChange: 0,
        punctualityChange: 0
      },
      patterns: {
        mostProductiveDay,
        leastProductiveDay,
        averageCheckIn,
        averageCheckOut,
        peakHours: []
      }
    });
  };

  const calculateVariance = (numbers: number[]) => {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  };

  const calculateDayWiseHours = () => {
    const dayWise: Record<string, number> = {
      'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0, 'Saturday': 0, 'Sunday': 0
    };
    const dayCounts: Record<string, number> = {
      'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0, 'Saturday': 0, 'Sunday': 0
    };

    attendanceData.forEach(d => {
      if (d.status !== 'absent') {
        const dayName = new Date(d.date).toLocaleDateString('en-US', { weekday: 'long' });
        dayWise[dayName] += d.totalHours;
        dayCounts[dayName]++;
      }
    });

    // Calculate averages
    Object.keys(dayWise).forEach(day => {
      dayWise[day] = dayCounts[day] > 0 ? dayWise[day] / dayCounts[day] : 0;
    });

    return dayWise;
  };

  const calculateAverageTime = (times: Date[]) => {
    if (times.length === 0) return '';
    const totalMinutes = times.reduce((sum, time) => {
      return sum + time.getHours() * 60 + time.getMinutes();
    }, 0);
    const avgMinutes = totalMinutes / times.length;
    const hours = Math.floor(avgMinutes / 60);
    const minutes = Math.floor(avgMinutes % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-green-500' };
    if (score >= 75) return { label: 'Good', color: 'bg-blue-500' };
    if (score >= 60) return { label: 'Average', color: 'bg-yellow-500' };
    return { label: 'Needs Improvement', color: 'bg-red-500' };
  };

  return (
    <div className="space-y-6">
      {/* Header with Period Selection */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Attendance Insights
        </h3>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(insights.attendanceRate)}`}>
              {insights.attendanceRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Attendance Rate</div>
            <Badge className={`${getScoreBadge(insights.attendanceRate).color} text-white mt-1`}>
              {getScoreBadge(insights.attendanceRate).label}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(insights.punctualityRate)}`}>
              {insights.punctualityRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Punctuality Rate</div>
            <Badge className={`${getScoreBadge(insights.punctualityRate).color} text-white mt-1`}>
              {getScoreBadge(insights.punctualityRate).label}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(insights.consistencyScore)}`}>
              {insights.consistencyScore.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Consistency Score</div>
            <Badge className={`${getScoreBadge(insights.consistencyScore).color} text-white mt-1`}>
              {getScoreBadge(insights.consistencyScore).label}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {insights.averageHours.toFixed(1)}h
            </div>
            <div className="text-sm text-muted-foreground">Avg Hours/Day</div>
            <div className="text-xs text-muted-foreground mt-1">
              {insights.totalHours.toFixed(1)}h total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Attendance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm">Present Days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{insights.presentDays}</span>
                <Progress value={(insights.presentDays / insights.totalDays) * 100} className="w-20 h-2" />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Late Days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{insights.lateDays}</span>
                <Progress value={(insights.lateDays / insights.totalDays) * 100} className="w-20 h-2" />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Half Days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{insights.halfDays}</span>
                <Progress value={(insights.halfDays / insights.totalDays) * 100} className="w-20 h-2" />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm">Absent Days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{insights.absentDays}</span>
                <Progress value={(insights.absentDays / insights.totalDays) * 100} className="w-20 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Work Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-sm text-muted-foreground">Most Productive</div>
                <div className="font-semibold text-green-700 dark:text-green-400">
                  {insights.patterns.mostProductiveDay}
                </div>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="text-sm text-muted-foreground">Least Productive</div>
                <div className="font-semibold text-orange-700 dark:text-orange-400">
                  {insights.patterns.leastProductiveDay}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-sm text-muted-foreground">Avg Check-in</div>
                <div className="font-semibold text-blue-700 dark:text-blue-400">
                  {insights.patterns.averageCheckIn || 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="text-sm text-muted-foreground">Avg Check-out</div>
                <div className="font-semibold text-purple-700 dark:text-purple-400">
                  {insights.patterns.averageCheckOut || 'N/A'}
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Performance Summary</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Reliability:</span>
                  <span className={getScoreColor(insights.attendanceRate)}>
                    {insights.attendanceRate > 95 ? 'Excellent' : 
                     insights.attendanceRate > 85 ? 'Good' : 
                     insights.attendanceRate > 75 ? 'Average' : 'Poor'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Punctuality:</span>
                  <span className={getScoreColor(insights.punctualityRate)}>
                    {insights.punctualityRate > 95 ? 'Excellent' : 
                     insights.punctualityRate > 85 ? 'Good' : 
                     insights.punctualityRate > 75 ? 'Average' : 'Poor'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Consistency:</span>
                  <span className={getScoreColor(insights.consistencyScore)}>
                    {insights.consistencyScore > 90 ? 'Very Consistent' : 
                     insights.consistencyScore > 75 ? 'Consistent' : 
                     insights.consistencyScore > 60 ? 'Moderate' : 'Inconsistent'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {(insights.attendanceRate < 90 || insights.punctualityRate < 90) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Improvement Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.attendanceRate < 90 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-800 dark:text-yellow-200">
                      Improve Attendance Rate
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      Current rate is {insights.attendanceRate.toFixed(1)}%. Consider setting reminders and planning ahead for better attendance.
                    </div>
                  </div>
                </div>
              )}
              
              {insights.punctualityRate < 90 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-800 dark:text-blue-200">
                      Improve Punctuality
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Current rate is {insights.punctualityRate.toFixed(1)}%. Try adjusting your morning routine to arrive on time consistently.
                    </div>
                  </div>
                </div>
              )}

              {insights.consistencyScore < 75 && (
                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-purple-800 dark:text-purple-200">
                      Improve Consistency
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                      Work hours vary significantly. Try to maintain consistent daily schedules for better work-life balance.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}