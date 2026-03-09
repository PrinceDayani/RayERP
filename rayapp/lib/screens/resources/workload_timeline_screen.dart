import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/resource_service.dart';
import '../../services/employee_service.dart';
import '../../models/employee.dart';

class WorkloadTimelineScreen extends StatefulWidget {
  final List<ResourceAllocation> allocations;
  const WorkloadTimelineScreen({super.key, required this.allocations});

  @override
  State<WorkloadTimelineScreen> createState() => _WorkloadTimelineScreenState();
}

class _WorkloadTimelineScreenState extends State<WorkloadTimelineScreen> {
  final _empSvc = EmployeeService();
  List<Employee> _employees = [];
  bool _loading = true;

  static const _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final emps = await _empSvc.getAll();
      if (mounted) setState(() { _employees = emps.where((e) => e.status == 'active').toList(); _loading = false; });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  /// Returns utilization % for a given employee in a given month/year.
  double _utilForMonth(String empId, int year, int month) {
    final monthStart = DateTime(year, month, 1);
    final monthEnd = DateTime(year, month + 1, 0);
    double total = 0;
    final projects = <String>[];
    for (final a in widget.allocations) {
      if (a.employeeId != empId) continue;
      if (a.startDate.isBefore(monthEnd) && a.endDate.isAfter(monthStart)) {
        total += a.utilizationPct;
        projects.add(a.projectName);
      }
    }
    return total;
  }

  List<String> _projectsForMonth(String empId, int year, int month) {
    final monthStart = DateTime(year, month, 1);
    final monthEnd = DateTime(year, month + 1, 0);
    return widget.allocations
        .where((a) => a.employeeId == empId && a.startDate.isBefore(monthEnd) && a.endDate.isAfter(monthStart))
        .map((a) => a.projectName)
        .toList();
  }

  Color _cellColor(double util) {
    if (util == 0) return const Color(0xFFF3F4F6);
    if (util <= 50) return AppTheme.green.withOpacity(0.2);
    if (util <= 80) return AppTheme.green.withOpacity(0.5);
    if (util <= 100) return AppTheme.amber.withOpacity(0.6);
    return AppTheme.red.withOpacity(0.7);
  }

  Color _cellTextColor(double util) {
    if (util == 0) return AppTheme.textMuted;
    if (util <= 80) return AppTheme.green;
    if (util <= 100) return AppTheme.amber;
    return AppTheme.red;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));

    final now = DateTime.now();
    final months = List.generate(6, (i) {
      final d = DateTime(now.year, now.month + i);
      return (year: d.year, month: d.month, label: _months[d.month - 1]);
    });

    const nameWidth = 110.0;
    const cellWidth = 64.0;
    const cellHeight = 44.0;

    return Column(children: [
      // Legend
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
        child: Row(children: [
          _legend('0%', const Color(0xFFF3F4F6), AppTheme.textMuted),
          const SizedBox(width: 10),
          _legend('≤50%', AppTheme.green.withOpacity(0.2), AppTheme.green),
          const SizedBox(width: 10),
          _legend('≤80%', AppTheme.green.withOpacity(0.5), AppTheme.green),
          const SizedBox(width: 10),
          _legend('≤100%', AppTheme.amber.withOpacity(0.6), AppTheme.amber),
          const SizedBox(width: 10),
          _legend('>100%', AppTheme.red.withOpacity(0.7), AppTheme.red),
        ]),
      ),
      Expanded(
        child: SingleChildScrollView(
          scrollDirection: Axis.vertical,
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              // Header row
              Row(children: [
                SizedBox(width: nameWidth),
                ...months.map((m) => SizedBox(
                  width: cellWidth,
                  child: Center(child: Text('${m.label} ${m.year.toString().substring(2)}',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textSecondary))),
                )),
              ]),
              const SizedBox(height: 6),
              // Employee rows
              ..._employees.map((emp) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(children: [
                  SizedBox(
                    width: nameWidth,
                    child: Text(emp.fullName, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                        overflow: TextOverflow.ellipsis),
                  ),
                  ...months.map((m) {
                    final util = _utilForMonth(emp.id, m.year, m.month);
                    final projects = _projectsForMonth(emp.id, m.year, m.month);
                    return Tooltip(
                      message: util == 0 ? 'No allocation' : '${util.toStringAsFixed(0)}%\n${projects.join('\n')}',
                      child: Container(
                        width: cellWidth - 4,
                        height: cellHeight,
                        margin: const EdgeInsets.symmetric(horizontal: 2),
                        decoration: BoxDecoration(
                          color: _cellColor(util),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          util == 0 ? '—' : '${util.toStringAsFixed(0)}%',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _cellTextColor(util)),
                        ),
                      ),
                    );
                  }),
                ]),
              )),
            ]),
          ),
        ),
      ),
    ]);
  }

  Widget _legend(String label, Color bg, Color text) => Row(mainAxisSize: MainAxisSize.min, children: [
    Container(width: 14, height: 14, decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(3),
        border: Border.all(color: text.withOpacity(0.3)))),
    const SizedBox(width: 4),
    Text(label, style: TextStyle(fontSize: 10, color: text, fontWeight: FontWeight.w600)),
  ]);
}
