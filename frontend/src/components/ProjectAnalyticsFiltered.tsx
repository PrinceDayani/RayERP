"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, BarChart3, Users as UsersIcon, AlertTriangle, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface FilteredAnalyticsProps {
  view: 'all' | 'performance' | 'charts' | 'resources' | 'risks' | 'project' | 'financial';
  burndown: any;
  velocity: any;
  utilization: any;
  performance: any;
  risk: any;
}

export default function ProjectAnalyticsFiltered({ view, burndown, velocity, utilization, performance, risk }: FilteredAnalyticsProps) {
  
  const renderPerformanceCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-gray-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
              CPI
            </div>
            {performance?.cpi >= 1 ? <ArrowUpRight className="h-4 w-4 text-green-600" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold mb-2 ${performance?.cpi >= 1 ? 'text-green-600' : 'text-red-600'}`}>
            {performance?.cpi || '0.00'}
          </div>
          <p className="text-xs text-muted-foreground mb-2">Cost Performance Index</p>
          <Badge variant={performance?.cpi >= 1 ? 'default' : 'destructive'} className="text-xs">
            {performance?.cpi >= 1 ? '✓ Under Budget' : '⚠ Over Budget'}
          </Badge>
        </CardContent>
      </Card>
      <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-white dark:from-green-950/20 dark:to-gray-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              SPI
            </div>
            {performance?.spi >= 1 ? <ArrowUpRight className="h-4 w-4 text-green-600" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold mb-2 ${performance?.spi >= 1 ? 'text-green-600' : 'text-red-600'}`}>
            {performance?.spi || '0.00'}
          </div>
          <p className="text-xs text-muted-foreground mb-2">Schedule Performance Index</p>
          <Badge variant={performance?.spi >= 1 ? 'default' : 'destructive'} className="text-xs">
            {performance?.spi >= 1 ? '✓ On Schedule' : '⚠ Behind Schedule'}
          </Badge>
        </CardContent>
      </Card>
      <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-white dark:from-orange-950/20 dark:to-gray-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full animate-pulse ${
              risk?.overallRisk === 'low' ? 'bg-green-500' : 
              risk?.overallRisk === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            Risk Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold mb-2 ${
            risk?.overallRisk === 'low' ? 'text-green-600' : 
            risk?.overallRisk === 'medium' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {risk?.overallRisk?.toUpperCase() || 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground mb-2">{risk?.riskCount || 0} risks identified</p>
          <Badge variant={risk?.overallRisk === 'low' ? 'default' : 'destructive'} className="text-xs capitalize">
            {risk?.projectHealth || 'Unknown'}
          </Badge>
        </CardContent>
      </Card>
      <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-gray-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></div>
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold capitalize mb-2">{performance?.status || 'N/A'}</div>
          <p className="text-xs text-muted-foreground mb-2">Project Health</p>
          <Badge variant="outline" className="text-xs">
            Overall Status
          </Badge>
        </CardContent>
      </Card>
    </div>
  );

  const renderCharts = () => (
    <>
      <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 border-b">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-bold">Burndown Chart</div>
                <p className="text-xs text-muted-foreground font-normal">Track work completion over time</p>
              </div>
            </div>
            <Badge variant="outline">{burndown?.burndownData?.length || 0} data points</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {burndown?.burndownData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={burndown.burndownData}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" fontSize={11} stroke="#6b7280" />
                <YAxis fontSize={11} stroke="#6b7280" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="ideal" stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={2} name="Ideal Progress" dot={false} />
                <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} fill="url(#colorActual)" name="Actual Progress" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16">
              <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-muted-foreground font-medium">No burndown data available</p>
              <p className="text-sm text-muted-foreground mt-1">Data will appear once tasks are tracked</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 border-b">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-bold">Team Velocity</div>
                <p className="text-xs text-muted-foreground font-normal">Average: {velocity?.avgVelocity?.toFixed(1) || 0} hrs/week</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
              {velocity?.velocityData?.length || 0} weeks
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {velocity?.velocityData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={velocity.velocityData}>
                <defs>
                  <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" fontSize={11} stroke="#6b7280" />
                <YAxis fontSize={11} stroke="#6b7280" label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="velocity" fill="url(#colorVelocity)" name="Hours" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16">
              <TrendingUp className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-muted-foreground font-medium">No velocity data available</p>
              <p className="text-sm text-muted-foreground mt-1">Track team performance over time</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );

  const renderResources = () => (
    <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950 dark:via-pink-950 dark:to-rose-950 border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <UsersIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="font-bold">Resource Utilization</div>
              <p className="text-xs text-muted-foreground font-normal">Team member workload analysis</p>
            </div>
          </div>
          <Badge variant="outline">{utilization?.utilizationData?.length || 0} members</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {utilization?.utilizationData?.length > 0 ? (
            utilization.utilizationData.map((u: any, i: number) => {
              const completionRate = u.completionRate?.toFixed(0) || 0;
              return (
                <div key={i} className="group p-4 border rounded-xl hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                        {u.user?.firstName?.[0]}{u.user?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{u.user?.firstName} {u.user?.lastName}</p>
                        <p className="text-xs text-muted-foreground">
                          {u.completedTasks}/{u.totalTasks} tasks • {u.actualHours}/{u.estimatedHours} hrs
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${
                        completionRate >= 80 ? 'text-green-600' : 
                        completionRate >= 50 ? 'text-blue-600' : 'text-orange-600'
                      }`}>{completionRate}%</p>
                      <p className="text-xs text-muted-foreground">Completion</p>
                    </div>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </div>
              );
            })
          ) : (
            <div className="text-center py-16">
              <UsersIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-muted-foreground font-medium">No team members assigned</p>
              <p className="text-sm text-muted-foreground mt-1">Assign team members to track utilization</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderRisks = () => (
    <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 dark:from-orange-950 dark:via-red-950 dark:to-pink-950 border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="font-bold">Risk Assessment</div>
              <p className="text-xs text-muted-foreground font-normal">Identified project risks and issues</p>
            </div>
          </div>
          <Badge variant={risk?.risks?.length > 0 ? 'destructive' : 'default'}>
            {risk?.risks?.length || 0} risks
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {risk?.risks?.map((r: any, i: number) => (
            <div key={i} className={`group p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-md ${
              r.severity === 'critical' ? 'border-red-600 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 hover:from-red-100 hover:to-red-50' :
              r.severity === 'high' ? 'border-orange-600 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 hover:from-orange-100 hover:to-orange-50' :
              r.severity === 'medium' ? 'border-yellow-600 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 hover:from-yellow-100 hover:to-yellow-50' :
              'border-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 hover:from-blue-100 hover:to-blue-50'
            }`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                      r.severity === 'critical' ? 'text-red-600' :
                      r.severity === 'high' ? 'text-orange-600' :
                      r.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                    <p className="font-semibold">{r.message}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-7">
                    <Badge variant="outline" className="text-xs">{r.type}</Badge>
                  </div>
                </div>
                <Badge variant={r.severity === 'critical' || r.severity === 'high' ? 'destructive' : 'secondary'} className="shrink-0">
                  {r.severity.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
          {risk?.risks?.length === 0 && (
            <div className="text-center py-16">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-600 font-semibold text-lg">✓ No risks identified</p>
              <p className="text-sm text-muted-foreground mt-2">Project is healthy and on track</p>
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
          <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-b">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                Cost Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <span className="text-sm font-medium">Planned Value</span>
                <span className="font-bold text-lg">${performance?.plannedValue?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <span className="text-sm font-medium">Earned Value</span>
                <span className="font-bold text-lg text-green-600">${performance?.earnedValue?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <span className="text-sm font-medium">Actual Cost</span>
                <span className="font-bold text-lg text-orange-600">${performance?.actualCost?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 border-2 rounded-lg">
                <span className="text-sm font-medium">Cost Variance</span>
                <div className="flex items-center gap-2">
                  {performance?.costVariance >= 0 ? <ArrowUpRight className="h-4 w-4 text-green-600" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />}
                  <span className={`font-bold text-lg ${performance?.costVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${performance?.costVariance?.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-b">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                Schedule Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <div className="flex justify-between items-center p-3 border-2 rounded-lg">
                <span className="text-sm font-medium">Schedule Variance</span>
                <div className="flex items-center gap-2">
                  {performance?.scheduleVariance >= 0 ? <ArrowUpRight className="h-4 w-4 text-green-600" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />}
                  <span className={`font-bold text-lg ${performance?.scheduleVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${performance?.scheduleVariance?.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <span className="text-sm font-medium">CPI</span>
                <span className="font-bold text-lg">{performance?.cpi}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <span className="text-sm font-medium">SPI</span>
                <span className="font-bold text-lg">{performance?.spi}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <span className="text-sm font-medium">Status</span>
                <Badge variant="outline" className="text-sm">{performance?.status}</Badge>
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

  if (view === 'project') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-xl transition-all duration-300 border-t-4 border-t-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Task Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium">Total Tasks</span>
                  <span className="text-2xl font-bold">{burndown?.totalTasks || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <span className="text-sm font-medium">Completed</span>
                  <span className="text-2xl font-bold text-green-600">{velocity?.totalCompleted || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <span className="text-sm font-medium">In Progress</span>
                  <span className="text-2xl font-bold text-blue-600">{(burndown?.totalTasks || 0) - (velocity?.totalCompleted || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-xl transition-all duration-300 border-t-4 border-t-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <span className="text-sm font-medium">Total Days</span>
                  <span className="text-2xl font-bold">{burndown?.totalDays || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-2xl font-bold">{performance?.spi ? `${(performance.spi * 100).toFixed(0)}%` : '0%'}</span>
                </div>
                <Progress value={performance?.spi ? performance.spi * 100 : 0} className="h-2" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-xl transition-all duration-300 border-t-4 border-t-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-green-600" />
                Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <span className="text-sm font-medium">Team Size</span>
                  <span className="text-2xl font-bold">{utilization?.teamSize || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <span className="text-sm font-medium">Avg Velocity</span>
                  <span className="text-2xl font-bold">{velocity?.avgVelocity?.toFixed(1) || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">hours per week</p>
              </div>
            </CardContent>
          </Card>
        </div>
        {renderCharts()}
      </div>
    );
  }

  if (view === 'financial') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                Planned Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">${performance?.plannedValue?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Total Budget</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-white dark:from-green-950/20 dark:to-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Earned Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-1">${performance?.earnedValue?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Value Delivered</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-white dark:from-orange-950/20 dark:to-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-600" />
                Actual Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 mb-1">${performance?.actualCost?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Spent Amount</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {performance?.costVariance >= 0 ? <ArrowUpRight className="h-4 w-4 text-green-600" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />}
                Cost Variance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold mb-1 ${performance?.costVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${performance?.costVariance?.toLocaleString() || 0}
              </div>
              <Badge variant={performance?.costVariance >= 0 ? 'default' : 'destructive'} className="text-xs">
                {performance?.costVariance >= 0 ? 'Under Budget' : 'Over Budget'}
              </Badge>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-b">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Financial Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl border border-blue-200 dark:border-blue-800">
                <div>
                  <span className="text-sm font-medium block mb-1">Cost Performance Index</span>
                  <span className="text-xs text-muted-foreground">CPI</span>
                </div>
                <span className={`text-3xl font-bold ${performance?.cpi >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                  {performance?.cpi || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-xl border border-green-200 dark:border-green-800">
                <div>
                  <span className="text-sm font-medium block mb-1">Schedule Performance Index</span>
                  <span className="text-xs text-muted-foreground">SPI</span>
                </div>
                <span className={`text-3xl font-bold ${performance?.spi >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                  {performance?.spi || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-xl border border-purple-200 dark:border-purple-800">
                <div>
                  <span className="text-sm font-medium block mb-1">Budget Utilization</span>
                  <span className="text-xs text-muted-foreground">Percentage Used</span>
                </div>
                <span className="text-3xl font-bold">
                  {performance?.plannedValue > 0 ? ((performance.actualCost / performance.plannedValue) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-b">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                Variance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <div className="p-4 border-2 rounded-xl bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="text-sm font-medium block mb-1">Cost Variance</span>
                    <span className="text-xs text-muted-foreground">CV</span>
                  </div>
                  <Badge variant={performance?.costVariance >= 0 ? 'default' : 'destructive'}>
                    {performance?.costVariance >= 0 ? 'Positive' : 'Negative'}
                  </Badge>
                </div>
                <div className={`text-3xl font-bold ${performance?.costVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${performance?.costVariance?.toLocaleString() || 0}
                </div>
                <Progress value={performance?.costVariance >= 0 ? 100 : 50} className="h-2 mt-3" />
              </div>
              <div className="p-4 border-2 rounded-xl bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="text-sm font-medium block mb-1">Schedule Variance</span>
                    <span className="text-xs text-muted-foreground">SV</span>
                  </div>
                  <Badge variant={performance?.scheduleVariance >= 0 ? 'default' : 'destructive'}>
                    {performance?.scheduleVariance >= 0 ? 'Positive' : 'Negative'}
                  </Badge>
                </div>
                <div className={`text-3xl font-bold ${performance?.scheduleVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${performance?.scheduleVariance?.toLocaleString() || 0}
                </div>
                <Progress value={performance?.scheduleVariance >= 0 ? 100 : 50} className="h-2 mt-3" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
