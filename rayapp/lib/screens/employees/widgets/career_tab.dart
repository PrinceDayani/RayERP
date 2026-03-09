import 'package:flutter/material.dart';
import '../../../config/app_theme.dart';
import '../../../models/employee.dart';
import '../../../models/employee_stats.dart';
import '../../../services/employee_stats_service.dart';

class CareerTab extends StatefulWidget {
  final Employee employee;
  const CareerTab({super.key, required this.employee});
  @override
  State<CareerTab> createState() => _CareerTabState();
}

class _CareerTabState extends State<CareerTab> {
  final _svc = EmployeeStatsService();
  List<CareerEvent>? _events;
  String? _error;

  @override
  void initState() {
    super.initState();
    _svc.getCareerEvents(widget.employee.id).then((v) {
      if (mounted) setState(() => _events = v);
    }).catchError((e) {
      if (mounted) setState(() => _error = e.toString());
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) return Center(child: Text(_error!, style: const TextStyle(color: AppTheme.red)));
    if (_events == null) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));

    final emp = widget.employee;
    // Build display list: career events + synthetic hire entry if empty
    final events = _events!.isNotEmpty
        ? _events!
        : [
            CareerEvent(
              type: 'hire',
              title: 'Joined as ${emp.position}',
              description: (emp.department ?? '').isNotEmpty ? 'Started in ${emp.department}' : 'Joined the company',
              date: emp.hireDate ?? DateTime.now(),
            )
          ];

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      itemCount: events.length + 1, // +1 for current position at bottom
      itemBuilder: (_, i) {
        if (i == events.length) return _currentNode(emp);
        return _eventNode(events[i], i, events.length);
      },
    );
  }

  Widget _eventNode(CareerEvent e, int i, int total) {
    final cfg = _config(e.type);
    return IntrinsicHeight(
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Timeline column
        SizedBox(
          width: 44,
          child: Column(children: [
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(color: cfg.$1, shape: BoxShape.circle),
              child: Icon(cfg.$2, size: 16, color: Colors.white),
            ),
            Expanded(child: Container(width: 2, color: AppTheme.border)),
          ]),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.border),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  _chip(cfg.$3, cfg.$1),
                  const Spacer(),
                  Text(_fmtDate(e.date), style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                ]),
                const SizedBox(height: 6),
                Text(e.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                if (e.description.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(e.description, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                ],
                if (e.from != null && e.to != null) ...[
                  const SizedBox(height: 6),
                  Row(children: [
                    Text(e.from!, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 6),
                      child: Icon(Icons.arrow_forward, size: 10, color: AppTheme.textMuted),
                    ),
                    Text(e.to!, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                  ]),
                ],
              ]),
            ),
          ),
        ),
      ]),
    );
  }

  Widget _currentNode(Employee emp) {
    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SizedBox(
        width: 44,
        child: Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFF16A34A), Color(0xFF059669)]),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.work_outline, size: 16, color: Colors.white),
        ),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFF0FDF4),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFF86EFAC)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _chip('Current', const Color(0xFF16A34A)),
            const SizedBox(height: 6),
            Text(emp.position, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
            if ((emp.department ?? '').isNotEmpty)
              Text(emp.department!, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
          ]),
        ),
      ),
    ]);
  }

  Widget _chip(String label, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
        decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
        child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
      );

  String _fmtDate(DateTime d) => AppTheme.fmtDate(d);

  (Color, IconData, String) _config(String type) => switch (type) {
        'hire' => (const Color(0xFF2563EB), Icons.login_outlined, 'Joined'),
        'promotion' => (const Color(0xFF16A34A), Icons.trending_up_outlined, 'Promotion'),
        'role_change' => (const Color(0xFF7C3AED), Icons.swap_horiz_outlined, 'Role Change'),
        'department_change' => (const Color(0xFFD97706), Icons.location_on_outlined, 'Transfer'),
        'project_start' => (const Color(0xFF0891B2), Icons.rocket_launch_outlined, 'Project'),
        'certification' => (const Color(0xFF0D9488), Icons.school_outlined, 'Certification'),
        'achievement' => (const Color(0xFFB45309), Icons.emoji_events_outlined, 'Achievement'),
        _ => (AppTheme.primary, Icons.star_outline, 'Milestone'),
      };
}
