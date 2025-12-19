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
  },
  {
    title: "Sales Reports",
    description: "View sales analytics and revenue",
    href: "/dashboard/finance/sales-reports",
    color: "green",
    badgeText: "SALES"
  },
  {
    title: "Create Invoice",
    description: "Generate new invoice",
    href: "/dashboard/finance/invoices",
    color: "blue",
    badgeText: "INVOICE"
  },
  {
    title: "General Ledger",
    description: "View accounting entries",
    href: "/dashboard/general-ledger",
    color: "purple",
    badgeText: "LEDGER"
  },
  {
    title: "Chart of Accounts",
    description: "Manage account structure",
    href: "/dashboard/general-ledger/chart-of-accounts",
    color: "indigo",
    badgeText: "ACCOUNTS"
  }
];
