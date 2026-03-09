import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../services/auth_provider.dart';
import '../services/theme_provider.dart';
import 'login_screen.dart';
import 'change_password_screen.dart';
import 'home_tab.dart';
import 'employees/employee_list_screen.dart';
import 'projects/project_list_screen.dart';
import 'attendance/attendance_list_screen.dart';
import 'resources/resource_dashboard_screen.dart';
import 'departments/department_list_screen.dart';
import 'admin/admin_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;
  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      HomeTab(onNavigate: _setTab),
      const EmployeeListScreen(),
      const ProjectListScreen(),
      const AttendanceListScreen(),
      const ResourceDashboardScreen(),
      const DepartmentListScreen(),
      const AdminScreen(),
    ];
  }

  void _setTab(int i) => setState(() => _currentIndex = i);

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    const titles = ['Dashboard', 'Employees', 'Projects', 'Attendance', 'Resources', 'Departments', 'Admin'];

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(titles[_currentIndex], style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
            if (auth.user != null)
              Text(auth.user!.name, style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280), fontWeight: FontWeight.normal)),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(context.watch<ThemeProvider>().isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
            onPressed: () => context.read<ThemeProvider>().toggle(),
            tooltip: 'Toggle theme',
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.account_circle_outlined),
            tooltip: 'Account',
            onSelected: (value) async {
              if (value == 'change_password') {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const ChangePasswordScreen()));
              } else if (value == 'logout') {
                await auth.logout();
                if (context.mounted) {
                  Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
                }
              }
            },
            itemBuilder: (_) => [
              if (auth.user != null)
                PopupMenuItem(
                  enabled: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(auth.user!.name,
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.textPrimary)),
                      Text(auth.user!.email,
                          style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                    ],
                  ),
                ),
              if (auth.user != null) const PopupMenuDivider(),
              const PopupMenuItem(
                value: 'change_password',
                child: Row(children: [
                  Icon(Icons.lock_reset_outlined, size: 16, color: AppTheme.textSecondary),
                  SizedBox(width: 10),
                  Text('Change Password', style: TextStyle(fontSize: 13)),
                ]),
              ),
              const PopupMenuItem(
                value: 'logout',
                child: Row(children: [
                  Icon(Icons.logout_outlined, size: 16, color: AppTheme.red),
                  SizedBox(width: 10),
                  Text('Logout', style: TextStyle(fontSize: 13, color: AppTheme.red)),
                ]),
              ),
            ],
          ),
        ],
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: _setTab,
        backgroundColor: Colors.white,
        indicatorColor: AppTheme.primary.withOpacity(0.12),
        surfaceTintColor: Colors.transparent,
        elevation: 8,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard, color: AppTheme.primary),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people, color: AppTheme.primary),
            label: 'Employees',
          ),
          NavigationDestination(
            icon: Icon(Icons.folder_outlined),
            selectedIcon: Icon(Icons.folder, color: AppTheme.primary),
            label: 'Projects',
          ),
          NavigationDestination(
            icon: Icon(Icons.access_time_outlined),
            selectedIcon: Icon(Icons.access_time_filled, color: AppTheme.primary),
            label: 'Attendance',
          ),
          NavigationDestination(
            icon: Icon(Icons.groups_outlined),
            selectedIcon: Icon(Icons.groups, color: AppTheme.primary),
            label: 'Resources',
          ),
          NavigationDestination(
            icon: Icon(Icons.business_outlined),
            selectedIcon: Icon(Icons.business, color: AppTheme.primary),
            label: 'Departments',
          ),
          NavigationDestination(
            icon: Icon(Icons.admin_panel_settings_outlined),
            selectedIcon: Icon(Icons.admin_panel_settings, color: AppTheme.primary),
            label: 'Admin',
          ),
        ],
      ),
    );
  }
}
