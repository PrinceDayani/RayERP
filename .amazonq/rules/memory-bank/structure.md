# RayERP - Project Structure

## Directory Organization

```
RayERP/
├── backend/                    # Express.js API Server
├── frontend/                   # Next.js Web Application
├── rayapp/                     # Flutter Mobile Application
├── Documentation/              # User manuals and guides
├── .amazonq/                   # Amazon Q configuration
│   └── rules/                  # Development rules and memory bank
├── docker-compose.yml          # Container orchestration
└── *.md                        # Project documentation
```

## Backend Structure

```
backend/
├── src/
│   ├── controllers/           # Business logic handlers
│   ├── middleware/            # Request processing (auth, validation, error handling)
│   ├── models/                # Mongoose database schemas
│   ├── modules/               # Modular feature implementations
│   │   └── projects/          # Project-specific modules
│   │       ├── tasks/         # Task management module
│   │       ├── budget/        # Budget & planning module
│   │       ├── timeline/      # Timeline & events module
│   │       ├── files/         # File management module
│   │       ├── finance/       # Analytics & metrics module
│   │       ├── permissions/   # Access control module
│   │       └── activity/      # Activity logs module
│   ├── routes/                # API endpoint definitions
│   ├── services/              # Business logic services
│   ├── socket/                # Socket.IO real-time handlers
│   ├── utils/                 # Helper functions and utilities
│   ├── config/                # Configuration files
│   ├── types/                 # TypeScript type definitions
│   ├── migrations/            # Database migration scripts
│   └── server.ts              # Application entry point
├── scripts/                   # Database seeding and migration scripts
├── public/                    # Static assets
├── uploads/                   # User-uploaded files
│   ├── avatars/               # User profile images
│   ├── chat/                  # Chat attachments
│   └── projects/              # Project files
├── .env                       # Environment variables
└── package.json               # Dependencies and scripts
```

## Frontend Structure

```
frontend/
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Main application pages
│   │   ├── layout.tsx         # Root layout
│   │   └── providers.tsx      # Global providers
│   ├── components/            # React UI components
│   │   ├── ui/                # Shadcn/ui base components
│   │   ├── layout/            # Layout components (sidebar, header)
│   │   ├── tasks/             # Task-related components
│   │   ├── projects/          # Project-related components
│   │   ├── finance/           # Finance-related components
│   │   └── employees/         # Employee-related components
│   ├── contexts/              # React Context providers
│   │   ├── auth/              # Authentication context
│   │   ├── socket/            # Socket.IO context
│   │   └── theme/             # Theme context
│   ├── hooks/                 # Custom React hooks
│   │   ├── tasks/             # Task management hooks
│   │   ├── projects/          # Project management hooks
│   │   └── finance/           # Finance hooks
│   ├── lib/                   # Utilities and API clients
│   │   ├── api.ts             # Axios API client
│   │   └── utils.ts           # Helper functions
│   ├── types/                 # TypeScript type definitions
│   │   ├── tasks/             # Task types
│   │   ├── projects/          # Project types
│   │   └── finance/           # Finance types
│   └── utils/                 # Utility functions
│       └── tasks/             # Task-specific utilities
├── public/                    # Static assets
├── .env.local                 # Environment variables
└── package.json               # Dependencies and scripts
```

## Mobile App Structure

```
rayapp/
├── lib/
│   ├── config/                # App configuration
│   ├── models/                # Data models
│   ├── screens/               # UI screens
│   ├── services/              # API services
│   ├── utils/                 # Utility functions
│   ├── widgets/               # Reusable widgets
│   └── main.dart              # Application entry point
├── android/                   # Android platform files
├── ios/                       # iOS platform files
├── web/                       # Web platform files
└── pubspec.yaml               # Flutter dependencies
```

## Core Components & Relationships

### Backend Architecture

**Controllers** → Handle HTTP requests and responses
- Validate input data
- Call service layer for business logic
- Return formatted responses

**Services** → Implement business logic
- Interact with models/database
- Perform complex operations
- Handle transactions

**Models** → Define database schemas
- Mongoose schemas with validation
- Virtual fields and methods
- Indexes for performance

**Modules** → Encapsulate feature-specific logic
- Self-contained functionality
- Reduced coupling between features
- Easier testing and maintenance

**Middleware** → Process requests before controllers
- Authentication (JWT verification)
- Authorization (permission checks)
- Input validation
- Error handling

**Socket Handlers** → Real-time communication
- Task updates
- Project notifications
- Chat messages
- Activity feeds

### Frontend Architecture

**Pages (App Router)** → Route-based components
- Server and client components
- Data fetching with React Query
- Layout composition

**Components** → Reusable UI elements
- Shadcn/ui base components
- Feature-specific components
- Composition patterns

**Contexts** → Global state management
- Authentication state
- Socket connection
- Theme preferences

**Hooks** → Reusable logic
- Data fetching with React Query
- Form handling with React Hook Form
- Custom business logic

**API Client** → Backend communication
- Axios instance with interceptors
- Automatic token injection
- Error handling

## Architectural Patterns

### Modular Architecture
- **7 Focused Modules**: Tasks, Budget, Timeline, Files, Finance, Permissions, Activity
- **50% Reduction**: Main controller size reduced through modularization
- **Independent Development**: Multiple developers can work on different modules
- **100% Backward Compatible**: No breaking changes to existing APIs

### RESTful API Design
- Resource-based endpoints
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Consistent response formats
- Proper status codes

### Real-Time Communication
- Socket.IO for bidirectional communication
- Event-based architecture
- Room-based message routing
- Automatic reconnection

### Authentication & Authorization
- JWT tokens for stateless authentication
- Role-based access control (RBAC)
- Permission-based route guards
- 3-layer security (API, Sidebar, Routes)

### Database Design
- MongoDB with Mongoose ODM
- Schema validation
- Indexes for query optimization
- Aggregation pipelines for complex queries

### Component Composition
- Atomic design principles
- Reusable UI components
- Props-based customization
- Compound component patterns

### State Management
- React Context for global state
- React Query for server state
- Local state with useState/useReducer
- Form state with React Hook Form

### Error Handling
- Try-catch blocks in async operations
- Error boundaries in React
- Centralized error middleware
- User-friendly error messages

### Performance Optimization
- Code splitting with Next.js
- Image optimization
- Caching strategies
- Database query optimization
- Lazy loading components
