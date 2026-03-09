import 'package:flutter/material.dart';
import '../../../config/app_theme.dart';
import '../../../models/employee_stats.dart';
import '../../../services/employee_stats_service.dart';

class ReportsTab extends StatefulWidget {
  const ReportsTab({super.key});
  @override
  State<ReportsTab> createState() => _ReportsTabState();
}

class _ReportsTabState extends State<ReportsTab> {
  final _svc = EmployeeStatsService();
  List<DeptSummary>? _dept;
  List<AttendanceSummaryItem>? _att;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        _svc.getDeptSummary(),
        _svc.getAttendanceSummary(),
      ]);
      if (!mounted) return;
      setState(() {
        _dept = results[0] as List<DeptSummary>;
        _att = results[1] as List<AttendanceSummaryItem>;
      });
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.error_outline, color: AppTheme.red, size: 32),
        const SizedBox(height: 8),
        Text(_error!, style: const TextStyle(color: AppTheme.red), textAlign: TextAlign.center),
        TextButton(onPressed: () { setState(() { _error = null; _dept = null; _att = null; }); _load(); }, child: const Text('Retry')),
      ]));
    }
    if (_dept == null || _att == null) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    }
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(children: [
        _section('Department Summary', _buildDept()),
        const SizedBox(height: 12),
        _section('Attendance Summary (This Month)', _buildAtt()),
      ]),
    );
  }

  Widget _buildDept() {
    if (_dept!.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Text('No data', style: TextStyle(color: AppTheme.textSecondary)),
      );
    }
    return Column(
      children: _dept!.map((d) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Center(child: Icon(Icons.business_outlined, size: 14, color: AppTheme.primary)),
          ),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(d.department.isEmpty ? 'Unassigned' : d.department,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
            Text('${d.count} employees',
                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
          ])),
          Text('₹${(d.avgSalary / 1000).toStringAsFixed(0)}k avg',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.teal)),
        ]),
      )).toList(),
    );
  }

  Widget _buildAtt() {
    if (_att!.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Text('No data', style: TextStyle(color: AppTheme.textSecondary)),
      );
    }
    return Column(
      children: _att!.map((a) {
        final color = AppTheme.statusColor(a.status);
        final bg = AppTheme.statusBg(a.status);
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
              child: Text(a.status.toUpperCase(),
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color, letterSpacing: 0.5)),
            ),
            const SizedBox(width: 10),
            Expanded(child: Text('${a.count} records',
                style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
            Text('${a.totalHours.toStringAsFixed(0)}h',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
          ]),
        );
      }).toList(),
    );
  }

  Widget _section(String title, Widget child) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Text(title.toUpperCase(),
                style: const TextStyle(
                    fontSize: 10, fontWeight: FontWeight.w700,
                    color: AppTheme.textMuted, letterSpacing: 0.8)),
          ),
          const Divider(height: 1, color: AppTheme.border),
          child,
        ]),
      );
}
