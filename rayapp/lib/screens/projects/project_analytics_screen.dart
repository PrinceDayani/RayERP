import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../services/project_budget_service.dart';

class ProjectAnalyticsScreen extends StatefulWidget {
  final Project project;
  const ProjectAnalyticsScreen({super.key, required this.project});
  @override
  State<ProjectAnalyticsScreen> createState() => _ProjectAnalyticsScreenState();
}

class _ProjectAnalyticsScreenState extends State<ProjectAnalyticsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  Map<String, dynamic> _perf = {}, _risk = {}, _burndown = {}, _velocity = {}, _resources = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 4, vsync: this);
    _load();
  }

  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    final svc = ProjectAnalyticsService();
    final id = widget.project.id;
    final results = await Future.wait([
      svc.getPerformanceIndices(id),
      svc.getRiskAssessment(id),
      svc.getBurndown(id),
      svc.getVelocity(id),
      svc.getResourceUtilization(id),
    ]);
    _perf = results[0]; _risk = results[1]; _burndown = results[2];
    _velocity = results[3]; _resources = results[4];
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final wide = AppTheme.isWide(context);
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Text('Analytics · ${widget.project.name}'),
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppTheme.primary, unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          indicatorSize: wide ? TabBarIndicatorSize.tab : TabBarIndicatorSize.label,
          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          tabs: const [Tab(text: 'Performance'), Tab(text: 'Burndown'), Tab(text: 'Velocity'), Tab(text: 'Resources')],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : TabBarView(controller: _tabs, children: [
              _PerformanceTab(perf: _perf, risk: _risk, project: widget.project),
              _BurndownTab(data: _burndown),
              _VelocityTab(data: _velocity),
              _ResourcesTab(data: _resources),
            ]),
    );
  }
}

// ── Performance Tab ───────────────────────────────────────────────────────────

class _PerformanceTab extends StatelessWidget {
  final Map<String, dynamic> perf, risk;
  final Project project;
  const _PerformanceTab({required this.perf, required this.risk, required this.project});

  Color _ic(double v) => v >= 1.0 ? AppTheme.green : v >= 0.8 ? AppTheme.amber : AppTheme.red;
  Color _rc(String r) => switch (r) { 'critical' || 'high' => AppTheme.red, 'medium' => AppTheme.amber, _ => AppTheme.green };

  @override
  Widget build(BuildContext context) {
    final cpi = (perf['cpi'] ?? 0.0).toDouble();
    final spi = (perf['spi'] ?? 0.0).toDouble();
    final cv = (perf['costVariance'] ?? 0.0).toDouble();
    final sv = (perf['scheduleVariance'] ?? 0.0).toDouble();
    final pv = (perf['plannedValue'] ?? 0.0).toDouble();
    final ev = (perf['earnedValue'] ?? 0.0).toDouble();
    final ac = (perf['actualCost'] ?? 0.0).toDouble();
    final status = perf['status'] ?? '';
    final overallRisk = risk['overallRisk'] ?? 'low';
    final risks = (risk['risks'] as List? ?? []);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Status badge
        if (status.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            decoration: BoxDecoration(
              color: (status == 'on-track' ? AppTheme.green : AppTheme.red).withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: (status == 'on-track' ? AppTheme.green : AppTheme.red).withOpacity(0.3)),
            ),
            child: Text(status.replaceAll('-', ' ').toUpperCase(),
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
                    color: status == 'on-track' ? AppTheme.green : AppTheme.red)),
          ),
        // CPI / SPI
        LayoutBuilder(builder: (_, c) {
          final w = (c.maxWidth - 10) / 2;
          return Row(children: [
            _IndexTile('CPI', cpi.toStringAsFixed(2), 'Cost Performance', _ic(cpi), w),
            const SizedBox(width: 10),
            _IndexTile('SPI', spi.toStringAsFixed(2), 'Schedule Performance', _ic(spi), w),
          ]);
        }),
        const SizedBox(height: 10),
        // EVM values
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Earned Value Metrics', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 10),
          _EVMRow('Planned Value (PV)', pv, project.currency),
          _EVMRow('Earned Value (EV)', ev, project.currency),
          _EVMRow('Actual Cost (AC)', ac, project.currency),
          const Divider(height: 16, color: AppTheme.border),
          _EVMRow('Cost Variance (CV)', cv, project.currency, highlight: true),
          _EVMRow('Schedule Variance (SV)', sv, project.currency, highlight: true),
        ])),
        const SizedBox(height: 10),
        // Risk assessment
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Text('Risk Assessment', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(color: _rc(overallRisk).withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
              child: Text(overallRisk.toUpperCase(), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _rc(overallRisk))),
            ),
          ]),
          if (risks.isNotEmpty) ...[ const SizedBox(height: 10),
            ...risks.map((r) {
              final sev = r['severity'] ?? 'low';
              final c = _rc(sev);
              return Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: c.withOpacity(0.04), borderRadius: BorderRadius.circular(8), border: Border.all(color: c.withOpacity(0.2))),
                child: Row(children: [
                  Container(width: 6, height: 6, decoration: BoxDecoration(color: c, shape: BoxShape.circle)),
                  const SizedBox(width: 8),
                  Expanded(child: Text(r['message'] ?? '', style: const TextStyle(fontSize: 12))),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(color: c.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                    child: Text(sev, style: TextStyle(fontSize: 10, color: c, fontWeight: FontWeight.w600)),
                  ),
                ]),
              );
            }),
          ],
        ])),
      ]),
    );
  }
}

