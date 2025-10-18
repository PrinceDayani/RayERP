# Budget Management & Project Connection

## Overview
The Budget Management system is now fully connected with Project Management. When budgets are created, updated, or deleted, the corresponding project's budget fields are automatically synchronized.

## How It Works

### 1. Budget Creation
When a budget is created for a project:
- The project's `budget` field is updated with the total budget amount
- The project's `spentBudget` field is updated with the sum of all category spent amounts
- Real-time updates are emitted via WebSocket

### 2. Budget Updates
When a budget is updated:
- The project's `budget` field is updated with the new total budget
- The project's `spentBudget` field is recalculated from category spent amounts
- Changes are reflected immediately in the project view

### 3. Budget Deletion
When a budget is deleted:
- The project's `budget` field is reset to 0
- The project's `spentBudget` field is reset to 0

### 4. Manual Sync
A sync button is available in the Budget Management page to manually synchronize all existing budgets with their projects.

## API Endpoints

### Backend Routes
- `POST /api/budgets/create` - Creates budget and updates project
- `PUT /api/budgets/:id` - Updates budget and syncs with project
- `DELETE /api/budgets/:id` - Deletes budget and resets project fields
- `POST /api/budgets/sync-projects` - Manually syncs all project budgets

### Project Routes
- `GET /api/projects/:id` - Returns project with budget fields
- `GET /api/projects/:id/budget` - Returns budget(s) for a project

## Frontend Integration

### Project Detail Page
The project detail page (`/dashboard/projects/[id]`) displays:
- Total budget from the Budget document
- Spent amount calculated from budget categories
- Remaining budget
- Budget utilization percentage
- Quick link to manage budget

### Project Budget Page
The dedicated budget page (`/dashboard/projects/[id]/budget`) shows:
- Complete budget breakdown
- Category-wise allocation and spending
- Budget items with quantities and costs
- Create/Edit budget functionality

### Budget Management Page
The main budgets page (`/dashboard/budgets`) includes:
- List of all budgets with project references
- Sync button to manually synchronize budgets with projects
- Analytics and reporting

## Data Flow

```
Budget Creation/Update
    ↓
Budget Controller
    ↓
Save Budget Document
    ↓
Update Project.budget & Project.spentBudget
    ↓
Emit WebSocket Event
    ↓
Frontend Updates
```

## Key Features

1. **Automatic Synchronization**: Budget changes automatically update project fields
2. **Real-time Updates**: WebSocket events keep all clients synchronized
3. **Manual Sync**: Admin can manually sync all budgets if needed
4. **Bidirectional Reference**: Budget references Project, Project stores budget amounts
5. **Calculated Fields**: Spent amounts are calculated from category spending

## Usage

### Creating a Budget for a Project
1. Navigate to project detail page
2. Click "Create Budget" in the Budget tab
3. Fill in budget details and categories
4. Save - project budget fields are automatically updated

### Viewing Project Budget
1. Go to project detail page
2. Click Budget tab to see overview
3. Click "View Full Budget Details" for complete breakdown

### Syncing Existing Budgets
1. Go to Budget Management page (`/dashboard/budgets`)
2. Click "Sync Projects" button
3. All project budgets will be synchronized

## Technical Details

### Models
- **Budget Model**: Contains projectId reference, categories, and spending data
- **Project Model**: Contains budget (number) and spentBudget (number) fields

### Controllers
- **budgetController.ts**: Handles budget CRUD and project synchronization
- **projectController.ts**: Returns project data including budget fields

### Frontend Components
- **ProjectDetailPage**: Displays project with budget overview
- **ProjectBudgetPage**: Full budget management interface
- **BudgetDialog**: Create/edit budget form

## Benefits

1. **Single Source of Truth**: Budget data is centralized in Budget documents
2. **Performance**: Project queries don't need to join with Budget collection
3. **Flexibility**: Can have multiple budgets per project (historical tracking)
4. **Real-time**: Changes are immediately reflected across the application
5. **Audit Trail**: Budget changes are tracked with approval workflow
