import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/analytics_service.dart';

class DashboardAnalyticsScreen extends StatefulWidget {
  const DashboardAnalyticsScreen({super.key});
  @override
  State<DashboardAnalyticsScreen> createState() => _State();
}

class _State extends State<DashboardAnalyticsScreen> with SingleTickerProviderStateMixin {
  final _svc = AnalyticsService();
  late TabController _tabs;
  Map<String, dynamic> _stats = {}, _analytics = {}, _trends = {};
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
        _svc.getDashboardStats(),
        _svc.getDashboardAnalytics(),
        _svc.getTrends(),
      ]);
      if (!mounted) return;
      setState(() { _stats = r[0]; _analytics = r[1]; _trends = r[2]; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Dashboard Analytics'),
        actions: [IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: _load)],
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          indicatorSize: TabBarIndicatorSize.label,
          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          tabs: const [Tab(text: 'Overview'), Tab(text: 'Trends'), Tab(text: 'Monitoring')],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? _ErrView(error: _error!, onRetry: _load)
              : TabBarView(controller: _tabs, children: [
                  _OverviewTab(stats: _stats, analytics: _analytics),
                  _TrendsTab(trends: _trends, analytics: _analytics),
                  _MonitoringTab(stats: _stats),
                ]),
    );
  }
}

// ── Overview ──────────────────────────────────────────────────────────────────

class _OverviewTab extends StatelessWidget {
  final Map<String, dynamic> stats, analytics;
  const _OverviewTab({required this.stats, required this.analytics});

  @override
  Widget build(BuildContext context) {
    final taskDist = analytics['taskDistribution'] as List? ?? [];
    final projectProgress = analytics['projectProgress'] as List? ?? [];
    final teamProd = analytics['teamProductivity'] as List? ?? [];
    final p = _hPad(context);

    return RefreshIndicator(
      onRefresh: () async {},
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.all(p),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _StatsGrid(stats: stats),
          if (taskDist.isNotEmpty) ...[
            const SizedBox(height: 20),
            _SecHead('Task Distribution'),
            const SizedBox(height: 10),
            _Card(child: _DistBars(items: taskDist,
                total: taskDist.fold(0, (s, e) => s + ((e['value'] ?? 0) as num).toInt()))),
          ],
          if (projectProgress.isNotEmpty) ...[
            const SizedBox(height: 20),
            _SecHead('Project Progress'),
            const SizedBox(height: 10),
            _Card(child: _ProjProgressList(items: projectProgress)),
          ],
          if (teamProd.isNotEmpty) ...[
            const SizedBox(height: 20),
            _SecHead('Team Productivity'),
            const SizedBox(height: 10),
            _Card(child: _TeamProdList(items: teamProd)),
          ],
          const SizedBox(height: 16),
        ]),
      ),
    );
  }
}

// ── Trends ────────────────────────────────────────────────────────────────────

class _TrendsTab extends StatelessWidget {
  final Map<String, dynamic> trends, analytics;
  const _TrendsTab({required this.trends, required this.analytics});

  @override
  Widget build(BuildContext context) {
    final monthly = analytics['monthlyRevenue'] as List? ?? [];
    final p = _hPad(context);
    return SingleChildScrollView(
      padding: EdgeInsets.all(p),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (trends.isNotEmpty) ...[
          _SecHead('Month-over-Month Trends'),
          const SizedBox(height: 10),
          _TrendGrid(trends: trends),
          const SizedBox(height: 20),
        ],
        if (monthly.isNotEmpty) ...[
          _SecHead('Monthly Revenue vs Expenses'),
          const SizedBox(height: 10),
          _Card(child: _MonthlyChart(data: monthly)),
        ],
        if (trends.isEmpty && monthly.isEmpty)
          const _Empty('No trend data available'),
        const SizedBox(height: 16),
      ]),
    );
  }
}

// ── Monitoring ────────────────────────────────────────────────────────────────

class _MonitoringTab extends StatelessWidget {
  final Map<String, dynamic> stats;
  const _MonitoringTab({required this.stats});