class _IndexTile extends StatelessWidget {
  final String label, value, subtitle;
  final Color color;
  final double w;
  const _IndexTile(this.label, this.value, this.subtitle, this.color, this.w);
  @override
  Widget build(BuildContext context) => Container(
    width: w, padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: color.withOpacity(0.06), borderRadius: BorderRadius.circular(10), border: Border.all(color: color.withOpacity(0.2))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
      const SizedBox(height: 4),
      Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
      Text(subtitle, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
    ]),
  );
}

class _EVMRow extends StatelessWidget {
  final String label, currency;
  final double value;
  final bool highlight;
  const _EVMRow(this.label, this.value, this.currency, {this.highlight = false});
  @override
  Widget build(BuildContext context) {
    final color = highlight ? (value >= 0 ? AppTheme.green : AppTheme.red) : AppTheme.textPrimary;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        Expanded(child: Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
        Text('$currency ${value.abs().toStringAsFixed(0)}${value < 0 ? ' (unfav)' : ''}',
            style: TextStyle(fontSize: 12, fontWeight: highlight ? FontWeight.w700 : FontWeight.w500, color: color)),
      ]),
    );
  }
}

// ── Burndown Tab ──────────────────────────────────────────────────────────────

class _BurndownTab extends StatelessWidget {
  final Map<String, dynamic> data;
  const _BurndownTab({required this.data});

  @override
  Widget build(BuildContext context) {
    final burndownData = (data['burndownData'] as List? ?? []);
    final totalTasks = (data['totalTasks'] ?? 0).toInt();
    if (burndownData.isEmpty) return _empty('No burndown data available');

    // Sample every N points to keep chart readable
    final step = (burndownData.length / 10).ceil().clamp(1, 999);
    final points = <Map<String, dynamic>>[];
    for (int i = 0; i < burndownData.length; i += step) {
      points.add(burndownData[i]);
    }
    if (points.last != burndownData.last) points.add(burndownData.last);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Text('Burndown Chart', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            const Spacer(),
            Text('$totalTasks tasks', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
          ]),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: _BurndownChart(points: points, totalTasks: totalTasks),
          ),
          const SizedBox(height: 12),
          Row(children: [
            _Legend('Ideal', AppTheme.blue),
            const SizedBox(width: 16),
            _Legend('Actual', AppTheme.red),
          ]),
        ])),
        const SizedBox(height: 12),
        _Card(child: Column(children: [
          ...points.take(8).map((p) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(children: [
              SizedBox(width: 80, child: Text(p['date']?.toString().substring(5) ?? '', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary))),
              Expanded(child: Row(children: [
                _MiniBar((p['completed'] ?? 0).toInt(), totalTasks, AppTheme.green),
              ])),
              SizedBox(width: 40, child: Text('${p['actual'] ?? 0} left', style: const TextStyle(fontSize: 11), textAlign: TextAlign.right)),
            ]),
          )),
        ])),
      ]),
    );
  }
}

