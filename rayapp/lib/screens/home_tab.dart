import 'package:flutter/material.dart';
import 'dashboard_overview_tab.dart';

class HomeTab extends StatelessWidget {
  final void Function(int) onNavigate;
  const HomeTab({super.key, required this.onNavigate});

  @override
  Widget build(BuildContext context) {
    return DashboardOverviewTab(onNavigate: onNavigate);
  }
}
