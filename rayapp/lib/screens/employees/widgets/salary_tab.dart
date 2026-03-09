import 'package:flutter/material.dart';
import '../../../config/app_theme.dart';
import '../../../models/employee.dart';
import '../../../models/employee_stats.dart';
import '../../../services/employee_stats_service.dart';

class SalaryTab extends StatefulWidget {
  final Employee employee;
  const SalaryTab({super.key, required this.employee});
  @override
  State<SalaryTab> createState() => _SalaryTabState();
}

class _SalaryTabState extends State<SalaryTab> {
  final _svc = EmployeeStatsService();
  List<SalaryHistory>? _history;

  @override
  void initState() {
    super.initState();
    _svc.getSalaryHistory(widget.employee.id).then((v) {
      if (mounted) setState(() => _history = v);
    }).catchError((_) {
      if (mounted) setState(() => _history = []);
    });
  }

  @override
  Widget build(BuildContext context) {
    final e = widget.employee;
    final tenure = e.hireDate != null ? DateTime.now().difference(e.hireDate!).inDays : 0;
    final years = tenure ~/ 365;
    final months = (tenure % 365) ~/ 30;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(children: [
        // Salary hero card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppTheme.primary, Color(0xFFCD2E4F)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Current Salary', style: TextStyle(fontSize: 12, color: Colors.white70)),
            const SizedBox(height: 6),
            Text(
              e.salary != null ? '₹${e.salary!.toStringAsFixed(0)}' : 'Not set',
              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white),
            ),
            const SizedBox(height: 4),
            Text('per annum', style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.7))),
          ]),
        ),
        const SizedBox(height: 16),
        if (e.salary != null) ...[
          _section('Breakdown', [
            _tile('Annual', '₹${e.salary!.toStringAsFixed(0)}', Icons.calendar_today_outlined, AppTheme.primary),
            _tile('Monthly', '₹${(e.salary! / 12).toStringAsFixed(0)}', Icons.date_range_outlined, AppTheme.blue),
            _tile('Weekly', '₹${(e.salary! / 52).toStringAsFixed(0)}', Icons.view_week_outlined, AppTheme.teal),
            _tile('Daily', '₹${(e.salary! / 260).toStringAsFixed(0)}', Icons.today_outlined, AppTheme.purple),
          ]),
          const SizedBox(height: 12),
        ],
        _section('Employment', [
          _tile('Status', e.status, Icons.circle_outlined, AppTheme.statusColor(e.status)),
          _tile('Position', e.position, Icons.work_outline, AppTheme.textSecondary),
          if ((e.department ?? '').isNotEmpty)
            _tile('Department', e.department!, Icons.business_outlined, AppTheme.textSecondary),
          if (e.hireDate != null)
            _tile('Hire Date', AppTheme.fmtDate(e.hireDate!), Icons.calendar_today_outlined, AppTheme.textSecondary),
          _tile('Tenure', '${years}y ${months}m', Icons.timelapse_outlined, AppTheme.amber),
        ]),
        const SizedBox(height: 12),
        // Salary history
        _historySection(),
      ]),
    );
  }

  Widget _historySection() {
    if (_history == null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
        child: const Center(child: SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary))),
      );
    }
    if (_history!.isEmpty) {
      return _section('Salary History', [
        const Padding(
          padding: EdgeInsets.all(16),
          child: Text('No history available', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
        ),
      ]);
    }
    return _section('Salary History', _history!.map((h) => _historyTile(h)).toList());
  }

  Widget _historyTile(SalaryHistory h) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: AppTheme.green.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
            child: const Icon(Icons.trending_up_outlined, size: 14, color: AppTheme.green),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('₹${h.salary.toStringAsFixed(0)}',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
            if ((h.reason ?? '').isNotEmpty)
              Text(h.reason!, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
          ])),
          Text(AppTheme.fmtDate(h.effectiveDate), style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
        ]),
      );

  Widget _section(String title, List<Widget> children) => Container(
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Text(title.toUpperCase(),
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8)),
          ),
          const Divider(height: 1, color: AppTheme.border),
          ...children,
        ]),
      );

  Widget _tile(String label, String value, IconData icon, Color color) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
        child: Row(children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 12),
          SizedBox(width: 90, child: Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary))),
        ]),
      );
}