class _BurndownChart extends StatelessWidget {
  final List<Map<String, dynamic>> points;
  final int totalTasks;
  const _BurndownChart({required this.points, required this.totalTasks});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _BurndownPainter(points: points, totalTasks: totalTasks),
      child: const SizedBox.expand(),
    );
  }
}

class _BurndownPainter extends CustomPainter {
  final List<Map<String, dynamic>> points;
  final int totalTasks;
  const _BurndownPainter({required this.points, required this.totalTasks});

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty || totalTasks == 0) return;
    final idealPaint = Paint()..color = AppTheme.blue.withOpacity(0.6)..strokeWidth = 1.5..style = PaintingStyle.stroke;
    final actualPaint = Paint()..color = AppTheme.red..strokeWidth = 2..style = PaintingStyle.stroke;
    final gridPaint = Paint()..color = AppTheme.border..strokeWidth = 0.5;

    // Grid
    for (int i = 0; i <= 4; i++) {
      final y = size.height * i / 4;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    final n = points.length;
    Offset? prevIdeal, prevActual;
    for (int i = 0; i < n; i++) {
      final x = size.width * i / (n - 1);
      final ideal = (points[i]['ideal'] ?? 0).toDouble();
      final actual = (points[i]['actual'] ?? 0).toDouble();
      final iy = size.height * (1 - ideal / totalTasks);
      final ay = size.height * (1 - actual / totalTasks);
      final io = Offset(x, iy.clamp(0, size.height));
      final ao = Offset(x, ay.clamp(0, size.height));
      if (prevIdeal != null) canvas.drawLine(prevIdeal, io, idealPaint);
      if (prevActual != null) canvas.drawLine(prevActual, ao, actualPaint);
      prevIdeal = io; prevActual = ao;
    }
  }

  @override
  bool shouldRepaint(_) => false;
}

// ── Velocity Tab ──────────────────────────────────────────────────────────────

class _VelocityTab extends StatelessWidget {
  final Map<String, dynamic> data;
  const _VelocityTab({required this.data});

  @override
  Widget build(BuildContext context) {
    final velocityData = (data['velocityData'] as List? ?? []);
    final avg = (data['avgVelocity'] ?? 0.0).toDouble();
    final total = (data['totalCompleted'] ?? 0).toInt();
    if (velocityData.isEmpty) return _empty('No velocity data yet');

    final maxV = velocityData.fold(0.0, (m, v) => (v['velocity'] ?? 0.0).toDouble() > m ? (v['velocity'] ?? 0.0).toDouble() : m);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        LayoutBuilder(builder: (_, c) {
          final w = (c.maxWidth - 10) / 2;
          return Row(children: [
            _IndexTile('Avg Velocity', avg.toStringAsFixed(1), 'hrs/week', AppTheme.blue, w),
            const SizedBox(width: 10),
            _IndexTile('Completed', '$total', 'total tasks', AppTheme.green, w),
          ]);
        }),
        const SizedBox(height: 12),
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Weekly Velocity', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          ...velocityData.map((v) {
            final week = v['week']?.toString().substring(5) ?? '';
            final vel = (v['velocity'] ?? 0.0).toDouble();
            final tasks = (v['tasksCompleted'] ?? 0).toInt();
            final pct = maxV > 0 ? vel / maxV : 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(children: [
                SizedBox(width: 52, child: Text(week, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary))),
                Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(value: pct, minHeight: 18, backgroundColor: AppTheme.border,
                        valueColor: const AlwaysStoppedAnimation(AppTheme.blue)))),
                const SizedBox(width: 8),
                SizedBox(width: 60, child: Text('${vel.toStringAsFixed(0)}h · $tasks tasks',
                    style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary), textAlign: TextAlign.right)),
              ]),
            );
          }),
        ])),
      ]),
    );
  }
}

