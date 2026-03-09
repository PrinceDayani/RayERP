import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../services/project_budget_service.dart';
import 'project_analytics_screen.dart';
import 'project_timeline_screen.dart';
import 'project_budget_screen.dart';

class ProjectReportsScreen extends StatefulWidget {
  final Project project;
  const ProjectReportsScreen({super.key, required this.project});
  @override
  State<ProjectReportsScreen> createState() => _ProjectReportsScreenState();
}

class _ProjectReportsScreenState extends State<ProjectReportsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  bool _loading = true;
  ProjectBudget? _budget;
  ProjectAnalytics? _analytics;

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
    final results = await Future.wait([
      ProjectBudgetService().getByProject(widget.project.id),
      ProjectAnalyticsService().getByProject(widget.project.id, risks: widget.project.risks),
    ]);
    _budget = results[0] as ProjectBudget?;
    _analytics = results[1] as ProjectAnalytics?;
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Text('Reports · ${widget.project.name}'),
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppTheme.primary, unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary, indicatorSize: TabBarIndicatorSize.label,
          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          tabs: const [Tab(text: 'Budget'), Tab(text: 'Performance'), Tab(text: 'Timeline')],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : TabBarView(controller: _tabs, children: [
              _BudgetReport(project: widget.project, budget: _budget),
              _PerformanceReport(project: widget.project, analytics: _analytics),
              _TimelineReport(project: widget.project),
            ]),
    );
  }
}

// ── Budget Report ─────────────────────────────────────────────────────────────

class _BudgetReport extends StatelessWidget {
  final Project project;
  final ProjectBudget? budget;
  const _BudgetReport({required this.project, required this.budget});

  @override
  Widget build(BuildContext context) {
    final p = project;
    final b = budget;
    final total = b?.totalBudget ?? p.budget;
    final spent = b?.totalSpent ?? p.spentBudget;
    final remaining = total - spent;
    final currency = b?.currency ?? p.currency;
    final used = total > 0 ? (spent / total).clamp(0.0, 1.0) : 0.0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Summary cards
        _Row3(
          _KPI('Total Budget', '$currency ${total.toStringAsFixed(0)}', AppTheme.blue),
          _KPI('Spent', '$currency ${spent.toStringAsFixed(0)}', used > 0.9 ? AppTheme.red : AppTheme.amber),
          _KPI('Remaining', '$currency ${remaining.toStringAsFixed(0)}', remaining < 0 ? AppTheme.red : AppTheme.green),
        ),
        const SizedBox(height: 14),
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Budget Utilization', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            Text('${(used * 100).toStringAsFixed(1)}%',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                    color: used > 0.9 ? AppTheme.red : AppTheme.primary)),
          ]),
          const SizedBox(height: 8),
          ClipRRect(borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(value: used, minHeight: 10, backgroundColor: AppTheme.border,
                valueColor: AlwaysStoppedAnimation(used > 0.9 ? AppTheme.red : AppTheme.primary))),
          const SizedBox(height: 8),
          Text(used > 0.9 ? '⚠ Budget nearly exhausted' : used > 0.7 ? 'Budget on track' : 'Budget healthy',
              style: TextStyle(fontSize: 11, color: used > 0.9 ? AppTheme.red : AppTheme.green)),
        ])),
        if (b != null && b.categories.isNotEmpty) ...[ const SizedBox(height: 14),
          const Text('By Category', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          ...b.categories.map((cat) {
            final cu = cat.allocated > 0 ? (cat.spent / cat.allocated).clamp(0.0, 1.0) : 0.0;
            return _Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(child: Text(cat.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600))),
                  Text('${(cu * 100).toStringAsFixed(0)}%',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                          color: cu > 0.9 ? AppTheme.red : AppTheme.primary)),
                ]),
                const SizedBox(height: 6),
                ClipRRect(borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(value: cu, minHeight: 6, backgroundColor: AppTheme.border,
                      valueColor: AlwaysStoppedAnimation(cu > 0.9 ? AppTheme.red : AppTheme.primary))),
                const SizedBox(height: 4),
                Text('$currency ${cat.spent.toStringAsFixed(0)} / ${cat.allocated.toStringAsFixed(0)}',
                    style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
              ]),
            );
          }),
        ],
        const SizedBox(height: 14),
        SizedBox(width: double.infinity,
          child: OutlinedButton.icon(
            icon: const Icon(Icons.account_balance_wallet_outlined, size: 16),
            label: const Text('Full Budget Details'),
            onPressed: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => ProjectBudgetScreen(project: project))),
          )),
      ]),
    );
  }
}

