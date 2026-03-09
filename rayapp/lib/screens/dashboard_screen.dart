import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../services/auth_provider.dart';
import '../services/theme_provider.dart';
import 'login_screen.dart';
import 'home_tab.dart';
import 'employees/employee_list_screen.dart';
import 'projects/project_list_screen.dart';
import 'attendance/attendance_list_screen.dart';

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
    ];
  }

  void _setTab(int i) => setState(() => _currentIndex = i);

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    const titles = ['Dashboard', 'Employees', 'Projects', 'Attendance'];

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
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: InkWell(
              borderRadius: BorderRadius.circular(20),
              onTap: () async {
                await auth.logout();
                if (context.mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.logout_outlined, size: 15, color: Color(0xFF6B7280)),
                  SizedBox(width: 4),
                  Text('Logout', style: TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                ]),
              ),
            ),
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
        ],
      ),
    );
  }
}
