import 'package:flutter/material.dart';
import '../../../config/app_theme.dart';
import '../../../models/employee_stats.dart';
import '../../../services/employee_stats_service.dart';

class PerformanceTab extends StatefulWidget {
  final String employeeId;
  const PerformanceTab({super.key, required this.employeeId});
  @override
  State<PerformanceTab> createState() => _PerformanceTabState();
}

class _PerformanceTabState extends State<PerformanceTab> {
  final _svc = EmployeeStatsService();
  AttendanceStats? _att;
  TaskStats? _tasks;
  List<Achievement>? _achievements;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait<dynamic>([
        _svc.getAttendanceStats(widget.employeeId),
        _svc.getTaskStats(widget.employeeId),
        _svc.getAchievements(widget.employeeId),
      ]);
      if (mounted) setState(() {
        _att = results[0] as AttendanceStats;
        _tasks = results[1] as TaskStats;
        _achievements = results[2] as List<Achievement>;
      });
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) return Center(child: Text(_error!, style: const TextStyle(color: AppTheme.red)));
    if (_att == null) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));

    final s = _att!;
    final t = _tasks!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(children: [
        // Attendance rate ring
        _rateCard(s),
        const SizedBox(height: 12),
        // Attendance stats grid
        LayoutBuilder(builder: (_, c) => GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: ((c.maxWidth - 10) / 2) / 52,
          children: [
            _statCard('Present Days', '${s.presentDays}', Icons.check_circle_outline, AppTheme.green),
            _statCard('Late Days', '${s.lateDays}', Icons.schedule_outlined, AppTheme.amber),
            _statCard('Half Days', '${s.halfDays}', Icons.timelapse_outlined, AppTheme.blue),
            _statCard('Total Hours', '${s.totalHours.toStringAsFixed(0)}h', Icons.timer_outlined, AppTheme.purple),
          ],
        )),
        const SizedBox(height: 12),
        // Task breakdown
        _taskCard(t),
        const SizedBox(height: 12),
        // Achievements preview
        if (_achievements != null && _achievements!.isNotEmpty) _achievementsPreview(_achievements!),
        const SizedBox(height: 12),
        _avgCard(s),
      ]),
    );
  }

  Widget _rateCard(AttendanceStats s) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
        child: Row(children: [
          SizedBox(
            width: 72, height: 72,
            child: Stack(alignment: Alignment.center, children: [
              CircularProgressIndicator(
                value: s.attendanceRate / 100,
                strokeWidth: 7,
                backgroundColor: AppTheme.border,
                color: s.attendanceRate >= 80 ? AppTheme.green : s.attendanceRate >= 60 ? AppTheme.amber : AppTheme.red,
              ),
              Text('${s.attendanceRate}%', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppTheme.textPrimary)),
            ]),
          ),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Attendance Rate', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
            const SizedBox(height: 4),
            Text('${s.presentDays} of ${s.totalDays} days this month', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
            const SizedBox(height: 4),
            Text('Avg ${s.averageHours.toStringAsFixed(1)}h/day', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
          ])),
        ]),
      );

  Widget _taskCard(TaskStats t) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('TASK BREAKDOWN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8)),
          const SizedBox(height: 10),
          Row(children: [
            _taskPill('Completed', t.completed, AppTheme.green),
            const SizedBox(width: 8),
            _taskPill('In Progress', t.inProgress, AppTheme.blue),
            const SizedBox(width: 8),
            _taskPill('Overdue', t.overdue, AppTheme.red),
          ]),
          if (t.total > 0) ...[
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: t.completed / t.total,
                backgroundColor: AppTheme.border,
                color: AppTheme.green,
                minHeight: 6,
              ),
            ),
            const SizedBox(height: 4),
            Text('${t.total > 0 ? ((t.completed / t.total) * 100).round() : 0}% completion rate · ${t.total} total tasks',
                style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
          ],
        ]),
      );

  Widget _taskPill(String label, int count, Color color) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(color: color.withOpacity(0.07), borderRadius: BorderRadius.circular(8)),
          child: Column(children: [
            Text('$count', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
            Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textMuted)),
          ]),
        ),
      );

  Widget _achievementsPreview(List<Achievement> items) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Icon(Icons.emoji_events_outlined, size: 14, color: AppTheme.amber),
            const SizedBox(width: 6),
            const Text('ACHIEVEMENTS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8)),
            const Spacer(),
            Text('${items.length} total', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
          ]),
          const SizedBox(height: 10),
          ...items.take(3).map((a) => Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(children: [
              const Icon(Icons.star_outline, size: 14, color: AppTheme.amber),
              const SizedBox(width: 8),
              Expanded(child: Text(a.title, style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary))),
              Text(AppTheme.fmtDate(a.date), style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
            ]),
          )),
        ]),
      );

  Widget _statCard(String label, String value, IconData icon, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
        child: Row(children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, size: 14, color: color),
          ),
          const SizedBox(width: 8),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: color)),
            Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
          ]),
        ]),
      );

  Widget _avgCard(AttendanceStats s) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
        child: Row(children: [
          const Icon(Icons.insights_outlined, size: 16, color: AppTheme.primary),
          const SizedBox(width: 8),
          Expanded(child: Text('Average ${s.averageHours.toStringAsFixed(1)} hours/day across ${s.totalDays} recorded days',
              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
        ]),
      );
}