// ── Performance Report ────────────────────────────────────────────────────────

class _PerformanceReport extends StatelessWidget {
  final Project project;
  final ProjectAnalytics? analytics;
  const _PerformanceReport({required this.project, required this.analytics});

  Color _ic(double v) => v >= 1.0 ? AppTheme.green : v >= 0.8 ? AppTheme.amber : AppTheme.red;
  Color _rc(String r) => switch (r) { 'critical' || 'high' => AppTheme.red, 'medium' => AppTheme.amber, _ => AppTheme.green };

  @override
  Widget build(BuildContext context) {
    final p = project;
    final a = analytics;
    final now = DateTime.now();
    final totalDays = p.endDate.difference(p.startDate).inDays.clamp(1, 99999);
    final elapsed = now.difference(p.startDate).inDays.clamp(0, totalDays);
    final tp = elapsed / totalDays;
    final eff = tp > 0 ? (p.progress / 100) / tp : 0.0;
    final daysLeft = p.endDate.difference(now).inDays;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _Row3(
          _KPI('Progress', '${p.progress}%', AppTheme.primary),
          _KPI('Efficiency', '${(eff * 100).toStringAsFixed(0)}%', _ic(eff)),
          _KPI('Days Left', daysLeft < 0 ? 'Overdue' : '${daysLeft}d', daysLeft < 0 ? AppTheme.red : daysLeft <= 7 ? AppTheme.amber : AppTheme.green),
        ),
        if (a != null) ...[ const SizedBox(height: 10),
          _Row3(
            _KPI('CPI', a.cpi.toStringAsFixed(2), _ic(a.cpi)),
            _KPI('SPI', a.spi.toStringAsFixed(2), _ic(a.spi)),
            _KPI('Risk', a.overallRisk, _rc(a.overallRisk)),
          ),
        ],
        const SizedBox(height: 14),
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Timeline vs Progress', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          _PRow('Time Elapsed', (tp * 100).round(), 100, AppTheme.blue),
          const SizedBox(height: 8),
          _PRow('Work Done', p.progress, 100, AppTheme.primary),
          if (a != null) ...[ const SizedBox(height: 8),
            _PRow('Tasks Done', a.completedTasks, a.totalTasks.clamp(1, 99999), AppTheme.green),
          ],
        ])),
        if (a != null && a.totalTasks > 0) ...[ const SizedBox(height: 14),
          _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Task Status', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            _PRow('Completed', a.completedTasks, a.totalTasks, AppTheme.green),
            const SizedBox(height: 8),
            _PRow('In Progress', a.inProgressTasks, a.totalTasks, AppTheme.blue),
            const SizedBox(height: 8),
            _PRow('Remaining', (a.totalTasks - a.completedTasks - a.inProgressTasks).clamp(0, a.totalTasks), a.totalTasks, AppTheme.textSecondary),
          ])),
        ],
        const SizedBox(height: 14),
        SizedBox(width: double.infinity,
          child: OutlinedButton.icon(
            icon: const Icon(Icons.bar_chart_outlined, size: 16),
            label: const Text('Full Analytics'),
            onPressed: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => ProjectAnalyticsScreen(project: project))),
          )),
      ]),
    );
  }
}

// ── Timeline Report ───────────────────────────────────────────────────────────

class _TimelineReport extends StatelessWidget {
  final Project project;
  const _TimelineReport({required this.project});

