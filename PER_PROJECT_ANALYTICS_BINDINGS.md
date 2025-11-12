# Per-Project Analytics - Data Bindings & Calculations

## Data Sources (API Endpoints)

### 1. Burndown Chart Data
**Endpoint**: `/api/projects/:id/analytics/burndown`
**Backend**: `projectAnalyticsController.getBurndownChart()`

**Returns**:
```javascript
{
  burndownData: [
    { date: "2024-01-01", ideal: 100, actual: 95, completed: 5 }
  ],
  totalTasks: 100,
  totalDays: 30
}
```

**Calculation**:
- `ideal` = totalTasks - (totalTasks / totalDays) × dayNumber
- `actual` = totalTasks - completedTasksUpToDate
- `completed` = tasks with status='completed' up to that date

---

### 2. Velocity Data
**Endpoint**: `/api/projects/:id/analytics/velocity`
**Backend**: `projectAnalyticsController.getVelocity()`

**Returns**:
```javascript
{
  velocityData: [
    { week: "2024-W01", velocity: 40, tasksCompleted: 5 }
  ],
  avgVelocity: 38.5,
  totalCompleted: 25
}
```

**Calculation**:
- Groups completed tasks by week
- `velocity` = sum of estimatedHours for tasks completed that week
- `avgVelocity` = total velocity / number of weeks
- Week starts on Sunday (ISO week format)

---

### 3. Resource Utilization
**Endpoint**: `/api/projects/:id/analytics/resource-utilization`
**Backend**: `projectAnalyticsController.getResourceUtilization()`

**Returns**:
```javascript
{
  utilizationData: [
    {
      user: { _id, firstName, lastName },
      totalTasks: 10,
      completedTasks: 7,
      inProgressTasks: 2,
      estimatedHours: 80,
      actualHours: 75,
      utilizationRate: 93.75,
      completionRate: 70
    }
  ],
  teamSize: 5
}
```

**Calculation**:
- `utilizationRate` = (actualHours / estimatedHours) × 100
- `completionRate` = (completedTasks / totalTasks) × 100

---

### 4. Performance Indices
**Endpoint**: `/api/projects/:id/analytics/performance-indices`
**Backend**: `projectAnalyticsController.getPerformanceIndices()`

**Returns**:
```javascript
{
  cpi: 1.05,              // Cost Performance Index
  spi: 0.95,              // Schedule Performance Index
  costVariance: 5000,     // EV - AC
  scheduleVariance: -2000, // EV - PV
  plannedValue: 100000,   // Total budget
  earnedValue: 95000,     // (completed/total) × budget
  actualCost: 90476,      // Spent budget
  status: "over-budget" | "behind-schedule" | "on-track"
}
```

**Calculations**:
- **Earned Value (EV)** = (completedTasks / totalTasks) × plannedValue
- **CPI** = EV / actualCost
  - CPI > 1: Under budget ✅
  - CPI < 1: Over budget ⚠️
- **SPI** = actualProgress / plannedProgress
  - SPI > 1: Ahead of schedule ✅
  - SPI < 1: Behind schedule ⚠️
- **Cost Variance** = EV - actualCost (positive = good)
- **Schedule Variance** = EV - (plannedProgress% × budget)
- **Planned Progress** = (elapsed time / total time) × 100

---

### 5. Risk Assessment
**Endpoint**: `/api/projects/:id/analytics/risk-assessment`
**Backend**: `projectAnalyticsController.getRiskAssessment()`

**Returns**:
```javascript
{
  overallRisk: "low" | "medium" | "high" | "critical",
  risks: [
    {
      type: "budget" | "schedule" | "tasks",
      severity: "low" | "medium" | "high" | "critical",
      message: "Budget usage exceeds 90%",
      value: 92
    }
  ],
  riskCount: 3,
  projectHealth: "healthy" | "at-risk" | "critical"
}
```

**Risk Detection Logic**:
1. **Budget Risk**:
   - budgetUsage > 90% → HIGH
   - budgetUsage > 75% → MEDIUM

2. **Schedule Risk**:
   - daysRemaining < 0 → CRITICAL (overdue)
   - daysRemaining < 7 && incompleteTasks > 0 → HIGH

3. **Task Risk**:
   - overdueTasks > 5 → HIGH
   - overdueTasks > 0 → MEDIUM
   - blockedTasks > 0 → MEDIUM

4. **Overall Risk**:
   - Any CRITICAL → CRITICAL
   - Any HIGH → HIGH
   - Any MEDIUM → MEDIUM
   - Otherwise → LOW

---

## Frontend Calculated Metrics

### Advanced Metrics (in ProjectAnalyticsFiltered component)

