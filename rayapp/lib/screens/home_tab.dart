import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_provider.dart';
import 'dashboard_overview_tab.dart';
import 'personalized_dashboard_tab.dart';

class HomeTab extends StatelessWidget {
  final void Function(int) onNavigate;
  const HomeTab({super.key, required this.onNavigate});

  @override
  Widget build(BuildContext context) {
    final role = context.watch<AuthProvider>().user?.role.toLowerCase() ?? '';
    final isAdmin = role == 'root' || role == 'super admin';
    return isAdmin
        ? DashboardOverviewTab(onNavigate: onNavigate)
        : PersonalizedDashboardTab(onNavigate: onNavigate);
  }
}
