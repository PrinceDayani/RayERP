import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../services/project_service.dart';

class GlobalAnalyticsScreen extends StatefulWidget {
  const GlobalAnalyticsScreen({super.key});
  @override
  State<GlobalAnalyticsScreen> createState() => _GlobalAnalyticsScreenState();
}

class _GlobalAnalyticsScreenState extends State<GlobalAnalyticsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<Project> _projects = [];
  ProjectStats? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ProjectService().getAll(),
        ProjectService().getStats().catchError((_) => ProjectStats(
            totalProjects: 0, activeProjects: 0, completedProjects: 0, atRiskProjects: 0, overdueTasks: 0)),
      ]);
      _projects = results[0] as List<Project>;
      _stats = results[1] as ProjectStats;
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Global Analytics'),
        actions: [IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: _load)],
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppTheme.primary, unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary, indicatorSize: TabBarIndicatorSize.label,
          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          tabs: const [Tab(text: 'Overview'), Tab(text: 'Performance'), Tab(text: 'Budget')],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : TabBarView(controller: _tabs, children: [
              _OverviewTab(projects: _projects, stats: _stats),
              _PerformanceTab(projects: _projects),
              _BudgetTab(projects: _projects),
            ]),
    );
  }
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

class _OverviewTab extends StatelessWidget {
  final List<Project> projects;
  final ProjectStats? stats;
  const _OverviewTab({required this.projects, required this.stats});

  @override
  Widget build(BuildContext context) {
    if (projects.isEmpty) return _empty('No projects found');
    final s = stats;
    final statusGroups = <String, int>{};
    final priorityGroups = <String, int>{};
    for (final p in projects) {
      statusGroups[p.status] = (statusGroups[p.status] ?? 0) + 1;
      priorityGroups[p.priority] = (priorityGroups[p.priority] ?? 0) + 1;
    }
    final avgProgress = projects.isEmpty ? 0.0 : projects.fold(0.0, (s, p) => s + p.progress) / projects.length;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Stats tiles
        if (s != null) ...[
          LayoutBuilder(builder: (_, c) {
            final cols = c.maxWidth < 360 ? 2 : 4;
            final gap = (cols - 1) * 10.0;
            final w = (c.maxWidth - gap) / cols;
            final tiles = [
              _Tile('Total', '${s.totalProjects}', AppTheme.primary, w),
              _Tile('Active', '${s.activeProjects}', AppTheme.green, w),
              _Tile('At Risk', '${s.atRiskProjects}', AppTheme.amber, w),
              _Tile('Overdue', '${s.overdueTasks}', AppTheme.red, w),
            ];
            if (cols == 2) {
              return Column(children: [
                Row(children: [tiles[0], const SizedBox(width: 10), tiles[1]]),
                const SizedBox(height: 10),
                Row(children: [tiles[2], const SizedBox(width: 10), tiles[3]]),
              ]);
            }
            return Row(children: [
              tiles[0], const SizedBox(width: 10), tiles[1],
              const SizedBox(width: 10), tiles[2], const SizedBox(width: 10), tiles[3],
            ]);
          }),
          const SizedBox(height: 12),
        ],
        // Avg progress
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Average Progress', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            Text('${avgProgress.toStringAsFixed(0)}%',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.primary)),
          ]),
          const SizedBox(height: 8),
          ClipRRect(borderRadius: BorderRadius.circular(5),
              child: LinearProgressIndicator(value: avgProgress / 100, minHeight: 10,
                  backgroundColor: AppTheme.border,
                  valueColor: const AlwaysStoppedAnimation(AppTheme.primary))),
        ])),
        const SizedBox(height: 12),
        // Status distribution
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Status Distribution', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 10),
          ...statusGroups.entries.map((e) {
            final pct = projects.isEmpty ? 0.0 : e.value / projects.length;
            final color = _statusColor(e.key);
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(children: [
                SizedBox(width: 80, child: Text(e.key, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
                Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(value: pct, minHeight: 8,
                        backgroundColor: AppTheme.border, valueColor: AlwaysStoppedAnimation(color)))),
                const SizedBox(width: 8),
                Text('${e.value}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
              ]),
            );
          }),
        ])),
        const SizedBox(height: 12),
        // Priority distribution
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Priority Distribution', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 10),
          ...priorityGroups.entries.map((e) {
            final pct = projects.isEmpty ? 0.0 : e.value / projects.length;
            final color = _priorityColor(e.key);
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(children: [
                SizedBox(width: 80, child: Text(e.key, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
                Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(value: pct, minHeight: 8,
                        backgroundColor: AppTheme.border, valueColor: AlwaysStoppedAnimation(color)))),
                const SizedBox(width: 8),
                Text('${e.value}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
              ]),
            );
          }),
        ])),
      ]),
    );
  }
}

// ── Performance Tab ───────────────────────────────────────────────────────────

class _PerformanceTab extends StatelessWidget {
  final List<Project> projects;
  const _PerformanceTab({required this.projects});

