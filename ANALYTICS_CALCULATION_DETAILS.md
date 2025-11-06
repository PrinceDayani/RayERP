# Analytics Calculations - Step by Step

## Database Collections Used

### 1. Project Collection
```javascript
{
  _id: ObjectId,
  name: String,
  startDate: Date,
  endDate: Date,
  budget: Number,           // Total allocated budget
  spentBudget: Number,      // Money spent so far
  progress: Number,         // 0-100 percentage
  status: String,           // 'active', 'completed', etc.
  team: [ObjectId]          // Array of user IDs
}
```

### 2. Task Collection
```javascript
{
  _id: ObjectId,
  project: ObjectId,        // Reference to project
  status: String,           // 'todo', 'in-progress', 'completed', 'blocked'
  dueDate: Date,
  estimatedHours: Number,   // Estimated time to complete
  actualHours: Number,      // Actual time spent
  assignedTo: ObjectId,     // User ID
  updatedAt: Date,          // Last update timestamp
  createdAt: Date
}
```

---

## Backend Calculations (projectAnalyticsController.ts)

### 1. BURNDOWN CHART

**Input Variables**:
- `project.startDate` - Project start date
- `project.endDate` - Project end date
- `tasks[]` - All tasks for the project

**Step-by-Step Calculation**:

```javascript
// Step 1: Get time range
const startDate = new Date(project.startDate);
const endDate = new Date(project.endDate);
const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

// Step 2: Count total tasks
const totalTasks = tasks.length;

// Step 3: For each day from start to end
for (let dayNumber = 0; dayNumber <= totalDays; dayNumber++) {
  const currentDate = new Date(startDate.getTime() + dayNumber * 24 * 60 * 60 * 1000);
  
  // Step 4: Calculate ideal remaining tasks (linear burndown)
  const ideal = totalTasks - (totalTasks / totalDays) * dayNumber;
  
  // Step 5: Count completed tasks up to this date
  const completedTasks = tasks.filter(task => 
    task.status === 'completed' && 
    new Date(task.updatedAt) <= currentDate
  ).length;
  
  // Step 6: Calculate actual remaining tasks
  const actual = totalTasks - completedTasks;
  
  // Step 7: Store data point
  burndownData.push({
    date: currentDate.toISOString().split('T')[0],
    ideal: Math.max(0, ideal),
    actual: actual,
    completed: completedTasks
  });
}
```

**Example**:
- Project: 100 tasks, 30 days
- Day 10: 
  - Ideal = 100 - (100/30) × 10 = 66.67 tasks remaining
  - Actual = 100 - 35 completed = 65 tasks remaining
  - Status: Ahead of schedule ✅

---

### 2. VELOCITY

**Input Variables**:
- `tasks[]` - All tasks for the project
- `task.status` - Task completion status
- `task.estimatedHours` - Hours estimated per task
- `task.updatedAt` - When task was completed

**Step-by-Step Calculation**:

```javascript
// Step 1: Filter completed tasks only
const completedTasks = tasks.filter(t => t.status === 'completed');

// Step 2: Group by week
const weeklyVelocity = {};

completedTasks.forEach(task => {
  // Step 3: Get week start date (Sunday)
  const weekStart = new Date(task.updatedAt);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekKey = weekStart.toISOString().split('T')[0];
  
  // Step 4: Sum hours for that week
  weeklyVelocity[weekKey] = (weeklyVelocity[weekKey] || 0) + (task.estimatedHours || 1);
});

// Step 5: Calculate average velocity
const velocityData = Object.entries(weeklyVelocity).map(([week, hours]) => ({
  week: week,
  velocity: hours,
  tasksCompleted: completedTasks.filter(t => {
    const taskWeek = new Date(t.updatedAt);
    taskWeek.setDate(taskWeek.getDate() - taskWeek.getDay());
    return taskWeek.toISOString().split('T')[0] === week;
  }).length
}));

const avgVelocity = velocityData.reduce((sum, v) => sum + v.velocity, 0) / velocityData.length;
```

**Example**:
- Week 1: 5 tasks × 8 hours = 40 hours velocity
- Week 2: 6 tasks × 7 hours = 42 hours velocity
- Average velocity = (40 + 42) / 2 = 41 hours/week

---

### 3. PERFORMANCE INDICES (CPI & SPI)

**Input Variables**:
- `project.budget` - Total budget (Planned Value)
- `project.spentBudget` - Money spent (Actual Cost)
- `project.progress` - Current progress percentage
- `project.startDate` - Start date
- `project.endDate` - End date
- `tasks[]` - All tasks
- Current date (`now`)

**Step-by-Step Calculation**:

