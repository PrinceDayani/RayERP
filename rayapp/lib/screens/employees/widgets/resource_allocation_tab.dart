import 'package:flutter/material.dart';
import '../../../config/app_theme.dart';
import '../../../services/employee_stats_service.dart';

class ResourceAllocationTab extends StatefulWidget {
  final String employeeId;
  const ResourceAllocationTab({super.key, required this.employeeId});
  @override
  State<ResourceAllocationTab> createState() => _ResourceAllocationTabState();
}

class _ResourceAllocationTabState extends State<ResourceAllocationTab> {
  final _svc = EmployeeStatsService();
  List<ProjectWithTeam> _projects = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final data = await _svc.getEmployeeProjectsRaw(widget.employeeId);
      if (mounted) setState(() { _projects = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_error != null) return Center(child: Text(_error!, style: const TextStyle(color: AppTheme.red)));
    if (_projects.isEmpty) return const Center(child: Text('No active projects', style: TextStyle(color: AppTheme.textSecondary)));

    final now = DateTime.now();
    final rangeStart = DateTime(now.year, now.month, 1);
    final rangeEnd = DateTime(now.year, now.month + 6, 0);
    final totalDays = rangeEnd.difference(rangeStart).inDays.toDouble();

    final months = List.generate(6, (i) {
      final d = DateTime(now.year, now.month + i, 1);
      return _monthLabel(d);
    });

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Month header
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFE5E7EB))),
          child: Row(children: months.map((m) => Expanded(
            child: Text(m, textAlign: TextAlign.center, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF6B7280))),
          )).toList()),
        ),
        const SizedBox(height: 8),
        // Today marker label
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(children: [
            const Icon(Icons.today_outlined, size: 12, color: AppTheme.primary),
            const SizedBox(width: 4),
            Text('Today: ${now.toIso8601String().split('T')[0]}', style: const TextStyle(fontSize: 11, color: AppTheme.primary, fontWeight: FontWeight.w600)),
          ]),
        ),
        // Project bars
        ..._projects.map((p) => _projectBar(p, rangeStart, rangeEnd, totalDays)),
        const SizedBox(height: 12),
        // Legend
        Wrap(spacing: 12, runSpacing: 6, children: [
          _legend('Active', const Color(0xFF16A34A)),
          _legend('Planning', const Color(0xFF2563EB)),
          _legend('On Hold', const Color(0xFFD97706)),
          _legend('Completed', const Color(0xFF6B7280)),
        ]),
      ]),
    );
  }

  Widget _projectBar(ProjectWithTeam p, DateTime rangeStart, DateTime rangeEnd, double totalDays) {
    final barStart = p.startDate.isBefore(rangeStart) ? rangeStart : p.startDate;
    final barEnd = p.endDate.isAfter(rangeEnd) ? rangeEnd : p.endDate;
    if (barEnd.isBefore(rangeStart) || barStart.isAfter(rangeEnd)) return const SizedBox.shrink();

    final leftFrac = barStart.difference(rangeStart).inDays / totalDays;
    final widthFrac = (barEnd.difference(barStart).inDays + 1) / totalDays;
    final color = _statusColor(p.status);

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(p.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF111827)), overflow: TextOverflow.ellipsis),
        const SizedBox(height: 4),
        LayoutBuilder(builder: (_, constraints) {
          final totalWidth = constraints.maxWidth;
          return Stack(children: [
            Container(height: 24, decoration: BoxDecoration(color: const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(6))),
            Positioned(
              left: (leftFrac * totalWidth).clamp(0.0, totalWidth),
              width: (widthFrac * totalWidth).clamp(4.0, totalWidth - (leftFrac * totalWidth).clamp(0.0, totalWidth)),
              child: Container(
                height: 24,
                decoration: BoxDecoration(color: color.withOpacity(0.85), borderRadius: BorderRadius.circular(6)),
                alignment: Alignment.centerLeft,
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: Text('${p.progress}%', style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w700)),
              ),
            ),
          ]);
        }),
        const SizedBox(height: 2),
        Text('${p.startDate.toIso8601String().split('T')[0]} → ${p.endDate.toIso8601String().split('T')[0]}',
            style: const TextStyle(fontSize: 10, color: Color(0xFF9CA3AF))),
      ]),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'active': return const Color(0xFF16A34A);
      case 'planning': return const Color(0xFF2563EB);
      case 'on-hold': return const Color(0xFFD97706);
      default: return const Color(0xFF6B7280);
    }
  }

  Widget _legend(String label, Color color) => Row(mainAxisSize: MainAxisSize.min, children: [
    Container(width: 10, height: 10, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
    const SizedBox(width: 4),
    Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280))),
  ]);

  String _monthLabel(DateTime d) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.month - 1];
  }
}