  @override
  Widget build(BuildContext context) {
    final totalTasks = (stats['totalTasks'] ?? 0) as num;
    final completedTasks = (stats['completedTasks'] ?? 0) as num;
    final inProgress = (stats['inProgressTasks'] ?? 0) as num;
    final pending = (stats['pendingTasks'] ?? 0) as num;
    final totalProjects = (stats['totalProjects'] ?? 0) as num;
    final activeProjects = (stats['activeProjects'] ?? 0) as num;
    final completedProjects = (stats['completedProjects'] ?? 0) as num;
    final overdueInvoices = (stats['overdueInvoices'] ?? 0) as num;
    final overdueAmount = (stats['overdueAmount'] ?? 0.0) as num;
    final salesRevenue = (stats['salesRevenue'] ?? 0.0) as num;
    final salesPaid = (stats['salesPaid'] ?? 0.0) as num;

    final taskRate = totalTasks > 0 ? completedTasks / totalTasks : 0.0;
    final projRate = totalProjects > 0 ? completedProjects / totalProjects : 0.0;
    final collRate = salesRevenue > 0 ? salesPaid / salesRevenue : 0.0;
    final p = _hPad(context);

    return SingleChildScrollView(
      padding: EdgeInsets.all(p),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _SecHead('Health Indicators'),
        const SizedBox(height: 10),
        _Card(child: Column(children: [
          _HealthBar('Task Completion', taskRate.toDouble(),
              '${completedTasks.toInt()} / ${totalTasks.toInt()}'),
          const SizedBox(height: 14),
          _HealthBar('Project Completion', projRate.toDouble(),
              '${completedProjects.toInt()} / ${totalProjects.toInt()}'),
          const SizedBox(height: 14),
          _HealthBar('Invoice Collection', collRate.toDouble(),
              '${_fmtN(salesPaid)} / ${_fmtN(salesRevenue)}'),
        ])),
        const SizedBox(height: 20),
        _SecHead('Active Workload'),
        const SizedBox(height: 10),
        LayoutBuilder(builder: (_, c) {
          final cols = c.maxWidth < 360 ? 2 : c.maxWidth < 600 ? 2 : c.maxWidth < 900 ? 4 : 4;
          final gap = (cols - 1) * 8.0;
          final w = (c.maxWidth - gap) / cols;
          return Wrap(spacing: 8, runSpacing: 8, children: [
            _WorkTile('Active Projects', activeProjects.toString(), AppTheme.primary, Icons.folder_open_outlined, w),
            _WorkTile('In Progress', inProgress.toString(), AppTheme.blue, Icons.pending_actions_outlined, w),
            _WorkTile('Pending Tasks', pending.toString(), AppTheme.amber, Icons.hourglass_empty_outlined, w),
            _WorkTile('Overdue Invoices', overdueInvoices.toString(), AppTheme.red, Icons.receipt_long_outlined, w),
          ]);
        }),
        if (overdueAmount > 0) ...[
          const SizedBox(height: 20),
          _SecHead('Alerts'),
          const SizedBox(height: 10),
          _AlertBanner(
            icon: Icons.warning_amber_rounded,
            color: AppTheme.red,
            bg: AppTheme.redBg,
            message: '${overdueInvoices.toInt()} overdue invoice${overdueInvoices > 1 ? 's' : ''} — ${_fmtN(overdueAmount)} outstanding',
          ),
        ],
        const SizedBox(height: 16),
      ]),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _StatsGrid extends StatelessWidget {
  final Map<String, dynamic> stats;
  const _StatsGrid({required this.stats});

  @override
  Widget build(BuildContext context) {
    final items = [
      (label: 'Employees', val: '${stats['totalEmployees'] ?? 0}', color: AppTheme.primary, icon: Icons.people_outline),
      (label: 'Projects', val: '${stats['totalProjects'] ?? 0}', color: AppTheme.blue, icon: Icons.folder_outlined),
      (label: 'Tasks', val: '${stats['totalTasks'] ?? 0}', color: AppTheme.cyan, icon: Icons.task_outlined),
      (label: 'Revenue', val: _fmtN(stats['revenue'] ?? 0), color: AppTheme.green, icon: Icons.trending_up_outlined),
      (label: 'Expenses', val: _fmtN(stats['expenses'] ?? 0), color: AppTheme.red, icon: Icons.trending_down_outlined),
      (label: 'Profit', val: _fmtN(stats['profit'] ?? 0), color: AppTheme.teal, icon: Icons.account_balance_outlined),
    ];
    return LayoutBuilder(builder: (_, c) {
      final cols = c.maxWidth < 360 ? 2 : c.maxWidth < 600 ? 3 : c.maxWidth < 900 ? 4 : 6;
      return GridView.count(
        crossAxisCount: cols,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: 1.35,
        children: items.map((i) => Container(
          decoration: BoxDecoration(
            color: i.color.withOpacity(0.06),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: i.color.withOpacity(0.18)),
          ),
          padding: const EdgeInsets.all(10),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Icon(i.icon, size: 16, color: i.color),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              FittedBox(child: Text(i.val,
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: i.color))),
              Text(i.label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
            ]),
          ]),
        )).toList(),
      );
    });
  }
}

