import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/analytics_service.dart';

class BudgetAnalyticsScreen extends StatefulWidget {
  const BudgetAnalyticsScreen({super.key});
  @override
  State<BudgetAnalyticsScreen> createState() => _State();
}

class _State extends State<BudgetAnalyticsScreen> with SingleTickerProviderStateMixin {
  final _svc = AnalyticsService();
  late TabController _tabs;
  Map<String, dynamic> _budgetAnalytics = {};
  Map<String, dynamic> _reportStats = {};
  List<dynamic> _reports = [];
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
        _svc.getBudgetAnalytics(),
        _svc.getBudgetReportStats(),
        _svc.getBudgetReports(),
      ]);
      if (!mounted) return;
      setState(() {
        _budgetAnalytics = r[0] as Map<String, dynamic>;
        _reportStats = r[1] as Map<String, dynamic>;
        _reports = r[2] as List<dynamic>;
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
        title: const Text('Budget Analytics'),
        actions: [IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: _load)],
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          indicatorSize: TabBarIndicatorSize.label,
          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          tabs: const [Tab(text: 'Analytics'), Tab(text: 'Reports'), Tab(text: 'Scheduling')],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? _ErrView(error: _error!, onRetry: _load)
              : TabBarView(controller: _tabs, children: [
                  _AnalyticsTab(data: _budgetAnalytics),
                  _ReportsTab(reports: _reports, stats: _reportStats),
                  _SchedulingTab(stats: _reportStats),
                ]),
    );
  }
}