  @override
  Widget build(BuildContext context) {
    final p = project;
    final now = DateTime.now();
    final totalDays = p.endDate.difference(p.startDate).inDays.clamp(1, 99999);
    final elapsed = now.difference(p.startDate).inDays.clamp(0, totalDays);
    final remaining = p.endDate.difference(now).inDays;
    final tp = elapsed / totalDays;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _Row3(
          _KPI('Duration', '${totalDays}d', AppTheme.primary),
          _KPI('Elapsed', '${elapsed}d', AppTheme.blue),
          _KPI('Remaining', remaining < 0 ? 'Overdue' : '${remaining}d',
              remaining < 0 ? AppTheme.red : remaining <= 7 ? AppTheme.amber : AppTheme.green),
        ),
        const SizedBox(height: 14),
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Timeline Progress', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            Text('${(tp * 100).toStringAsFixed(0)}%',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                    color: tp > 0.9 ? AppTheme.red : AppTheme.blue)),
          ]),
          const SizedBox(height: 8),
          ClipRRect(borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(value: tp, minHeight: 10, backgroundColor: AppTheme.border,
                valueColor: AlwaysStoppedAnimation(tp > 0.9 ? AppTheme.red : AppTheme.blue))),
          const SizedBox(height: 10),
          Row(children: [
            _DateChip('Start', AppTheme.fmtDate(p.startDate), AppTheme.blue),
            const Spacer(),
            _DateChip('End', AppTheme.fmtDate(p.endDate), remaining < 0 ? AppTheme.red : AppTheme.green),
          ]),
        ])),
        if (p.milestones.isNotEmpty) ...[ const SizedBox(height: 14),
          const Text('Milestones', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          ...p.milestones.map((m) {
            final done = (m['status'] ?? '') == 'completed';
            final due = DateTime.tryParse(m['dueDate'] ?? m['date'] ?? '');
            return _Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: Row(children: [
                Icon(done ? Icons.check_circle : Icons.radio_button_unchecked,
                    size: 16, color: done ? AppTheme.green : AppTheme.textSecondary),
                const SizedBox(width: 8),
                Expanded(child: Text(m['name'] ?? m['title'] ?? '',
                    style: TextStyle(fontSize: 12, decoration: done ? TextDecoration.lineThrough : null))),
                if (due != null) Text(AppTheme.fmtDate(due),
                    style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
              ]),
            );
          }),
        ],
        const SizedBox(height: 14),
        SizedBox(width: double.infinity,
          child: OutlinedButton.icon(
            icon: const Icon(Icons.timeline_outlined, size: 16),
            label: const Text('Full Timeline & Gantt'),
            onPressed: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => ProjectTimelineScreen(project: project))),
          )),
      ]),
    );
  }
}

// ── Shared widgets ────────────────────────────────────────────────────────────

class _Card extends StatelessWidget {
  final Widget child;
  final EdgeInsets? margin;
  const _Card({required this.child, this.margin});
  @override
  Widget build(BuildContext context) => Container(
    margin: margin,
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
    padding: const EdgeInsets.all(12),
    child: child,
  );
}

class _KPI extends StatelessWidget {
  final String label, value;
  final Color color;
  const _KPI(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Expanded(child: Container(
    margin: const EdgeInsets.symmetric(horizontal: 3),
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(color: color.withOpacity(0.06), borderRadius: BorderRadius.circular(10), border: Border.all(color: color.withOpacity(0.2))),
    child: Column(children: [
      FittedBox(child: Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: color))),
      const SizedBox(height: 2),
      Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary), textAlign: TextAlign.center),
    ]),
  ));
}

class _Row3 extends StatelessWidget {
  final Widget a, b, c;
  const _Row3(this.a, this.b, this.c);
  @override
  Widget build(BuildContext context) => Row(children: [a, b, c]);
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
      SizedBox(width: 90, child: Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
      Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(value: pct.toDouble(), minHeight: 7, backgroundColor: AppTheme.border,
              valueColor: AlwaysStoppedAnimation(color)))),
      const SizedBox(width: 8),
      Text('$value', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
    ]);
  }
}

class _DateChip extends StatelessWidget {
  final String label, date;
  final Color color;
  const _DateChip(this.label, this.date, this.color);
  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
    Text(date, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
  ]);
}