```javascript
// Step 1: Get Planned Value (PV)
const plannedValue = project.budget;  // e.g., $100,000

// Step 2: Calculate Earned Value (EV)
const completedTasks = tasks.filter(t => t.status === 'completed').length;
const totalTasks = tasks.length;
const earnedValue = (completedTasks / totalTasks) * plannedValue;
// Example: (25/100) × $100,000 = $25,000

// Step 3: Get Actual Cost (AC)
const actualCost = project.spentBudget;  // e.g., $30,000

// Step 4: Calculate CPI (Cost Performance Index)
const cpi = actualCost > 0 ? earnedValue / actualCost : 0;
// Example: $25,000 / $30,000 = 0.83
// Interpretation: Getting $0.83 value for every $1 spent (OVER BUDGET)

// Step 5: Calculate time-based metrics
const now = new Date();
const start = new Date(project.startDate);
const end = new Date(project.endDate);
const totalDuration = end.getTime() - start.getTime();
const elapsedDuration = now.getTime() - start.getTime();

// Step 6: Calculate Planned Progress
const plannedProgress = Math.min(100, (elapsedDuration / totalDuration) * 100);
// Example: 15 days elapsed / 30 days total = 50% planned

// Step 7: Get Actual Progress
const actualProgress = project.progress;  // e.g., 45%

// Step 8: Calculate SPI (Schedule Performance Index)
const spi = plannedProgress > 0 ? actualProgress / plannedProgress : 0;
// Example: 45% / 50% = 0.90
// Interpretation: 90% of planned work done (BEHIND SCHEDULE)

// Step 9: Calculate Variances
const costVariance = earnedValue - actualCost;
// Example: $25,000 - $30,000 = -$5,000 (over budget)

const scheduleVariance = earnedValue - (plannedProgress / 100) * project.budget;
// Example: $25,000 - (50% × $100,000) = -$25,000 (behind schedule)

// Step 10: Determine Status
let status;
if (cpi >= 1 && spi >= 1) status = 'on-track';
else if (cpi < 1) status = 'over-budget';
else status = 'behind-schedule';
```

**Real Example**:
```
Project Budget: $100,000
Time: 15 days elapsed of 30 days (50% time passed)
Tasks: 25 completed of 100 total (25% work done)
Spent: $30,000

Calculations:
- EV = (25/100) × $100,000 = $25,000
- CPI = $25,000 / $30,000 = 0.83 (Over budget by 17%)
- SPI = 25% / 50% = 0.50 (Behind schedule by 50%)
- Cost Variance = -$5,000 (bad)
- Schedule Variance = -$25,000 (bad)
- Status: OVER BUDGET & BEHIND SCHEDULE
```

---

### 4. RISK ASSESSMENT

**Input Variables**:
- `project.budget` - Total budget
- `project.spentBudget` - Spent amount
- `project.endDate` - Deadline
- `tasks[]` - All tasks
- Current date (`now`)

**Step-by-Step Calculation**:

```javascript
const risks = [];
const now = new Date();

// RISK 1: Budget Risk
const budgetUsage = project.budget > 0 
  ? (project.spentBudget / project.budget) * 100 
  : 0;

if (budgetUsage > 90) {
  risks.push({
    type: 'budget',
    severity: 'high',
    message: 'Budget usage exceeds 90%',
    value: budgetUsage
  });
} else if (budgetUsage > 75) {
  risks.push({
    type: 'budget',
    severity: 'medium',
    message: 'Budget usage exceeds 75%',
    value: budgetUsage
  });
}

// RISK 2: Schedule Risk
const endDate = new Date(project.endDate);
const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
const incompleteTasks = tasks.filter(t => t.status !== 'completed').length;

if (daysRemaining < 0) {
  risks.push({
    type: 'schedule',
    severity: 'critical',
    message: 'Project is overdue',
    value: Math.abs(daysRemaining)
  });
} else if (daysRemaining < 7 && incompleteTasks > 0) {
  risks.push({
    type: 'schedule',
    severity: 'high',
    message: `${incompleteTasks} tasks remaining with less than 7 days`,
    value: daysRemaining
  });
}

// RISK 3: Overdue Tasks
const overdueTasks = tasks.filter(t => 
  t.dueDate && 
  new Date(t.dueDate) < now && 
  t.status !== 'completed'
).length;

if (overdueTasks > 5) {
  risks.push({
    type: 'tasks',
    severity: 'high',
    message: `${overdueTasks} overdue tasks`,
    value: overdueTasks
  });
} else if (overdueTasks > 0) {
  risks.push({
    type: 'tasks',
    severity: 'medium',
    message: `${overdueTasks} overdue tasks`,
    value: overdueTasks
  });
}

// RISK 4: Blocked Tasks
const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
if (blockedTasks > 0) {
  risks.push({
    type: 'tasks',
    severity: 'medium',
    message: `${blockedTasks} blocked tasks`,
    value: blockedTasks
  });
}

// Overall Risk Level
const overallRisk = risks.some(r => r.severity === 'critical') ? 'critical' :
                    risks.some(r => r.severity === 'high') ? 'high' :
                    risks.some(r => r.severity === 'medium') ? 'medium' : 'low';
```

**Example**:
```
Budget: $100,000 spent / $100,000 total = 100% → HIGH RISK
Days: -5 days (overdue) → CRITICAL RISK
Overdue Tasks: 8 → HIGH RISK
Blocked Tasks: 2 → MEDIUM RISK

Overall Risk: CRITICAL (because one critical risk exists)
```

---

## Frontend Calculations (ProjectAnalyticsFiltered.tsx)

### 5. HEALTH SCORE

