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
import 'communication/chat_screen.dart';
import 'communication/communication_screen.dart';
import 'analytics/analytics_hub_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 2; // Dashboard is center (index 2)
  late final List<Widget> _screens;
  int _unreadNotifications = 0;

  @override
  void initState() {
    super.initState();
    _screens = [
      const ProjectListScreen(),           // 0 - Projects
      const TaskListScreen(),               // 1 - Tasks
      HomeTab(onNavigate: _setTab),         // 2 - Dashboard (center)
      const ChatScreen(),                   // 3 - Chat
      const _MenuScreen(),                  // 4 - More
    ];
    _loadUnreadCount();
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
    if (_currentIndex == 3) setState(() => _unreadNotifications = 0);
  }

  static const _navItems = [
    (Icons.folder_outlined,    Icons.folder,    'Projects'),
    (Icons.task_outlined,      Icons.task,      'Tasks'),
    (Icons.dashboard_outlined, Icons.dashboard, 'Dashboard'),
    (Icons.chat_bubble_outline,Icons.chat_bubble,'Chat'),
    (Icons.grid_view_outlined, Icons.grid_view, 'More'),
  ];

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final wide = AppTheme.isWide(context);
    final title = _navItems[_currentIndex].$3;

    final appBar = AppBar(
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
          if (auth.user != null && !wide)
            Text(auth.user!.name, style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280), fontWeight: FontWeight.normal)),
        ],
      ),
      actions: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined),
              tooltip: 'Notifications',
              onPressed: () => setState(() { _currentIndex = 3; _unreadNotifications = 0; }),
            ),
            if (_unreadNotifications > 0)
              Positioned(
                right: 6, top: 6,
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
        PopupMenuButton<String>(
          icon: const Icon(Icons.account_circle_outlined),
          tooltip: 'Account',
          onSelected: (value) async {
            if (value == 'toggle_theme') {
              context.read<ThemeProvider>().toggle();
            } else if (value == 'change_password') {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const ChangePasswordScreen()));
            } else if (value == 'logout') {
              await auth.logout();
              if (context.mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
            }
          },
          itemBuilder: (_) => [
            if (auth.user != null)
              PopupMenuItem(
                enabled: false,
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(auth.user!.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.textPrimary)),
                  Text(auth.user!.email, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                ]),
              ),
            if (auth.user != null) const PopupMenuDivider(),
            PopupMenuItem(
              value: 'toggle_theme',
              child: Row(children: [
                Icon(context.read<ThemeProvider>().isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined, size: 16, color: AppTheme.textSecondary),
                const SizedBox(width: 10),
                Text(context.read<ThemeProvider>().isDark ? 'Light Mode' : 'Dark Mode', style: const TextStyle(fontSize: 13)),
              ]),
            ),
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
    );

    void onSelect(int i) {
      setState(() => _currentIndex = i);
      _clearNotificationBadge();
    }

    if (wide) {
      // ── Wide layout: NavigationRail + content side by side ──
      return Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: appBar,
        body: Row(
          children: [
            NavigationRail(
              selectedIndex: _currentIndex,
              onDestinationSelected: onSelect,
              labelType: NavigationRailLabelType.all,
              backgroundColor: Theme.of(context).colorScheme.surface,
              indicatorColor: AppTheme.primary.withOpacity(0.15),
              selectedIconTheme: const IconThemeData(color: AppTheme.primary),
              selectedLabelTextStyle: const TextStyle(color: AppTheme.primary, fontSize: 11, fontWeight: FontWeight.w700),
              unselectedLabelTextStyle: const TextStyle(fontSize: 11),
              leading: auth.user != null
                  ? Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Column(children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: AppTheme.primary.withOpacity(0.12),
                          child: Text(
                            auth.user!.name.isNotEmpty ? auth.user!.name[0].toUpperCase() : '?',
                            style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w700),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(auth.user!.name.split(' ').first,
                            style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
                      ]),
                    )
                  : null,
              destinations: [
                for (final item in _navItems)
                  NavigationRailDestination(
                    icon: item.$1 == Icons.chat_bubble_outline && _unreadNotifications > 0
                        ? Badge(label: Text('$_unreadNotifications'), child: Icon(item.$1))
                        : Icon(item.$1),
                    selectedIcon: Icon(item.$2, color: AppTheme.primary),
                    label: Text(item.$3),
                  ),
              ],
            ),
            const VerticalDivider(width: 1, thickness: 1),
            Expanded(child: _screens[_currentIndex]),
          ],
        ),
      );
    }

    // ── Narrow layout: bottom NavigationBar ──
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: appBar,
      body: _screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: onSelect,
        backgroundColor: Theme.of(context).colorScheme.surface,
        indicatorColor: AppTheme.primary.withOpacity(0.15),
        surfaceTintColor: Colors.transparent,
        elevation: 8,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        indicatorShape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
        destinations: [
          for (final item in _navItems)
            NavigationDestination(
              icon: item.$1 == Icons.chat_bubble_outline && _unreadNotifications > 0
                  ? Badge(label: Text('$_unreadNotifications'), child: Icon(item.$1))
                  : Icon(item.$1),
              selectedIcon: Icon(item.$2, color: AppTheme.primary),
              label: item.$3,
            ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Menu Screen — 3×grid of all secondary modules
// ─────────────────────────────────────────────────────────────────────────────

class _MenuScreen extends StatelessWidget {
  const _MenuScreen();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final w = MediaQuery.of(context).size.width;
    final cols = w < 480 ? 2 : w < 768 ? 3 : w < 1024 ? 4 : 5;
    final pad = AppTheme.hPad(context);
    final items = [
      (Icons.people_rounded,              'Employees',    AppTheme.blue,   const EmployeeListScreen()),
      (Icons.access_time_rounded,         'Attendance',   AppTheme.amber,  const AttendanceListScreen()),
      (Icons.groups_rounded,              'Resources',    AppTheme.cyan,   const ResourceDashboardScreen()),
      (Icons.business_rounded,            'Departments',  AppTheme.teal,   const DepartmentListScreen()),
      (Icons.analytics_rounded,           'Analytics',    AppTheme.purple, const AnalyticsHubScreen()),
      (Icons.campaign_outlined,           'Comms',        AppTheme.green,  const CommunicationScreen()),
      (Icons.admin_panel_settings_rounded,'Admin',        AppTheme.red,    const AdminScreen()),
    ];

    return AppTheme.constrain(
      GridView.builder(
        padding: EdgeInsets.all(pad),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: cols,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1,
        ),
        itemCount: items.length,
        itemBuilder: (context, i) {
          final (icon, label, color, screen) = items[i];
          return Material(
            color: isDark ? const Color(0xFF1F2937) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => Scaffold(
                    appBar: AppBar(title: Text(label)),
                    body: screen,
                  ),
                ),
              ),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: isDark ? const Color(0xFF374151) : const Color(0xFFE5E7EB)),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(icon, color: color, size: 26),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isDark ? const Color(0xFFD1D5DB) : AppTheme.textPrimary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
