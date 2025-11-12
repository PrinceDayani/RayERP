# 📊 Advanced Project Analytics

## Overview
The Advanced Project Analytics module provides comprehensive insights into project performance, team velocity, resource utilization, and risk assessment.

## API Endpoints

### 1. Burndown Chart
**Endpoint:** `GET /api/projects/:id/analytics/burndown`

**Description:** Track work completion over time comparing ideal vs actual progress.

**Response:**
```json
{
  "burndownData": [
    {
      "date": "2024-01-01",
      "ideal": 100,
      "actual": 95,
      "completed": 5
    }
  ],
  "totalTasks": 100,
  "totalDays": 30
}
```

### 2. Velocity Tracking
**Endpoint:** `GET /api/projects/:id/analytics/velocity`

**Description:** Team performance metrics showing weekly velocity.

**Response:**
```json
{
  "velocityData": [
    {
      "week": "2024-01-01",
      "velocity": 40,
      "tasksCompleted": 8
    }
  ],
  "avgVelocity": 38.5,
  "totalCompleted": 45
}
```

### 3. Resource Utilization
**Endpoint:** `GET /api/projects/:id/analytics/resource-utilization`

**Description:** Team member workload analysis.

**Response:**
```json
{
  "utilizationData": [
    {
      "user": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "totalTasks": 10,
      "completedTasks": 7,
      "inProgressTasks": 2,
      "estimatedHours": 80,
      "actualHours": 75,
      "utilizationRate": 93.75,
      "completionRate": 70
    }
  ],
  "teamSize": 5
}
```

### 4. Performance Indices
**Endpoint:** `GET /api/projects/:id/analytics/performance-indices`

**Description:** Cost Performance Index (CPI) and Schedule Performance Index (SPI).

**Response:**
```json
{
  "cpi": 1.05,
  "spi": 0.95,
  "costVariance": 5000,
  "scheduleVariance": -2000,
  "plannedValue": 100000,
  "earnedValue": 95000,
  "actualCost": 90476,
  "status": "on-track"
}
```

**Metrics Explained:**
- **CPI (Cost Performance Index)**: Earned Value / Actual Cost
  - CPI > 1: Under budget
  - CPI = 1: On budget
  - CPI < 1: Over budget
  
- **SPI (Schedule Performance Index)**: Actual Progress / Planned Progress
  - SPI > 1: Ahead of schedule
  - SPI = 1: On schedule
  - SPI < 1: Behind schedule

### 5. Risk Assessment
**Endpoint:** `GET /api/projects/:id/analytics/risk-assessment`

**Description:** Identify at-risk projects with automated risk detection.

**Response:**
```json
{
  "overallRisk": "medium",
  "risks": [
    {
      "type": "budget",
      "severity": "medium",
      "message": "Budget usage exceeds 75%",
      "value": 78.5
    },
    {
      "type": "tasks",
      "severity": "high",
      "message": "3 overdue tasks",
      "value": 3
    }
  ],
  "riskCount": 2,
  "projectHealth": "at-risk"
}
```

**Risk Types:**
- **budget**: Budget overrun risks
- **schedule**: Timeline adherence risks
- **tasks**: Task completion risks

**Severity Levels:**
- **critical**: Immediate attention required
- **high**: Urgent action needed
- **medium**: Monitor closely
- **low**: Normal monitoring

## Frontend Usage

### Import Component
```typescript
import ProjectAnalytics from '@/components/ProjectAnalytics';
```

### Use in Page
```typescript
<ProjectAnalytics projectId={projectId} />
```

## Features

### 1. Burndown Charts
- Visual representation of work remaining
- Ideal vs actual progress comparison
- Daily progress tracking
- Completion forecasting

### 2. Velocity Tracking
- Weekly velocity calculation
- Average velocity metrics
- Team performance trends
- Historical velocity data

### 3. Resource Utilization
- Individual team member workload
- Task completion rates
- Hour utilization tracking
- Capacity planning insights

### 4. Performance Indices
- Real-time CPI and SPI calculation
- Budget variance tracking
- Schedule variance monitoring
- Project health status

### 5. Risk Assessment
- Automated risk detection
- Multi-factor risk analysis
- Severity-based prioritization
- Actionable risk insights

## Risk Detection Rules

### Budget Risks
- **High**: Budget usage > 90%
- **Medium**: Budget usage > 75%

### Schedule Risks
- **Critical**: Project overdue
- **High**: < 7 days remaining with incomplete tasks

### Task Risks
- **High**: > 5 overdue tasks
- **Medium**: 1-5 overdue tasks
- **Medium**: Blocked tasks present

## Integration

### Authentication
All endpoints require JWT authentication:
```typescript
headers: {
  Authorization: `Bearer ${token}`
}
```

### Access Control
- Requires project access permission
- Enforced via `checkProjectAccess` middleware
- Role-based visibility

## Best Practices

1. **Regular Monitoring**: Check analytics daily for active projects
2. **Risk Mitigation**: Address high-severity risks immediately
3. **Velocity Tracking**: Use for sprint planning and estimation
4. **Resource Balancing**: Redistribute work based on utilization data
5. **Performance Review**: Weekly CPI/SPI review meetings

## Future Enhancements

- Predictive analytics using ML
- Custom report builder
- Export to PDF/Excel
- Email alerts for critical risks
- Comparative analytics across projects
- Team performance benchmarking
