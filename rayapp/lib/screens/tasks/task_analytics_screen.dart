import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/task.dart';
import '../../services/task_service.dart';

class TaskAnalyticsScreen extends StatefulWidget {
  final String? projectId;
  const TaskAnalyticsScreen({super.key, this.projectId});

  @override
  State<TaskAnalyticsScreen> createState() => _TaskAnalyticsScreenState();
}

class _TaskAnalyticsScreenState extends State<TaskAnalyticsScreen>
    with SingleTickerProviderStateMixin {
  final _svc = TaskService();
  late TabController _tabs;
  TaskAnalytics? _analytics;
  List<Map<String, dynamic>> _burndown = [];
  List<Map<String, dynamic>> _velocity = [];
  List<Map<String, dynamic>> _team = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 4, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _svc.getAnalytics(projectId: widget.projectId),
        _svc.getBurndown(projectId: widget.projectId),
        _svc.getVelocity(projectId: widget.projectId),
        _svc.getTeamPerformance(projectId: widget.projectId),
      ]);
      _analytics = results[0] as TaskAnalytics;
      _burndown = results[1] as List<Map<String, dynamic>>;
      _velocity = results[2] as List<Map<String, dynamic>>;
      _team = results[3] as List<Map<String, dynamic>>;
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Task Analytics'),
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Burndown'),
            Tab(text: 'Velocity'),
            Tab(text: 'Team'),
          ],
        ),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary))
          : TabBarView(
              controller: _tabs,
              children: [
                _OverviewTab(analytics: _analytics),
                _BurndownTab(data: _burndown),
                _VelocityTab(data: _velocity),
                _TeamTab(data: _team),
              ],
            ),
    );
  }
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

class _OverviewTab extends StatelessWidget {
  final TaskAnalytics? analytics;
  const _OverviewTab({this.analytics});

  @override
  Widget build(BuildContext context) {
    final a = analytics;
    if (a == null) {
      return const Center(
          child: Text('No analytics data',
              style: TextStyle(color: AppTheme.textSecondary)));
    }
    final completionPct = a.total > 0 ? a.completed / a.total : 0.0;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        LayoutBuilder(builder: (_, c) {
          final w = (c.maxWidth - 10) / 2;
          return Wrap(spacing: 10, runSpacing: 10, children: [
            _StatCard('Total', '${a.total}', AppTheme.primary, w),
            _StatCard('Completed', '${a.completed}', AppTheme.green, w),
            _StatCard('In Progress', '${a.inProgress}', AppTheme.blue, w),
            _StatCard('Overdue', '${a.overdue}', AppTheme.red, w),
            _StatCard('Blocked', '${a.blocked}', AppTheme.amber, w),
            _StatCard('Todo', '${a.todo}', AppTheme.textSecondary, w),
          ]);
        }),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Completion Rate',
                  style: TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w600)),
              Text(
                '${(completionPct * 100).toStringAsFixed(1)}%',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: completionPct >= 0.8
                      ? AppTheme.green
                      : completionPct >= 0.5
                          ? AppTheme.amber
                          : AppTheme.red,
                ),
              ),
            ]),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: completionPct,
                minHeight: 8,
                backgroundColor: AppTheme.border,
                valueColor: AlwaysStoppedAnimation<Color>(
                  completionPct >= 0.8
                      ? AppTheme.green
                      : completionPct >= 0.5
                          ? AppTheme.amber
                          : AppTheme.red,
                ),
              ),
            ),
            const SizedBox(height: 12),
            _PRow('Completed', a.completed, a.total, AppTheme.green),
            const SizedBox(height: 6),
            _PRow('In Progress', a.inProgress, a.total, AppTheme.blue),
            const SizedBox(height: 6),
            _PRow('Todo', a.todo, a.total, AppTheme.textSecondary),
            const SizedBox(height: 6),
            _PRow('Blocked', a.blocked, a.total, AppTheme.amber),
          ]),
        ),
      ]),
    );
  }
}

// ── Burndown Tab ──────────────────────────────────────────────────────────────

class _BurndownTab extends StatelessWidget {
  final List<Map<String, dynamic>> data;
  const _BurndownTab({required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) {
      return const Center(
          child: Text('No burndown data',
              style: TextStyle(color: AppTheme.textSecondary)));
    }
    final maxVal = data
        .map((e) => (e['remaining'] ?? e['total'] ?? 0) as num)
        .fold<num>(0, (a, b) => a > b ? a : b)
        .toDouble();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Burndown Chart',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            children: data.map((d) {
              final label = d['date']?.toString() ??
                  d['week']?.toString() ??
                  d['sprint']?.toString() ??
                  '';
              final remaining =
                  (d['remaining'] ?? d['total'] ?? 0).toDouble();
              final completed =
                  (d['completed'] ?? d['done'] ?? 0).toDouble();
              final pct = maxVal > 0 ? remaining / maxVal : 0.0;
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(children: [
                  SizedBox(
                      width: 80,
                      child: Text(label,
                          style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.textSecondary),
                          overflow: TextOverflow.ellipsis)),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: pct.clamp(0.0, 1.0),
                        minHeight: 14,
                        backgroundColor: AppTheme.green.withOpacity(0.15),
                        valueColor: const AlwaysStoppedAnimation<Color>(
                            AppTheme.blue),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text('${remaining.toInt()} left',
                      style: const TextStyle(
                          fontSize: 11, color: AppTheme.textSecondary)),
                ]),
              );
            }).toList(),
          ),
        ),
      ]),
    );
  }
}