  @override
  Widget build(BuildContext context) {
    if (projects.isEmpty) return _empty('No projects found');
    final now = DateTime.now();
    final sorted = [...projects]..sort((a, b) => b.progress.compareTo(a.progress));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Performance Matrix', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          const Text('Progress vs Time Elapsed', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
          const SizedBox(height: 12),
          ...sorted.map((p) {
            final totalDays = p.endDate.difference(p.startDate).inDays.clamp(1, 99999);
            final elapsed = now.difference(p.startDate).inDays.clamp(0, totalDays);
            final tp = elapsed / totalDays;
            final eff = tp > 0 ? (p.progress / 100) / tp : 0.0;
            final effColor = eff >= 1.0 ? AppTheme.green : eff >= 0.8 ? AppTheme.amber : AppTheme.red;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(child: Text(p.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                      maxLines: 1, overflow: TextOverflow.ellipsis)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: effColor.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                    child: Text('${(eff * 100).toStringAsFixed(0)}% eff',
                        style: TextStyle(fontSize: 10, color: effColor, fontWeight: FontWeight.w600)),
                  ),
                ]),
                const SizedBox(height: 4),
                Row(children: [
                  Expanded(child: Column(children: [
                    ClipRRect(borderRadius: BorderRadius.circular(3),
                        child: LinearProgressIndicator(value: p.progress / 100, minHeight: 5,
                            backgroundColor: AppTheme.border,
                            valueColor: const AlwaysStoppedAnimation(AppTheme.primary))),
                    const SizedBox(height: 2),
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Text('Progress: ${p.progress}%', style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary)),
                      Text('Time: ${(tp * 100).toStringAsFixed(0)}%', style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary)),
                    ]),
                  ])),
                ]),
              ]),
            );
          }),
        ])),
      ],
    );
  }
}

// ── Budget Tab ────────────────────────────────────────────────────────────────

class _BudgetTab extends StatelessWidget {
  final List<Project> projects;
  const _BudgetTab({required this.projects});

  @override
  Widget build(BuildContext context) {
    if (projects.isEmpty) return _empty('No projects found');
    final totalBudget = projects.fold(0.0, (s, p) => s + p.budget);
    final totalSpent = projects.fold(0.0, (s, p) => s + p.spentBudget);
    final overallUsed = totalBudget > 0 ? (totalSpent / totalBudget).clamp(0.0, 1.0) : 0.0;
    final sorted = [...projects]..sort((a, b) {
      final ua = a.budget > 0 ? a.spentBudget / a.budget : 0.0;
      final ub = b.budget > 0 ? b.spentBudget / b.budget : 0.0;
      return ub.compareTo(ua);
    });

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        LayoutBuilder(builder: (_, c) {
          final w = (c.maxWidth - 10) / 2;
          return Row(children: [
            _Tile('Total Budget', totalBudget.toStringAsFixed(0), AppTheme.blue, w),
            const SizedBox(width: 10),
            _Tile('Total Spent', totalSpent.toStringAsFixed(0), AppTheme.red, w),
          ]);
        }),
        const SizedBox(height: 12),
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Overall Utilization', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            Text('${(overallUsed * 100).toStringAsFixed(1)}%',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
                    color: overallUsed > 0.9 ? AppTheme.red : AppTheme.primary)),
          ]),
          const SizedBox(height: 8),
          ClipRRect(borderRadius: BorderRadius.circular(5),
              child: LinearProgressIndicator(value: overallUsed, minHeight: 10,
                  backgroundColor: AppTheme.border,
                  valueColor: AlwaysStoppedAnimation(overallUsed > 0.9 ? AppTheme.red : AppTheme.primary))),
        ])),
        const SizedBox(height: 12),
        const Text('Budget Breakdown', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        ...sorted.map((p) {
          final used = p.budget > 0 ? (p.spentBudget / p.budget).clamp(0.0, 1.0) : 0.0;
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
            padding: const EdgeInsets.all(12),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(p.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    maxLines: 1, overflow: TextOverflow.ellipsis)),
                Text('${(used * 100).toStringAsFixed(0)}%',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                        color: used > 0.9 ? AppTheme.red : AppTheme.primary)),
              ]),
              const SizedBox(height: 6),
              ClipRRect(borderRadius: BorderRadius.circular(3),
                  child: LinearProgressIndicator(value: used, minHeight: 5,
                      backgroundColor: AppTheme.border,
                      valueColor: AlwaysStoppedAnimation(used > 0.9 ? AppTheme.red : AppTheme.primary))),
              const SizedBox(height: 4),
              Text('${p.currency} ${p.spentBudget.toStringAsFixed(0)} / ${p.budget.toStringAsFixed(0)}',
                  style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
            ]),
          );
        }),
      ],
    );
  }
}

// ── Shared ────────────────────────────────────────────────────────────────────

class _Tile extends StatelessWidget {
  final String label, value; final Color color; final double w;
  const _Tile(this.label, this.value, this.color, this.w);
  @override
  Widget build(BuildContext context) => Container(
    width: w, padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
      const SizedBox(height: 4),
      FittedBox(child: Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color))),
    ]),
  );
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});
  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
    padding: const EdgeInsets.all(12),
    child: child,
  );
}

Color _statusColor(String s) => switch (s) {
  'active' => AppTheme.green, 'planning' => AppTheme.blue,
  'on-hold' => AppTheme.amber, 'completed' => AppTheme.cyan, _ => AppTheme.red,
};

Color _priorityColor(String p) => switch (p) {
  'critical' => AppTheme.red, 'high' => AppTheme.amber,
  'medium' => AppTheme.blue, _ => AppTheme.green,
};

Widget _empty(String msg) => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
  const Icon(Icons.analytics_outlined, size: 48, color: AppTheme.textMuted),
  const SizedBox(height: 12),
  Text(msg, style: const TextStyle(color: AppTheme.textSecondary)),
]));