class _AnalyticsTab extends StatelessWidget {
  final Map<String, dynamic> data;
  const _AnalyticsTab({required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return const _Empty('No budget analytics available');
    final totalBudget = (data['totalBudget'] ?? data['total'] ?? 0) as num;
    final allocated = (data['allocatedBudget'] ?? data['allocated'] ?? 0) as num;
    final spent = (data['spentBudget'] ?? data['spent'] ?? 0) as num;
    final remaining = (data['remainingBudget'] ?? data['remaining'] ?? totalBudget - spent) as num;
    final utilization = totalBudget > 0 ? (spent / totalBudget).clamp(0.0, 1.0) : 0.0;
    final byDept = data['byDepartment'] as List? ?? data['departments'] as List? ?? [];
    final byProject = data['byProject'] as List? ?? data['projects'] as List? ?? [];
    final p = _hPad(context);

    return SingleChildScrollView(
      padding: EdgeInsets.all(p),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        LayoutBuilder(builder: (_, c) {
          final cols = c.maxWidth < 360 ? 2 : c.maxWidth < 600 ? 2 : 4;
          final gap = (cols - 1) * 8.0;
          final w = (c.maxWidth - gap) / cols;
          return Wrap(spacing: 8, runSpacing: 8, children: [
            _Tile('Total Budget', _fmt(totalBudget), AppTheme.primary, Icons.account_balance_wallet_outlined, w),
            _Tile('Allocated', _fmt(allocated), AppTheme.blue, Icons.pie_chart_outline, w),
            _Tile('Spent', _fmt(spent), AppTheme.red, Icons.trending_down_outlined, w),
            _Tile('Remaining', _fmt(remaining), AppTheme.green, Icons.savings_outlined, w),
          ]);
        }),
        const SizedBox(height: 20),
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Budget Utilization', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            Text('${(utilization * 100).toStringAsFixed(1)}%',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                    color: utilization > 0.9 ? AppTheme.red : utilization > 0.7 ? AppTheme.amber : AppTheme.green)),
          ]),
          const SizedBox(height: 8),
          ClipRRect(borderRadius: BorderRadius.circular(5),
              child: LinearProgressIndicator(value: utilization, minHeight: 12,
                  backgroundColor: AppTheme.border,
                  valueColor: AlwaysStoppedAnimation(
                      utilization > 0.9 ? AppTheme.red : utilization > 0.7 ? AppTheme.amber : AppTheme.green))),
          const SizedBox(height: 10),
          Row(children: [
            _Dot(AppTheme.red, 'Spent: ${_fmt(spent)}'),
            const SizedBox(width: 16),
            _Dot(AppTheme.green, 'Remaining: ${_fmt(remaining)}'),
          ]),
        ])),
        if (byDept.isNotEmpty) ...[
          const SizedBox(height: 20),
          const _SecHead('By Department'),
          const SizedBox(height: 10),
          _Card(child: Column(children: byDept.map<Widget>((d) {
            final name = d['department']?.toString() ?? d['name']?.toString() ?? '';
            final budget = (d['budget'] ?? d['total'] ?? 0) as num;
            final dSpent = (d['spent'] ?? d['used'] ?? 0) as num;
            final pct = budget > 0 ? (dSpent / budget).clamp(0.0, 1.0) : 0.0;
            final color = pct > 0.9 ? AppTheme.red : pct > 0.7 ? AppTheme.amber : AppTheme.green;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Expanded(child: Text(name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                      maxLines: 1, overflow: TextOverflow.ellipsis)),
                  Text('${(pct * 100).toStringAsFixed(0)}%',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
                ]),
                const SizedBox(height: 4),
                ClipRRect(borderRadius: BorderRadius.circular(3),
                    child: LinearProgressIndicator(value: pct, minHeight: 6,
                        backgroundColor: AppTheme.border, valueColor: AlwaysStoppedAnimation(color))),
                const SizedBox(height: 2),
                Text('${_fmt(dSpent)} / ${_fmt(budget)}',
                    style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
              ]),
            );
          }).toList())),
        ],
        if (byProject.isNotEmpty) ...[
          const SizedBox(height: 20),
          const _SecHead('By Project'),
          const SizedBox(height: 10),
          _Card(child: Column(children: byProject.map<Widget>((p) {
            final name = p['project']?.toString() ?? p['name']?.toString() ?? '';
            final budget = (p['budget'] ?? p['total'] ?? 0) as num;
            final pSpent = (p['spent'] ?? p['used'] ?? 0) as num;
            final pct = budget > 0 ? (pSpent / budget).clamp(0.0, 1.0) : 0.0;
            final color = pct > 0.9 ? AppTheme.red : pct > 0.7 ? AppTheme.amber : AppTheme.primary;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Expanded(child: Text(name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                      maxLines: 1, overflow: TextOverflow.ellipsis)),
                  Text('${(pct * 100).toStringAsFixed(0)}%',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
                ]),
                const SizedBox(height: 4),
                ClipRRect(borderRadius: BorderRadius.circular(3),
                    child: LinearProgressIndicator(value: pct, minHeight: 6,
                        backgroundColor: AppTheme.border, valueColor: AlwaysStoppedAnimation(color))),
              ]),
            );
          }).toList())),
        ],
        const SizedBox(height: 16),
      ]),
    );
  }
}

class _ReportsTab extends StatelessWidget {
  final List<dynamic> reports;
  final Map<String, dynamic> stats;
  const _ReportsTab({required this.reports, required this.stats});

  @override
  Widget build(BuildContext context) {
    final total = (stats['totalReports'] ?? stats['total'] ?? reports.length) as num;
    final p = _hPad(context);
    return Column(children: [
      if (stats.isNotEmpty)
        Container(
          color: Theme.of(context).cardColor,
          padding: EdgeInsets.symmetric(horizontal: p, vertical: 10),
          child: Row(children: [
            _StatChip('Total', total.toString(), AppTheme.primary),
            const SizedBox(width: 8),
            _StatChip('Generated', (stats['generated'] ?? stats['completed'] ?? 0).toString(), AppTheme.green),
            const SizedBox(width: 8),
            _StatChip('Scheduled', (stats['scheduled'] ?? 0).toString(), AppTheme.blue),
          ]),
        ),
      Expanded(child: reports.isEmpty
          ? const _Empty('No budget reports found')
          : ListView.separated(
              padding: EdgeInsets.all(p),
              itemCount: reports.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final r = reports[i] as Map;
                final name = r['reportName']?.toString() ?? r['name']?.toString() ?? 'Report ${i + 1}';
                final type = r['reportType']?.toString() ?? r['type']?.toString() ?? '';
                final format = r['format']?.toString() ?? '';
                final status = r['status']?.toString() ?? 'generated';
                final date = r['createdAt']?.toString() ?? r['generatedAt']?.toString() ?? '';
                final color = AppTheme.statusColor(status.toLowerCase());
                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.border)),
                  child: Row(children: [
                    Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.description_outlined, size: 20, color: AppTheme.primary),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                      Row(children: [
                        if (type.isNotEmpty) Text(type,
                            style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                        if (type.isNotEmpty && format.isNotEmpty)
                          const Text(' · ', style: TextStyle(color: AppTheme.textMuted)),
                        if (format.isNotEmpty) Text(format.toUpperCase(),
                            style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                      ]),
                      if (date.isNotEmpty)
                        Text(date.length > 10 ? date.substring(0, 10) : date,
                            style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                    ])),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                      child: Text(status.toUpperCase(),
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
                    ),
                  ]),
                );
              },
            )),
    ]);
  }
}

