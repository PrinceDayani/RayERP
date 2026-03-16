import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/analytics_service.dart';

class EmployeeReportsScreen extends StatefulWidget {
  const EmployeeReportsScreen({super.key});
  @override
  State<EmployeeReportsScreen> createState() => _State();
}

class _State extends State<EmployeeReportsScreen> with SingleTickerProviderStateMixin {
  final _svc = AnalyticsService();
  late TabController _tabs;
  Map<String, dynamic> _reports = {};
  Map<String, dynamic> _overview = {};
  Map<String, dynamic> _teamProd = {};
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final r = await Future.wait([
        _svc.getEmployeeReports(),
        _svc.getOverviewStats(),
        _svc.getTeamProductivity(),
      ]);
      if (!mounted) return;
      setState(() {
        _reports = r[0];
        _overview = r[1];
        _teamProd = r[2];
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Employee Reports'),
        actions: [IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: _load)],
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          indicatorSize: TabBarIndicatorSize.label,
          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          tabs: const [Tab(text: 'Overview'), Tab(text: 'Employees'), Tab(text: 'Productivity')],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? _ErrView(error: _error!, onRetry: _load)
              : TabBarView(controller: _tabs, children: [
                  _OverviewTab(overview: _overview, reports: _reports),
                  _EmployeesTab(reports: _reports),
                  _ProductivityTab(teamProd: _teamProd),
                ]),
    );
  }
}

class _OverviewTab extends StatelessWidget {
  final Map<String, dynamic> overview, reports;
  const _OverviewTab({required this.overview, required this.reports});

  @override
  Widget build(BuildContext context) {
    final total = (overview['totalEmployees'] ?? reports['totalEmployees'] ?? 0) as num;
    final active = (overview['activeEmployees'] ?? reports['activeEmployees'] ?? 0) as num;
    final onLeave = (overview['onLeave'] ?? reports['onLeave'] ?? 0) as num;
    final newHires = (overview['newHires'] ?? reports['newHires'] ?? 0) as num;
    final avgAttendance = (overview['avgAttendance'] ?? reports['avgAttendance'] ?? 0) as num;
    final byDept = overview['byDepartment'] as List? ?? reports['byDepartment'] as List? ?? [];
    final byStatus = overview['byStatus'] as List? ?? reports['byStatus'] as List? ?? [];
    final p = _hPad(context);

    return SingleChildScrollView(
      padding: EdgeInsets.all(p),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        LayoutBuilder(builder: (_, c) {
          final cols = c.maxWidth < 360 ? 2 : c.maxWidth < 600 ? 3 : c.maxWidth < 900 ? 4 : 5;
          final gap = (cols - 1) * 8.0;
          final w = (c.maxWidth - gap) / cols;
          return Wrap(spacing: 8, runSpacing: 8, children: [
            _Tile('Total', total.toString(), AppTheme.primary, Icons.people_outline, w),
            _Tile('Active', active.toString(), AppTheme.green, Icons.person_outline, w),
            _Tile('On Leave', onLeave.toString(), AppTheme.amber, Icons.beach_access_outlined, w),
            _Tile('New Hires', newHires.toString(), AppTheme.blue, Icons.person_add_outlined, w),
            if (avgAttendance > 0)
              _Tile('Avg Attendance', '${avgAttendance.toStringAsFixed(0)}%', AppTheme.cyan, Icons.access_time_outlined, w),
          ]);
        }),
        if (byDept.isNotEmpty) ...[
          const SizedBox(height: 20),
          const _SecHead('By Department'),
          const SizedBox(height: 10),
          _Card(child: Column(children: byDept.map<Widget>((d) {
            final name = d['department']?.toString() ?? d['name']?.toString() ?? '';
            final count = (d['count'] ?? d['employees'] ?? 0) as num;
            final pct = total > 0 ? (count / total).clamp(0.0, 1.0) : 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(children: [
                SizedBox(width: 90, child: Text(name,
                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                    maxLines: 1, overflow: TextOverflow.ellipsis)),
                Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(value: pct, minHeight: 10,
                        backgroundColor: AppTheme.border,
                        valueColor: const AlwaysStoppedAnimation(AppTheme.primary)))),
                const SizedBox(width: 8),
                Text('${count.toInt()}', style: const TextStyle(fontSize: 12,
                    fontWeight: FontWeight.w700, color: AppTheme.primary)),
              ]),
            );
          }).toList())),
        ],
        if (byStatus.isNotEmpty) ...[
          const SizedBox(height: 20),
          const _SecHead('By Status'),
          const SizedBox(height: 10),
          _Card(child: Column(children: byStatus.map<Widget>((s) {
            final name = s['status']?.toString() ?? s['name']?.toString() ?? '';
            final count = (s['count'] ?? 0) as num;
            final pct = total > 0 ? (count / total).clamp(0.0, 1.0) : 0.0;
            final color = AppTheme.statusColor(name.toLowerCase());
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(children: [
                SizedBox(width: 80, child: Text(name,
                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
                Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(value: pct, minHeight: 10,
                        backgroundColor: AppTheme.border, valueColor: AlwaysStoppedAnimation(color)))),
                const SizedBox(width: 8),
                Text('${count.toInt()}', style: TextStyle(fontSize: 12,
                    fontWeight: FontWeight.w700, color: color)),
              ]),
            );
          }).toList())),
        ],
        if (byDept.isEmpty && byStatus.isEmpty)
          const _Empty('No employee breakdown data available'),
        const SizedBox(height: 16),
      ]),
    );
  }
}