// ── Resources Tab ─────────────────────────────────────────────────────────────

class _ResourcesTab extends StatelessWidget {
  final Map<String, dynamic> data;
  const _ResourcesTab({required this.data});

  @override
  Widget build(BuildContext context) {
    final utilData = (data['utilizationData'] as List? ?? []);
    final teamSize = (data['teamSize'] ?? 0).toInt();
    if (utilData.isEmpty) return _empty('No resource data available');

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _Card(child: Row(children: [
          const Icon(Icons.group_outlined, size: 16, color: AppTheme.primary),
          const SizedBox(width: 8),
          Text('Team Size: $teamSize', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ])),
        const SizedBox(height: 10),
        ...utilData.map((u) {
          final user = u['user'];
          final name = user is Map ? '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim() : 'Unknown';
          final total = (u['totalTasks'] ?? 0).toInt();
          final done = (u['completedTasks'] ?? 0).toInt();
          final inProg = (u['inProgressTasks'] ?? 0).toInt();
          final util = (u['utilizationRate'] ?? 0.0).toDouble().clamp(0.0, 200.0);
          final comp = (u['completionRate'] ?? 0.0).toDouble().clamp(0.0, 100.0);
          final initials = name.isNotEmpty ? name[0].toUpperCase() : '?';
          return _Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                CircleAvatar(radius: 14, backgroundColor: AppTheme.primary.withOpacity(0.1),
                    child: Text(initials, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.primary))),
                const SizedBox(width: 8),
                Expanded(child: Text(name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
                Text('$total tasks', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
              ]),
              const SizedBox(height: 10),
              _ResRow('Completion', comp / 100, '${comp.toStringAsFixed(0)}%', AppTheme.green),
              const SizedBox(height: 6),
              _ResRow('Utilization', (util / 100).clamp(0, 1), '${util.toStringAsFixed(0)}%',
                  util > 100 ? AppTheme.red : AppTheme.blue),
              const SizedBox(height: 6),
              Row(children: [
                _MiniChip('Done: $done', AppTheme.green),
                const SizedBox(width: 6),
                _MiniChip('Active: $inProg', AppTheme.blue),
                const SizedBox(width: 6),
                _MiniChip('Remaining: ${total - done - inProg}', AppTheme.textSecondary),
              ]),
            ]),
          );
        }),
      ]),
    );
  }
}

class _ResRow extends StatelessWidget {
  final String label, valueLabel;
  final double value;
  final Color color;
  const _ResRow(this.label, this.value, this.valueLabel, this.color);
  @override
  Widget build(BuildContext context) => Row(children: [
    SizedBox(width: 80, child: Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary))),
    Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(3),
        child: LinearProgressIndicator(value: value, minHeight: 6, backgroundColor: AppTheme.border,
            valueColor: AlwaysStoppedAnimation(color)))),
    const SizedBox(width: 8),
    Text(valueLabel, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
  ]);
}

// ── Shared ────────────────────────────────────────────────────────────────────

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

class _Legend extends StatelessWidget {
  final String label; final Color color;
  const _Legend(this.label, this.color);
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
    Container(width: 16, height: 3, color: color),
    const SizedBox(width: 4),
    Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
  ]);
}

class _MiniBar extends StatelessWidget {
  final int value, total;
  final Color color;
  const _MiniBar(this.value, this.total, this.color);
  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(3),
    child: LinearProgressIndicator(value: total > 0 ? value / total : 0, minHeight: 6,
        backgroundColor: AppTheme.border, valueColor: AlwaysStoppedAnimation(color)),
  );
}

class _MiniChip extends StatelessWidget {
  final String label; final Color color;
  const _MiniChip(this.label, this.color);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
    decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: TextStyle(fontSize: 10, color: color)),
  );
}

Widget _empty(String msg) => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
  const Icon(Icons.bar_chart_outlined, size: 48, color: AppTheme.textMuted),
  const SizedBox(height: 12),
  Text(msg, style: const TextStyle(color: AppTheme.textSecondary)),
]));
