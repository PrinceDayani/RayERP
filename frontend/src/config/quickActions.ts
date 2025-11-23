// Quick Actions Configuration
export interface QuickAction {
  title: string;
  description: string;
  href: string;
  color: string;
  badgeText: string;
  minRole?: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Add Employee",
    description: "Register a new employee",
    href: "/dashboard/employees/create",
    color: "blue",
    badgeText: "EMPLOYEE"
  },
  {
    title: "New Project",
    description: "Create a new project",
    href: "/dashboard/projects/create",
    color: "green",
    badgeText: "PROJECT"
  },
  {
    title: "Add Contact",
    description: "Register a new contact",
    href: "/dashboard/contacts/new",
    color: "purple",
    badgeText: "CONTACT"
  },
  {
    title: "Manage Tasks",
    description: "View and assign tasks",
    href: "/dashboard/tasks",
    color: "indigo",
    badgeText: "TASKS"
  },
  {
    title: "Attendance",
    description: "Track employee attendance",
    href: "/dashboard/employees/attendance",
    color: "amber",
    badgeText: "ATTENDANCE"
  },
  {
    title: "My Tasks",
    description: "View your assigned tasks",
    href: "/dashboard/projects/my-tasks",
    color: "cyan",
    badgeText: "MY TASKS"
  },
  {
    title: "Employee List",
    description: "View and manage employees",
    href: "/dashboard/employees",
    color: "pink",
    badgeText: "LIST"
  },
  {
    title: "Generate Reports",
    description: "Create employee and project reports",
    href: "/dashboard/reports",
    color: "orange",
    badgeText: "REPORT"
  }
];