class _EmployeesTab extends StatelessWidget {
  final Map<String, dynamic> reports;
  const _EmployeesTab({required this.reports});

  @override
  Widget build(BuildContext context) {
    final employees = reports['employees'] as List? ?? reports['data'] as List? ?? [];
    final p = _hPad(context);
    if (employees.isEmpty) return const _Empty('No employee data available');
    return ListView.separated(
      padding: EdgeInsets.all(p),
      itemCount: employees.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final e = employees[i] as Map;
        final name = e['name']?.toString() ?? e['employeeName']?.toString() ?? '';
        final dept = e['department']?.toString() ?? '';
        final role = e['role']?.toString() ?? e['position']?.toString() ?? '';
        final status = e['status']?.toString() ?? 'active';
        final tasks = (e['completedTasks'] ?? e['tasks'] ?? 0) as num;
        final attendance = (e['attendanceRate'] ?? e['attendance'] ?? 0) as num;
        final initials = name.isNotEmpty ? name.split(' ').take(2).map((w) => w[0]).join().toUpperCase() : '?';
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border)),
          child: Row(children: [
            CircleAvatar(radius: 20, backgroundColor: AppTheme.primary.withOpacity(0.1),
                child: Text(initials, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                    color: AppTheme.primary))),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              if (dept.isNotEmpty || role.isNotEmpty)
                Text('${dept.isNotEmpty ? dept : ''}${dept.isNotEmpty && role.isNotEmpty ? ' · ' : ''}${role.isNotEmpty ? role : ''}',
                    style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
            ])),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              _StatusBadge(status),
              const SizedBox(height: 4),
              if (tasks > 0)
                Text('${tasks.toInt()} tasks', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
              if (attendance > 0)
                Text('${attendance.toStringAsFixed(0)}% att.', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
            ]),
          ]),
        );
      },
    );
  }
}

class _ProductivityTab extends StatelessWidget {
  final Map<String, dynamic> teamProd;
  const _ProductivityTab({required this.teamProd});