// ── Velocity Tab ──────────────────────────────────────────────────────────────

class _VelocityTab extends StatelessWidget {
  final List<Map<String, dynamic>> data;
  const _VelocityTab({required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) {
      return const Center(
          child: Text('No velocity data',
              style: TextStyle(color: AppTheme.textSecondary)));
    }
    final maxVal = data
        .map((e) => (e['completed'] ?? e['velocity'] ?? 0) as num)
        .fold<num>(0, (a, b) => a > b ? a : b)
        .toDouble();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Velocity',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            children: data.map((d) {
              final label = d['week']?.toString() ??
                  d['sprint']?.toString() ??
                  d['period']?.toString() ??
                  '';
              final val =
                  (d['completed'] ?? d['velocity'] ?? 0).toDouble();
              final pct = maxVal > 0 ? val / maxVal : 0.0;
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(children: [
                  SizedBox(
                      width: 80,
                      child: Text(label,
                          style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.textSecondary),
                          overflow: TextOverflow.ellipsis)),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: pct.clamp(0.0, 1.0),
                        minHeight: 14,
                        backgroundColor: AppTheme.border,
                        valueColor: const AlwaysStoppedAnimation<Color>(
                            AppTheme.green),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text('${val.toInt()}',
                      style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.green)),
                ]),
              );
            }).toList(),
          ),
        ),
      ]),
    );
  }
}

// ── Team Performance Tab ──────────────────────────────────────────────────────

class _TeamTab extends StatelessWidget {
  final List<Map<String, dynamic>> data;
  const _TeamTab({required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) {
      return const Center(
          child: Text('No team data',
              style: TextStyle(color: AppTheme.textSecondary)));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: data.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final d = data[i];
        final name = d['name']?.toString() ??
            d['employee']?.toString() ??
            'Unknown';
        final completed = (d['completed'] ?? d['completedTasks'] ?? 0).toInt();
        final total = (d['total'] ?? d['totalTasks'] ?? 0).toInt();
        final pct = total > 0 ? completed / total : 0.0;
        final initials = name.isNotEmpty ? name[0].toUpperCase() : '?';
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppTheme.border),
          ),
          child: Row(children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: AppTheme.primary.withOpacity(0.1),
              child: Text(initials,
                  style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.primary)),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                        style: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: LinearProgressIndicator(
                        value: pct.clamp(0.0, 1.0),
                        minHeight: 5,
                        backgroundColor: AppTheme.border,
                        valueColor: const AlwaysStoppedAnimation<Color>(
                            AppTheme.primary),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text('$completed / $total tasks',
                        style: const TextStyle(
                            fontSize: 10,
                            color: AppTheme.textSecondary)),
                  ]),
            ),
            Text(
              '${(pct * 100).toStringAsFixed(0)}%',
              style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primary),
            ),
          ]),
        );
      },
    );
  }
}

// ── Shared ────────────────────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  final String label, value;
  final Color color;
  final double width;
  const _StatCard(this.label, this.value, this.color, this.width);

  @override
  Widget build(BuildContext context) => Container(
        width: width,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.06),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(children: [
          Text(value,
              style: TextStyle(
                  fontSize: 22, fontWeight: FontWeight.bold, color: color)),
          Text(label,
              style: const TextStyle(
                  fontSize: 11, color: AppTheme.textSecondary)),
        ]),
      );
}

class _PRow extends StatelessWidget {
  final String label;
  final num value, total;
  final Color color;
  const _PRow(this.label, this.value, this.total, this.color);

  @override
  Widget build(BuildContext context) {
    final pct = total > 0 ? (value / total).clamp(0.0, 1.0) : 0.0;
    return Row(children: [
      SizedBox(
          width: 90,
          child: Text(label,
              style: const TextStyle(
                  fontSize: 12, color: AppTheme.textSecondary))),
      Expanded(
        child: ClipRRect(
          borderRadius: BorderRadius.circular(3),
          child: LinearProgressIndicator(
            value: pct.toDouble(),
            minHeight: 6,
            backgroundColor: AppTheme.border,
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ),
      const SizedBox(width: 8),
      Text('$value',
          style: TextStyle(
              fontSize: 12, fontWeight: FontWeight.w600, color: color)),
    ]);
  }
}
