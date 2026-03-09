import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import 'dashboard_analytics_screen.dart';
import 'invoice_analytics_screen.dart';
import 'approval_analytics_screen.dart';
import 'budget_analytics_screen.dart';
import 'financial_reports_screen.dart';
import 'employee_reports_screen.dart';
import '../projects/global_analytics_screen.dart';
import '../tasks/task_analytics_screen.dart';
import '../resources/skill_analytics_screen.dart';

class AnalyticsHubScreen extends StatelessWidget {
  const AnalyticsHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final p = w < 400 ? 12.0 : w < 768 ? 16.0 : 24.0;
    final cols = w < 400 ? 1 : w < 600 ? 2 : w < 900 ? 3 : 4;

    final modules = [
      _Module('Dashboard Analytics', 'KPIs, trends & monitoring',
          Icons.dashboard_outlined, AppTheme.primary,
          const DashboardAnalyticsScreen()),
      _Module('Financial Reports', 'P&L, Balance Sheet, Cash Flow & more',
          Icons.account_balance_outlined, AppTheme.blue,
          const FinancialReportsScreen()),
      _Module('Invoice Analytics', 'Invoice status, collection & aging',
          Icons.receipt_long_outlined, AppTheme.teal,
          const InvoiceAnalyticsScreen()),
      _Module('Approval Analytics', 'Approval rates & request tracking',
          Icons.approval_outlined, AppTheme.amber,
          const ApprovalAnalyticsScreen()),
      _Module('Budget Analytics', 'Utilization, variance & scheduling',
          Icons.account_balance_wallet_outlined, AppTheme.green,
          const BudgetAnalyticsScreen()),
      _Module('Employee Reports', 'Headcount, attendance & productivity',
          Icons.people_outline, AppTheme.cyan,
          const EmployeeReportsScreen()),
      _Module('Project Analytics', 'Progress, performance & budget',
          Icons.folder_outlined, AppTheme.purple,
          const GlobalAnalyticsScreen()),
      _Module('Task Analytics', 'Burndown, velocity & team performance',
          Icons.task_outlined, AppTheme.primaryHover,
          const TaskAnalyticsScreen()),
      _Module('Resource Analytics', 'Skills, capacity & utilization',
          Icons.groups_outlined, Color(0xFF0891B2),
          const SkillAnalyticsScreen()),
    ];

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(title: const Text('Analytics & Reports')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(p),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppTheme.primary, AppTheme.primaryHover],
              ),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Icon(Icons.analytics_outlined, color: Colors.white, size: 28),
              const SizedBox(height: 10),
              const Text('Analytics & Reporting',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text('${modules.length} modules · Real-time data',
                  style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13)),
            ]),
          ),
          const SizedBox(height: 20),
          if (cols == 1)
            Column(children: modules.map((m) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _ModuleTile(module: m),
            )).toList())
          else
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: cols,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: w < 600 ? 1.1 : 1.2,
              ),
              itemCount: modules.length,
              itemBuilder: (_, i) => _ModuleCard(module: modules[i]),
            ),
          const SizedBox(height: 16),
        ]),
      ),
    );
  }
}

class _Module {
  final String title, subtitle;
  final IconData icon;
  final Color color;
  final Widget screen;
  const _Module(this.title, this.subtitle, this.icon, this.color, this.screen);
}

class _ModuleCard extends StatelessWidget {
  final _Module module;
  const _ModuleCard({required this.module});

  @override
  Widget build(BuildContext context) => Material(
    color: Colors.white,
    borderRadius: BorderRadius.circular(14),
    child: InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => module.screen)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.border),
        ),
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: module.color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(module.icon, color: module.color, size: 22),
          ),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(module.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary), maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 3),
            Text(module.subtitle, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                maxLines: 2, overflow: TextOverflow.ellipsis),
          ]),
        ]),
      ),
    ),
  );
}

class _ModuleTile extends StatelessWidget {
  final _Module module;
  const _ModuleTile({required this.module});

  @override
  Widget build(BuildContext context) => Material(
    color: Colors.white,
    borderRadius: BorderRadius.circular(12),
    child: InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => module.screen)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        padding: const EdgeInsets.all(14),
        child: Row(children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: module.color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(module.icon, color: module.color, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(module.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary)),
            Text(module.subtitle, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
          ])),
          const Icon(Icons.chevron_right, color: AppTheme.textMuted, size: 20),
        ]),
      ),
    ),
  );
}