**Input Variables**:
- `performance.cpi` - Cost Performance Index
- `performance.spi` - Schedule Performance Index
- `risk.overallRisk` - Risk level

**Step-by-Step Calculation**:

```javascript
// Step 1: Calculate CPI Score (max 50 points)
const cpiScore = Math.min(performance.cpi * 50, 50);
// Example: CPI = 1.2 → 1.2 × 50 = 60, capped at 50 points

// Step 2: Calculate SPI Score (max 30 points)
const spiScore = Math.min(performance.spi * 30, 30);
// Example: SPI = 0.9 → 0.9 × 30 = 27 points

// Step 3: Calculate Risk Score (max 20 points)
const riskScore = risk.overallRisk === 'low' ? 20 :
                  risk.overallRisk === 'medium' ? 10 : 0;
// Example: medium risk → 10 points

// Step 4: Sum all scores
const healthScore = Math.round(cpiScore + spiScore + riskScore);
// Example: 50 + 27 + 10 = 87/100

// Step 5: Determine health level
if (healthScore >= 80) → "Excellent" (Green)
if (healthScore >= 60) → "Good" (Yellow)
if (healthScore < 60) → "Poor" (Red)
```

**Real Example**:
```
CPI = 1.05 (under budget) → 50 points
SPI = 0.95 (slightly behind) → 28.5 points
Risk = low → 20 points
Health Score = 98.5/100 → EXCELLENT ✅
```

---

### 6. PRODUCTIVITY INDEX

**Input Variables**:
- `velocity.avgVelocity` - Average hours per week

**Calculation**:
```javascript
const productivityIndex = (avgVelocity / 40) * 100;
// Baseline: 40 hours/week = 100% productivity

// Example: 
// avgVelocity = 35 hours/week
// productivityIndex = (35 / 40) × 100 = 87.5%
```

---

### 7. ESTIMATED COMPLETION

**Input Variables**:
- `burndown.totalTasks` - Total tasks
- `velocity.totalCompleted` - Completed tasks
- `velocity.avgVelocity` - Average velocity

**Calculation**:
```javascript
// Step 1: Calculate remaining tasks
const remainingTasks = totalTasks - totalCompleted;
// Example: 100 - 25 = 75 tasks

// Step 2: Calculate weeks needed (assuming 40 hrs/week)
const weeksToComplete = remainingTasks / (avgVelocity / 40);
// Example: 75 / (35 / 40) = 75 / 0.875 = 85.7 weeks

// Step 3: Calculate completion date
const estimatedCompletion = new Date();
estimatedCompletion.setDate(estimatedCompletion.getDate() + (weeksToComplete * 7));
```

---

## Summary Table

| Metric | Input Data | Formula | Output |
|--------|-----------|---------|--------|
| **CPI** | EV, AC | EV / AC | 0.83 (over budget) |
| **SPI** | Actual%, Planned% | Actual / Planned | 0.90 (behind) |
| **Health Score** | CPI, SPI, Risk | (CPI×50) + (SPI×30) + Risk | 87/100 |
| **Velocity** | Completed tasks, Hours | Sum(hours) / weeks | 41 hrs/week |
| **Productivity** | Avg Velocity | (Velocity / 40) × 100 | 87.5% |
| **Risk Level** | Budget%, Days, Tasks | Rule-based logic | HIGH |

All calculations update automatically when project/task data changes in MongoDB!


📊 Exact Calculation Details
Database Variables Used:
project.budget - Total allocated money

project.spentBudget - Money spent

project.progress - Completion percentage (0-100)

project.startDate / endDate - Timeline

task.status - 'completed', 'in-progress', etc.

task.estimatedHours - Time estimate

task.actualHours - Time spent

task.updatedAt - Completion timestamp

Key Formulas with Real Examples:
1. CPI (Cost Performance Index)

EV = (Completed Tasks / Total Tasks) × Budget
CPI = EV / Spent Budget

Example: (25/100) × $100k / $30k = 0.83
Meaning: Getting $0.83 value per $1 spent (OVER BUDGET)

Copy
2. SPI (Schedule Performance Index)

Planned% = (Days Elapsed / Total Days) × 100
SPI = Actual Progress / Planned Progress

Example: 45% / 50% = 0.90
Meaning: 90% of planned work done (BEHIND SCHEDULE)

Copy
3. Health Score (0-100)

CPI Score = min(CPI × 50, 50)
SPI Score = min(SPI × 30, 30)
Risk Score = low:20, medium:10, high:0
Health = CPI Score + SPI Score + Risk Score

Example: 50 + 27 + 10 = 87/100 (EXCELLENT)

Copy
4. Velocity

Weekly Velocity = Sum of hours for tasks completed that week
Avg Velocity = Total Velocity / Number of Weeks

Example: (40 + 42 + 38) / 3 = 40 hrs/week

Copy
5. Risk Detection

Budget > 90% → HIGH RISK

Days Remaining < 0 → CRITICAL RISK

Overdue Tasks > 5 → HIGH RISK

Blocked Tasks > 0 → MEDIUM RISK

All metrics are calculated from real MongoDB data and update in real-time!