class _SchedulingTab extends StatelessWidget {
  final Map<String, dynamic> stats;
  const _SchedulingTab({required this.stats});

  @override
  Widget build(BuildContext context) {
    final scheduled = (stats['scheduled'] ?? stats['scheduledReports'] ?? 0) as num;
    final lastRun = stats['lastRunAt']?.toString() ?? stats['lastGenerated']?.toString() ?? '';
    final nextRun = stats['nextRunAt']?.toString() ?? stats['nextScheduled']?.toString() ?? '';
    final p = _hPad(context);

    return SingleChildScrollView(
      padding: EdgeInsets.all(p),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const _SecHead('Report Scheduling'),
        const SizedBox(height: 10),
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _InfoRow(Icons.schedule_outlined, 'Scheduled Reports', scheduled.toString(), AppTheme.blue),
          if (lastRun.isNotEmpty) ...[
            const SizedBox(height: 10),
            _InfoRow(Icons.history_outlined, 'Last Run',
                lastRun.length > 10 ? lastRun.substring(0, 10) : lastRun, AppTheme.green),
          ],
          if (nextRun.isNotEmpty) ...[
            const SizedBox(height: 10),
            _InfoRow(Icons.upcoming_outlined, 'Next Run',
                nextRun.length > 10 ? nextRun.substring(0, 10) : nextRun, AppTheme.amber),
          ],
        ])),
        const SizedBox(height: 20),
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Available Report Types', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          ...['Summary', 'Detailed', 'Variance', 'Forecast', 'Comparison', 'Custom'].map((t) =>
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(children: [
                  Container(width: 6, height: 6,
                      decoration: BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle)),
                  const SizedBox(width: 10),
                  Text(t, style: const TextStyle(fontSize: 13)),
                ]),
              )),
        ])),
        const SizedBox(height: 20),
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Export Formats', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, children: ['PDF', 'Excel', 'CSV', 'JSON'].map((f) =>
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
                ),
                child: Text(f, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                    color: AppTheme.primary)),
              )).toList()),
        ])),
        const SizedBox(height: 16),
      ]),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final Color color;
  const _InfoRow(this.icon, this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Row(children: [
    Icon(icon, size: 16, color: color),
    const SizedBox(width: 10),
    Expanded(child: Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary))),
    Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
  ]);
}

class _StatChip extends StatelessWidget {
  final String label, value;
  final Color color;
  const _StatChip(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
    decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.2))),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
      const SizedBox(width: 4),
      Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
    ]),
  );
}

class _Dot extends StatelessWidget {
  final Color color;
  final String label;
  const _Dot(this.color, this.label);
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
    Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
    const SizedBox(width: 4),
    Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
  ]);
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
      FittedBox(child: Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: color))),
      Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
          maxLines: 2, overflow: TextOverflow.ellipsis),
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
    const Icon(Icons.bar_chart_outlined, size: 40, color: AppTheme.textMuted),
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

String _fmt(num v) {
  if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(1)}M';
  if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
  return v.toStringAsFixed(0);
}

double _hPad(BuildContext context) {
  final w = MediaQuery.of(context).size.width;
  return w < 400 ? 12 : w < 768 ? 16 : 24;
}