  @override
  Widget build(BuildContext context) {
    final teams = teamProd['teams'] as List? ?? teamProd['data'] as List? ?? [];
    final topPerformers = teamProd['topPerformers'] as List? ?? [];
    final p = _hPad(context);

    if (teams.isEmpty && topPerformers.isEmpty) return const _Empty('No productivity data available');

    return SingleChildScrollView(
      padding: EdgeInsets.all(p),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (topPerformers.isNotEmpty) ...[
          const _SecHead('Top Performers'),
          const SizedBox(height: 10),
          _Card(child: Column(children: topPerformers.take(10).map<Widget>((e) {
            final name = e['name']?.toString() ?? e['employeeName']?.toString() ?? '';
            final score = (e['score'] ?? e['performance'] ?? e['completedTasks'] ?? 0) as num;
            final maxScore = (topPerformers.first['score'] ?? topPerformers.first['performance'] ??
                topPerformers.first['completedTasks'] ?? 1) as num;
            final pct = maxScore > 0 ? (score / maxScore).clamp(0.0, 1.0) : 0.0;
            final initials = name.isNotEmpty ? name[0].toUpperCase() : '?';
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(children: [
                CircleAvatar(radius: 14, backgroundColor: AppTheme.primary.withOpacity(0.1),
                    child: Text(initials, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
                        color: AppTheme.primary))),
                const SizedBox(width: 10),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                  ClipRRect(borderRadius: BorderRadius.circular(3),
                      child: LinearProgressIndicator(value: pct, minHeight: 5,
                          backgroundColor: AppTheme.border,
                          valueColor: const AlwaysStoppedAnimation(AppTheme.green))),
                ])),
                const SizedBox(width: 8),
                Text('${score.toInt()}', style: const TextStyle(fontSize: 13,
                    fontWeight: FontWeight.w700, color: AppTheme.green)),
              ]),
            );
          }).toList())),
          const SizedBox(height: 20),
        ],
        if (teams.isNotEmpty) ...[
          const _SecHead('Team Productivity'),
          const SizedBox(height: 10),
          _Card(child: Column(children: teams.map<Widget>((t) {
            final name = t['name']?.toString() ?? t['team']?.toString() ?? t['department']?.toString() ?? '';
            final completed = (t['completed'] ?? t['completedTasks'] ?? 0) as num;
            final pending = (t['pending'] ?? t['pendingTasks'] ?? 0) as num;
            final total = completed + pending;
            final pct = total > 0 ? (completed / total).clamp(0.0, 1.0) : 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Expanded(child: Text(name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                      maxLines: 1, overflow: TextOverflow.ellipsis)),
                  Text('${completed.toInt()}/${total.toInt()} tasks',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                ]),
                const SizedBox(height: 4),
                ClipRRect(borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(value: pct, minHeight: 8,
                        backgroundColor: AppTheme.border,
                        valueColor: AlwaysStoppedAnimation(
                            pct >= 0.8 ? AppTheme.green : pct >= 0.5 ? AppTheme.amber : AppTheme.red))),
                const SizedBox(height: 2),
                Text('${(pct * 100).toStringAsFixed(0)}% completion rate',
                    style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
              ]),
            );
          }).toList())),
        ],
        const SizedBox(height: 16),
      ]),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge(this.status);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
    decoration: BoxDecoration(color: AppTheme.statusBg(status), borderRadius: BorderRadius.circular(4)),
    child: Text(status.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700,
        color: AppTheme.statusColor(status))),
  );
}

class _Tile extends StatelessWidget {
  final String label, value;
  final Color color;
  final IconData icon;
  final double width;
  const _Tile(this.label, this.value, this.color, this.icon, this.width);
  @override
  Widget build(BuildContext context) => SizedBox(width: width, child: Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: color.withOpacity(0.06), borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.18))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(icon, size: 16, color: color),
      const SizedBox(height: 8),
      FittedBox(child: Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color))),
      Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
          maxLines: 1, overflow: TextOverflow.ellipsis),
    ]),
  ));
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity, padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border)),
    child: child,
  );
}

class _SecHead extends StatelessWidget {
  final String title;
  const _SecHead(this.title);
  @override
  Widget build(BuildContext context) => Text(title,
      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary));
}

class _Empty extends StatelessWidget {
  final String message;
  const _Empty(this.message);
  @override
  Widget build(BuildContext context) => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
    const Icon(Icons.people_outline, size: 40, color: AppTheme.textMuted),
    const SizedBox(height: 10),
    Text(message, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
  ]));
}

class _ErrView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _ErrView({required this.error, required this.onRetry});
  @override
  Widget build(BuildContext context) => Center(child: Padding(
    padding: const EdgeInsets.all(24),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.error_outline, color: AppTheme.red, size: 44),
      const SizedBox(height: 12),
      Text(error, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
          textAlign: TextAlign.center),
      const SizedBox(height: 16),
      ElevatedButton.icon(onPressed: onRetry,
          icon: const Icon(Icons.refresh, size: 16), label: const Text('Retry')),
    ]),
  ));
}

double _hPad(BuildContext context) {
  final w = MediaQuery.of(context).size.width;
  return w < 400 ? 12 : w < 768 ? 16 : 24;
}