#### 1. Completion Rate
```javascript
completionRate = (totalCompleted / totalTasks) × 100
```
**Binds to**: Progress percentage display

---

#### 2. Estimated Completion
```javascript
remainingTasks = totalTasks - totalCompleted
weeksToComplete = remainingTasks / (avgVelocity / 40)  // 40 hrs/week
estimatedCompletion = today + (weeksToComplete × 7 days)
```
**Binds to**: "Est. Completion" card

---

#### 3. Health Score (0-100)
```javascript
cpiScore = min(cpi × 50, 50)           // Max 50 points
spiScore = min(spi × 30, 30)           // Max 30 points
riskScore = overallRisk === 'low' ? 20 : 
            overallRisk === 'medium' ? 10 : 0  // Max 20 points

healthScore = cpiScore + spiScore + riskScore
```
**Binds to**: "Health Score" card
- 80-100: Green (Excellent)
- 60-79: Yellow (Good)
- 0-59: Red (Poor)

---

#### 4. Productivity Index
```javascript
productivityIndex = (avgVelocity / 40) × 100
```
**Binds to**: "Productivity" card
- Assumes 40 hours/week as baseline

---

#### 5. Budget Efficiency
```javascript
budgetEfficiency = (earnedValue / plannedValue) × 100
```
**Binds to**: Budget performance metrics

---

#### 6. Velocity Trend
```javascript
if (velocityData.length > 1) {
  lastVelocity = velocityData[last].velocity
  firstVelocity = velocityData[first].velocity
  trend = lastVelocity > firstVelocity ? "increasing" : "decreasing"
} else {
  trend = "stable"
}
```
**Binds to**: Productivity card subtitle

---

### Performance Radar Data
```javascript
radarData = [
  { metric: 'Cost', value: min(cpi × 100, 100) },
  { metric: 'Schedule', value: min(spi × 100, 100) },
  { metric: 'Quality', value: completionRate },
  { metric: 'Team', value: productivityIndex },
  { metric: 'Risk', value: riskScore }
]
```
**Binds to**: Performance Matrix radar chart

---

### Velocity Forecast
```javascript
forecastData = velocityData.map((v, i) => ({
  week: v.week,
  actual: v.velocity,
  forecast: avgVelocity × (1 + (i × 0.02))  // 2% growth per week
}))
```
**Binds to**: Velocity Forecast chart

---

## AI Insights Generation

### Insight Rules:
1. **Over Budget**: `if (cpi < 1)`
   - Message: "Project is over budget. Review cost allocations."

2. **Behind Schedule**: `if (spi < 1)`
   - Message: "Project is behind schedule. Consider resource reallocation."

3. **Low Productivity**: `if (productivityIndex < 70)`
   - Message: "Team productivity is below target. Review workload distribution."

4. **High Risk**: `if (riskCount > 3)`
   - Message: "X risks identified. Immediate attention required."

5. **Excellent Health**: `if (healthScore >= 80)`
   - Message: "Project health is excellent. Maintain current momentum."

6. **Declining Velocity**: `if (velocityTrend === 'decreasing')`
   - Message: "Velocity is declining. Investigate blockers."

---

## Visual Bindings

### Charts:
1. **Burndown Chart**: `burndownData` → Area chart (ideal vs actual)
2. **Velocity Chart**: `velocityData` → Bar chart (hours per week)
3. **Radar Chart**: `radarData` → Radar chart (5 metrics)
4. **Forecast Chart**: `forecastData` → Composed chart (bars + line)

### Cards:
- **CPI Card**: `performance.cpi` → Color based on >= 1
- **SPI Card**: `performance.spi` → Color based on >= 1
- **Risk Card**: `risk.overallRisk` → Color + badge
- **Health Score**: `healthScore` → Progress bar + color
- **Productivity**: `productivityIndex` → Percentage + trend
- **Completion**: `completionRate` → Percentage + remaining tasks
- **Est. Completion**: `weeksToComplete` → Weeks + date

### Resource Cards:
- User initials from `firstName[0] + lastName[0]`
- Completion rate with color coding:
  - >= 80%: Green
  - >= 50%: Blue
  - < 50%: Orange

### Risk Cards:
- Border color by severity:
  - Critical: Red
  - High: Orange
  - Medium: Yellow
  - Low: Blue

---

## Data Flow Summary

```
Backend API → Frontend State → Calculations → UI Components
     ↓              ↓               ↓              ↓
  Database    useState hooks   useMemo hook    Recharts
  MongoDB     (5 endpoints)    (derived data)  + Cards
```

All metrics update in real-time when project data changes!
