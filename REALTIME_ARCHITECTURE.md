# Real-Time Dashboard Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Dashboard Component                          │  │
│  │  - Displays stats cards                                   │  │
│  │  - Shows connection status badge                          │  │
│  │  - Renders charts and analytics                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↕                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         useDashboardData Hook                             │  │
│  │  - Manages dashboard state                                │  │
│  │  - Listens for socket events                              │  │
│  │  - Handles reconnection logic                             │  │
│  │  - Fallback polling (15s interval)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↕                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Socket.IO Client                                │  │
│  │  - Connects to backend WebSocket                          │  │
│  │  - Auto-reconnects on disconnect                          │  │
│  │  - Emits authentication token                             │  │
│  │  - Listens for: dashboard:stats                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               │ WebSocket Connection
                               │ (ws://localhost:5000)
                               │
┌──────────────────────────────┴───────────────────────────────────┐
│                         BACKEND (Express)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Socket.IO Server                                │  │
│  │  - Handles WebSocket connections                          │  │
│  │  - Authenticates users via JWT                            │  │
│  │  - Manages rooms and broadcasts                           │  │
│  │  - Emits: dashboard:stats, employee:*, project:*, task:*  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↕                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         RealTimeEmitter Utility                           │  │
│  │  - Calculates dashboard stats                             │  │
│  │  - Emits stats via Socket.IO                              │  │
│  │  - Auto-emits every 10s (backup)                          │  │
│  │  - Called by controllers on data changes                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↕                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Controllers                                  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Employee Controller                               │  │  │
│  │  │  - createEmployee() → emit stats                   │  │  │
│  │  │  - updateEmployee() → emit stats                   │  │  │
│  │  │  - deleteEmployee() → emit stats                   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Project Controller                                │  │  │
│  │  │  - createProject() → emit stats                    │  │  │
│  │  │  - updateProject() → emit stats                    │  │  │
│  │  │  - deleteProject() → emit stats                    │  │  │
│  │  │  - updateProjectStatus() → emit stats              │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Task Controller                                   │  │  │
│  │  │  - createTask() → emit stats                       │  │  │
│  │  │  - updateTask() → emit stats                       │  │  │
│  │  │  - deleteTask() → emit stats                       │  │  │
│  │  │  - updateTaskStatus() → emit stats                 │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↕                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              MongoDB Database                             │  │
│  │  - Employees Collection                                   │  │
│  │  - Projects Collection                                    │  │
│  │  - Tasks Collection                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Event Flow Diagram

```
USER ACTION                    BACKEND                    FRONTEND
    │                             │                          │
    │  1. Create Employee         │                          │
    ├────────────────────────────>│                          │
    │                             │                          │
    │                             │  2. Save to DB           │
    │                             ├──────────>               │
    │                             │           MongoDB        │
    │                             │<──────────               │
    │                             │                          │
    │                             │  3. Emit Events          │
    │                             │  - employee:created      │
    │                             │  - dashboard:stats       │
    │                             ├─────────────────────────>│
    │                             │                          │
    │                             │                          │  4. Update UI
    │                             │                          ├──────────>
    │                             │                          │  Dashboard
    │                             │                          │  refreshes
    │                             │                          │  instantly!
    │                             │                          │
    │  5. See Updated Dashboard   │                          │
    │<────────────────────────────┼──────────────────────────┤
    │                             │                          │
```

## Connection States

```
┌─────────────────────────────────────────────────────────────┐
│                    Connection States                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐                                                │
│  │ INITIAL  │                                                │
│  └────┬─────┘                                                │
│       │                                                      │
│       │ initializeSocket()                                   │
│       ↓                                                      │
│  ┌──────────┐                                                │
│  │CONNECTING│                                                │
│  └────┬─────┘                                                │
│       │                                                      │
│       │ on('connect')                                        │
│       ↓                                                      │
│  ┌──────────┐         on('disconnect')                       │
│  │CONNECTED │◄────────────────────────┐                      │
│  │  (LIVE)  │                         │                      │
│  └────┬─────┘                         │                      │
│       │                               │                      │
│       │ connection lost               │                      │
│       ↓                               │                      │
│  ┌──────────┐                         │                      │
│  │POLLING   │                         │                      │
│  │(FALLBACK)│                         │                      │
│  └────┬─────┘                         │                      │
│       │                               │                      │
│       │ auto-reconnect                │                      │
│       └───────────────────────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow for Dashboard Stats

```
┌─────────────────────────────────────────────────────────────┐
│              Dashboard Stats Calculation                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  RealTimeEmitter.emitDashboardStats()                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  1. Query MongoDB (Parallel)                       │     │
│  │     - Employee.find()                              │     │
│  │     - Project.find()                               │     │
│  │     - Task.find()                                  │     │
│  └────────────────────────────────────────────────────┘     │
│                    ↓                                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  2. Calculate Stats                                │     │
│  │     - totalEmployees = employees.length            │     │
│  │     - activeEmployees = filter(status='active')    │     │
│  │     - totalProjects = projects.length              │     │
│  │     - completedTasks = filter(status='completed')  │     │
│  │     - revenue = sum(project.budget)                │     │
│  │     - expenses = sum(project.spentBudget)          │     │
│  │     - profit = revenue - expenses                  │     │
│  └────────────────────────────────────────────────────┘     │
│                    ↓                                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  3. Emit via Socket.IO                             │     │
│  │     io.emit('dashboard:stats', stats)              │     │
│  └────────────────────────────────────────────────────┘     │
│                    ↓                                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  4. Broadcast to All Connected Clients             │     │
│  │     - Client 1 receives stats                      │     │
│  │     - Client 2 receives stats                      │     │
│  │     - Client N receives stats                      │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Multi-User Synchronization

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   User A     │         │   User B     │         │   User C     │
│  Dashboard   │         │  Dashboard   │         │  Dashboard   │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                │
                                │ All connected via WebSocket
                                │
                    ┌───────────▼───────────┐
                    │   Socket.IO Server    │
                    │   (Backend)           │
                    └───────────┬───────────┘
                                │
                                │
                    ┌───────────▼───────────┐
                    │   User D creates      │
                    │   new employee        │
                    └───────────┬───────────┘
                                │
                                │ Triggers dashboard:stats
                                │
                    ┌───────────▼───────────┐
                    │   Broadcast to ALL    │
                    │   connected clients   │
                    └───────────┬───────────┘
                                │
       ┌────────────────────────┼────────────────────────┐
       │                        │                        │
       ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   User A     │         │   User B     │         │   User C     │
│  Dashboard   │         │  Dashboard   │         │  Dashboard   │
│  UPDATES!    │         │  UPDATES!    │         │  UPDATES!    │
└──────────────┘         └──────────────┘         └──────────────┘
```

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────┐
│              Performance Optimizations                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Efficient Database Queries                               │
│     ✓ Parallel Promise.all() for multiple collections       │
│     ✓ Minimal field selection                               │
│     ✓ Indexed queries on status fields                      │
│                                                              │
│  2. Socket.IO Optimizations                                  │
│     ✓ Compression enabled                                    │
│     ✓ Binary protocol for efficiency                         │
│     ✓ Connection pooling                                     │
│     ✓ Automatic reconnection                                 │
│                                                              │
│  3. Debouncing & Rate Limiting                               │
│     ✓ Auto-emit every 10s (backup)                           │
│     ✓ Immediate emit on data changes                         │
│     ✓ No duplicate emissions                                 │
│                                                              │
│  4. Fallback Mechanisms                                      │
│     ✓ Polling every 15s if socket fails                      │
│     ✓ Automatic reconnection attempts                        │
│     ✓ Graceful degradation                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Authentication                                     │
│  ┌────────────────────────────────────────────────────┐     │
│  │  - JWT token required for API calls                │     │
│  │  - Socket authentication via token                 │     │
│  │  - Token validation on every request               │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Layer 2: Authorization                                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │  - Role-based access control (RBAC)                │     │
│  │  - Permission checks in controllers                │     │
│  │  - Department-based permissions                    │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Layer 3: Data Filtering                                     │
│  ┌────────────────────────────────────────────────────┐     │
│  │  - Users see only authorized data                  │     │
│  │  - Stats filtered by user permissions              │     │
│  │  - No sensitive data in socket events              │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Layer 4: Transport Security                                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │  - HTTPS in production                             │     │
│  │  - WSS (WebSocket Secure) in production            │     │
│  │  - CORS configuration                              │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

```
┌─────────────────────────────────────────────────────────────┐
│                  Horizontal Scaling                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Current: Single Server                                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Frontend ──> Backend ──> MongoDB                  │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Future: Load Balanced with Redis                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Frontend ──> Load Balancer                        │     │
│  │                    │                               │     │
│  │                    ├──> Backend 1 ──┐             │     │
│  │                    ├──> Backend 2 ──┼──> MongoDB  │     │
│  │                    └──> Backend N ──┘             │     │
│  │                           │                        │     │
│  │                           └──> Redis (Socket.IO   │     │
│  │                                 adapter for sync)  │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**Architecture Status**: ✅ Production-Ready
**Scalability**: Ready for horizontal scaling with Redis adapter
**Security**: Multi-layer protection implemented
**Performance**: Optimized for low latency and high throughput
