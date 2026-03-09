import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../services/auth_provider.dart';
import '../services/theme_provider.dart';
import '../services/notification_service.dart';
import '../services/socket_service.dart';
import 'login_screen.dart';
import 'change_password_screen.dart';
import 'home_tab.dart';
import 'employees/employee_list_screen.dart';
import 'projects/project_list_screen.dart';
import 'attendance/attendance_list_screen.dart';
import 'resources/resource_dashboard_screen.dart';
import 'departments/department_list_screen.dart';
import 'admin/admin_screen.dart';
import 'tasks/task_list_screen.dart';
import 'communication/communication_screen.dart';
import 'analytics/analytics_hub_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;
  late final List<Widget> _screens;
  int _unreadNotifications = 0;

  @override
  void initState() {
    super.initState();
    _screens = [
      HomeTab(onNavigate: _setTab),
      const EmployeeListScreen(),
      const ProjectListScreen(),
      const TaskListScreen(),
      const AttendanceListScreen(),
      const ResourceDashboardScreen(),
      const DepartmentListScreen(),
      const CommunicationScreen(),
      const AnalyticsHubScreen(),
      const AdminScreen(),
    ];
    _loadUnreadCount();
    // Update badge on real-time notification
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SocketService>().onNotification.listen((_) {
        if (mounted) setState(() => _unreadNotifications++);
      });
    });
  }

  Future<void> _loadUnreadCount() async {
    try {
      final count = await NotificationService().getUnreadCount();
      if (mounted) setState(() => _unreadNotifications = count);
    } catch (_) {}
  }

  void _setTab(int i) => setState(() => _currentIndex = i);

  void _clearNotificationBadge() {
    if (_currentIndex == 7) setState(() => _unreadNotifications = 0);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    const titles = ['Dashboard', 'Employees', 'Projects', 'Tasks', 'Attendance', 'Resources', 'Departments', 'Communication', 'Analytics', 'Admin'];

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
          // Notification bell shortcut
          Stack(
            clipBehavior: Clip.none,
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                tooltip: 'Notifications',
                onPressed: () {
                  setState(() { _currentIndex = 7; _unreadNotifications = 0; });
                },              ),
              if (_unreadNotifications > 0)
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    decoration: const BoxDecoration(color: AppTheme.red, shape: BoxShape.circle),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    child: Text(
                      _unreadNotifications > 99 ? '99+' : '$_unreadNotifications',
                      style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
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
        onDestinationSelected: (i) {
          setState(() => _currentIndex = i);
          _clearNotificationBadge();
        },
        backgroundColor: Colors.white,
        indicatorColor: AppTheme.primary.withOpacity(0.12),
        surfaceTintColor: Colors.transparent,
        elevation: 8,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard, color: AppTheme.primary),
            label: 'Home',
          ),
          const NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people, color: AppTheme.primary),
            label: 'Employees',
          ),
          const NavigationDestination(
            icon: Icon(Icons.folder_outlined),
            selectedIcon: Icon(Icons.folder, color: AppTheme.primary),
            label: 'Projects',
          ),
          const NavigationDestination(
            icon: Icon(Icons.task_outlined),
            selectedIcon: Icon(Icons.task, color: AppTheme.primary),
            label: 'Tasks',
          ),
          const NavigationDestination(
            icon: Icon(Icons.access_time_outlined),
            selectedIcon: Icon(Icons.access_time_filled, color: AppTheme.primary),
            label: 'Attendance',
          ),
          const NavigationDestination(
            icon: Icon(Icons.groups_outlined),
            selectedIcon: Icon(Icons.groups, color: AppTheme.primary),
            label: 'Resources',
          ),
          const NavigationDestination(
            icon: Icon(Icons.business_outlined),
            selectedIcon: Icon(Icons.business, color: AppTheme.primary),
            label: 'Departments',
          ),
          NavigationDestination(
            icon: _unreadNotifications > 0
                ? Badge(
                    label: Text('$_unreadNotifications'),
                    child: const Icon(Icons.forum_outlined),
                  )
                : const Icon(Icons.forum_outlined),
            selectedIcon: const Icon(Icons.forum, color: AppTheme.primary),
            label: 'Comms',
          ),
          const NavigationDestination(
            icon: Icon(Icons.analytics_outlined),
            selectedIcon: Icon(Icons.analytics, color: AppTheme.primary),
            label: 'Analytics',
          ),
          const NavigationDestination(
            icon: Icon(Icons.admin_panel_settings_outlined),
            selectedIcon: Icon(Icons.admin_panel_settings, color: AppTheme.primary),
            label: 'Admin',
          ),
        ],
      ),
    );
  }
}
