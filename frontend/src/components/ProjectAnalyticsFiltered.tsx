"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart3, Users as UsersIcon, AlertTriangle, DollarSign, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FilteredAnalyticsProps {
  view: 'all' | 'performance' | 'charts' | 'resources' | 'risks';
  burndown: any;
  velocity: any;
  utilization: any;
  performance: any;
  risk: any;
}

export default function ProjectAnalyticsFiltered({ view, burndown, velocity, utilization, performance, risk }: FilteredAnalyticsProps) {
  
  const renderPerformanceCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            CPI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${performance?.cpi >= 1 ? 'text-green-600' : 'text-red-600'}`}>
            {performance?.cpi || '0.00'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Cost Performance Index</p>
          <p className="text-xs font-medium mt-1">{performance?.cpi >= 1 ? '✓ Under Budget' : '⚠ Over Budget'}</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            SPI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${performance?.spi >= 1 ? 'text-green-600' : 'text-red-600'}`}>
            {performance?.spi || '0.00'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Schedule Performance Index</p>
          <p className="text-xs font-medium mt-1">{performance?.spi >= 1 ? '✓ On Schedule' : '⚠ Behind Schedule'}</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-orange-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
            Risk Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${
            risk?.overallRisk === 'low' ? 'text-green-600' : 
            risk?.overallRisk === 'medium' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {risk?.overallRisk?.toUpperCase() || 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{risk?.riskCount || 0} risks identified</p>
          <p className="text-xs font-medium mt-1 capitalize">{risk?.projectHealth || 'Unknown'}</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-purple-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-purple-500"></div>
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold capitalize">{performance?.status || 'N/A'}</div>
          <p className="text-xs text-muted-foreground mt-1">Project Health</p>
          <p className="text-xs font-medium mt-1">Overall Status</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderCharts = () => (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Burndown Chart
          </CardTitle>
          <p className="text-sm text-muted-foreground">Track work completion over time</p>
        </CardHeader>
        <CardContent className="pt-6">
          {burndown?.burndownData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={burndown.burndownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ideal" stroke="#888" strokeDasharray="5 5" name="Ideal" />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No burndown data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Team Velocity
          </CardTitle>
          <p className="text-sm text-muted-foreground">Average: {velocity?.avgVelocity?.toFixed(1) || 0} hrs/week</p>
        </CardHeader>
        <CardContent className="pt-6">
          {velocity?.velocityData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={velocity.velocityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="velocity" fill="#10b981" name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No velocity data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );

  const renderResources = () => (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardTitle className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-purple-600" />
          Resource Utilization
        </CardTitle>
        <p className="text-sm text-muted-foreground">Team member workload analysis</p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {utilization?.utilizationData?.length > 0 ? (
            utilization.utilizationData.map((u: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div>
                  <p className="font-medium">{u.user?.firstName} {u.user?.lastName}</p>
                  <p className="text-sm text-muted-foreground">
                    {u.completedTasks}/{u.totalTasks} tasks • {u.actualHours}/{u.estimatedHours} hrs
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{u.completionRate?.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Completion</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No team members assigned</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderRisks = () => (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Risk Assessment
        </CardTitle>
        <p className="text-sm text-muted-foreground">Identified project risks and issues</p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-2">
          {risk?.risks?.map((r: any, i: number) => (
            <div key={i} className={`p-4 rounded-lg border-l-4 ${
              r.severity === 'critical' ? 'border-red-600 bg-red-50 dark:bg-red-950' :
              r.severity === 'high' ? 'border-orange-600 bg-orange-50 dark:bg-orange-950' :
              r.severity === 'medium' ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-950' :
              'border-blue-600 bg-blue-50 dark:bg-blue-950'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">{r.message}</p>
                  <p className="text-sm text-muted-foreground mt-1">Type: {r.type}</p>
                </div>
                <Badge variant={r.severity === 'critical' || r.severity === 'high' ? 'destructive' : 'secondary'}>
                  {r.severity.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
          {risk?.risks?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-green-600 font-medium">✓ No risks identified</p>
              <p className="text-sm text-muted-foreground mt-2">Project is healthy</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (view === 'performance') {
    return (
      <div className="space-y-6">
        {renderPerformanceCards()}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Planned Value</span>
                <span className="font-bold">${performance?.plannedValue?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Earned Value</span>
                <span className="font-bold">${performance?.earnedValue?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Actual Cost</span>
                <span className="font-bold">${performance?.actualCost?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Cost Variance</span>
                <span className={`font-bold ${performance?.costVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${performance?.costVariance?.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Schedule Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Schedule Variance</span>
                <span className={`font-bold ${performance?.scheduleVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${performance?.scheduleVariance?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CPI</span>
                <span className="font-bold">{performance?.cpi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SPI</span>
                <span className="font-bold">{performance?.spi}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Status</span>
                <Badge>{performance?.status}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (view === 'charts') {
    return <div className="space-y-6">{renderCharts()}</div>;
  }

  if (view === 'resources') {
    return <div className="space-y-6">{renderResources()}</div>;
  }

  if (view === 'risks') {
    return <div className="space-y-6">{renderRisks()}</div>;
  }

  // All view
  return (
    <div className="space-y-6">
      {renderPerformanceCards()}
      {renderCharts()}
      {renderResources()}
      {renderRisks()}
    </div>
  );
}