class _TrendGrid extends StatelessWidget {
  final Map<String, dynamic> trends;
  const _TrendGrid({required this.trends});

  @override
  Widget build(BuildContext context) {
    final entries = trends.entries.where((e) => e.value is Map).toList();
    if (entries.isEmpty) return const _Empty('No trend data');
    return LayoutBuilder(builder: (_, c) {
      final cols = c.maxWidth < 360 ? 2 : c.maxWidth < 600 ? 3 : c.maxWidth < 900 ? 4 : 6;
      final gap = (cols - 1) * 8.0;
      final w = (c.maxWidth - gap) / cols;
      return Wrap(spacing: 8, runSpacing: 8, children: entries.map((e) {
        final t = e.value as Map;
        final val = (t['value'] ?? 0) as num;
        final isUp = (t['direction']?.toString() ?? 'up') == 'up';
        final color = isUp ? AppTheme.green : AppTheme.red;
        return SizedBox(width: w, child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(e.key[0].toUpperCase() + e.key.substring(1),
                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 6),
            Row(children: [
              Icon(isUp ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
                  size: 13, color: color),
              const SizedBox(width: 2),
              Flexible(child: Text('${val.toStringAsFixed(1)}%',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: color))),
            ]),
          ]),
        ));
      }).toList());
    });
  }
}

class _MonthlyChart extends StatelessWidget {
  final List data;
  const _MonthlyChart({required this.data});

  @override
  Widget build(BuildContext context) {
    final maxVal = data.fold<double>(0, (m, e) {
      final r = (e['revenue'] ?? 0) as num;
      final x = (e['expenses'] ?? 0) as num;
      return [m, r.toDouble(), x.toDouble()].reduce((a, b) => a > b ? a : b);
    });
    return Column(children: [
      Row(children: [
        _Legend(AppTheme.green, 'Revenue'),
        const SizedBox(width: 16),
        _Legend(AppTheme.red, 'Expenses'),
      ]),
      const SizedBox(height: 12),
      ...data.map((d) {
        final month = d['month']?.toString() ?? '';
        final rev = (d['revenue'] ?? 0) as num;
        final exp = (d['expenses'] ?? 0) as num;
        final rp = maxVal > 0 ? (rev / maxVal).clamp(0.0, 1.0) : 0.0;
        final ep = maxVal > 0 ? (exp / maxVal).clamp(0.0, 1.0) : 0.0;
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(children: [
            SizedBox(width: 30, child: Text(month,
                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary))),
            const SizedBox(width: 8),
            Expanded(child: Column(children: [
              _Bar(rp, AppTheme.green, _fmtN(rev)),
              const SizedBox(height: 3),
              _Bar(ep, AppTheme.red, _fmtN(exp)),
            ])),
          ]),
        );
      }),
    ]);
  }
}

class _Bar extends StatelessWidget {
  final double pct;
  final Color color;
  final String label;
  const _Bar(this.pct, this.color, this.label);
  @override
  Widget build(BuildContext context) => Row(children: [
    Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(3),
        child: LinearProgressIndicator(value: pct, minHeight: 7,
            backgroundColor: AppTheme.border, valueColor: AlwaysStoppedAnimation(color)))),
    const SizedBox(width: 6),
    SizedBox(width: 42, child: Text(label,
        style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600),
        textAlign: TextAlign.right)),
  ]);
}

class _Legend extends StatelessWidget {
  final Color color;
  final String label;
  const _Legend(this.color, this.label);
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
    Container(width: 10, height: 10, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
    const SizedBox(width: 4),
    Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
  ]);
}

class _DistBars extends StatelessWidget {
  final List items;
  final int total;
  const _DistBars({required this.items, required this.total});
  @override
  Widget build(BuildContext context) => Column(children: items.map((e) {
    final name = e['name']?.toString() ?? '';
    final val = (e['value'] ?? 0) as num;
    final pct = total > 0 ? (val / total).clamp(0.0, 1.0) : 0.0;
    final color = name.toLowerCase().contains('complet') ? AppTheme.green
        : name.toLowerCase().contains('progress') ? AppTheme.blue : AppTheme.amber;
    return Padding(padding: const EdgeInsets.only(bottom: 10),
      child: Row(children: [
        SizedBox(width: 80, child: Text(name,
            style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
        Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(value: pct, minHeight: 10,
                backgroundColor: AppTheme.border, valueColor: AlwaysStoppedAnimation(color)))),
        const SizedBox(width: 8),
        Text('${val.toInt()}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
      ]),
    );
  }).toList());
}

class _ProjProgressList extends StatelessWidget {
  final List items;
  const _ProjProgressList({required this.items});
  @override
  Widget build(BuildContext context) => Column(children: items.map((p) {
    final name = p['name']?.toString() ?? '';
    final progress = (p['progress'] ?? 0) as num;
    final status = p['status']?.toString() ?? '';
    return Padding(padding: const EdgeInsets.only(bottom: 10),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
              maxLines: 1, overflow: TextOverflow.ellipsis)),
          _Badge(status),
          const SizedBox(width: 6),
          Text('${progress.toInt()}%',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primary)),
        ]),
        const SizedBox(height: 4),
        ClipRRect(borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(value: (progress / 100).clamp(0.0, 1.0), minHeight: 5,
                backgroundColor: AppTheme.border,
                valueColor: const AlwaysStoppedAnimation(AppTheme.primary))),
      ]),
    );
  }).toList());
}

class _TeamProdList extends StatelessWidget {
  final List items;
  const _TeamProdList({required this.items});
  @override
  Widget build(BuildContext context) => Column(children: items.map((t) {
    final name = t['name']?.toString() ?? '';
    final completed = (t['completed'] ?? 0) as num;
    final pending = (t['pending'] ?? 0) as num;
    final total = completed + pending;
    final pct = total > 0 ? (completed / total).clamp(0.0, 1.0) : 0.0;
    return Padding(padding: const EdgeInsets.only(bottom: 10),
      child: Row(children: [
        SizedBox(width: 90, child: Text(name,
            style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
            maxLines: 1, overflow: TextOverflow.ellipsis)),
        Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(value: pct, minHeight: 10,
                backgroundColor: AppTheme.border,
                valueColor: const AlwaysStoppedAnimation(AppTheme.green)))),
        const SizedBox(width: 8),
        Text('${completed.toInt()}/${total.toInt()}',
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.green)),
      ]),
    );
  }).toList());
}

class _HealthBar extends StatelessWidget {
  final String label, subtitle;
  final double value;
  const _HealthBar(this.label, this.value, this.subtitle);
  @override
  Widget build(BuildContext context) {
    final color = value >= 0.8 ? AppTheme.green : value >= 0.5 ? AppTheme.amber : AppTheme.red;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        Row(children: [
          Text(subtitle, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
          const SizedBox(width: 8),
          Text('${(value * 100).toStringAsFixed(1)}%',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
        ]),
      ]),
      const SizedBox(height: 6),
      ClipRRect(borderRadius: BorderRadius.circular(5),
          child: LinearProgressIndicator(value: value, minHeight: 10,
              backgroundColor: AppTheme.border, valueColor: AlwaysStoppedAnimation(color))),
    ]);
  }
}

class _WorkTile extends StatelessWidget {
  final String label, value;
  final Color color;
  final IconData icon;
  final double width;
  const _WorkTile(this.label, this.value, this.color, this.icon, this.width);
  @override
  Widget build(BuildContext context) => SizedBox(width: width, child: Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: color.withOpacity(0.06), borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.18))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(icon, size: 16, color: color),
      const SizedBox(height: 8),
      FittedBox(child: Text(value,
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: color))),
      const SizedBox(height: 2),
      Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
          maxLines: 2, overflow: TextOverflow.ellipsis),
    ]),
  ));
}

class _AlertBanner extends StatelessWidget {
  final IconData icon;
  final Color color, bg;
  final String message;
  const _AlertBanner({required this.icon, required this.color, required this.bg, required this.message});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3))),
    child: Row(children: [
      Icon(icon, color: color, size: 20),
      const SizedBox(width: 10),
      Expanded(child: Text(message,
          style: TextStyle(fontSize: 13, color: color, fontWeight: FontWeight.w500))),
    ]),
  );
}

// ── Primitives ────────────────────────────────────────────────────────────────

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

class _Badge extends StatelessWidget {
  final String status;
  const _Badge(this.status);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
    decoration: BoxDecoration(color: AppTheme.statusBg(status), borderRadius: BorderRadius.circular(4)),
    child: Text(status, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700,
        color: AppTheme.statusColor(status))),
  );
}

class _Empty extends StatelessWidget {
  final String message;
  const _Empty(this.message);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 32),
    child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.analytics_outlined, size: 40, color: AppTheme.textMuted),
      const SizedBox(height: 10),
      Text(message, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
    ])),
  );
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

String _fmtN(dynamic v) {
  final n = (v ?? 0) as num;
  if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
  if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
  return n.toStringAsFixed(0);
}

double _hPad(BuildContext context) {
  final w = MediaQuery.of(context).size.width;
  return w < 400 ? 12 : w < 768 ? 16 : 24;
}
