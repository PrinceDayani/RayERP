import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../services/project_budget_service.dart';

class ProjectFinancialScreen extends StatefulWidget {
  final Project project;
  const ProjectFinancialScreen({super.key, required this.project});
  @override
  State<ProjectFinancialScreen> createState() => _ProjectFinancialScreenState();
}

class _ProjectFinancialScreenState extends State<ProjectFinancialScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  Map<String, dynamic> _perf = {}, _pl = {}, _cashFlow = {};
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
    final id = widget.project.id;
    final results = await Future.wait([
      ProjectAnalyticsService().getPerformanceIndices(id),
      ProjectFinanceService().fetchReport(id, 'pl'),
      ProjectFinanceService().fetchReport(id, 'cash-flow'),
    ]);
    _perf = results[0]; _pl = results[1]; _cashFlow = results[2];
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Text('Financial · ${widget.project.name}'),
        actions: [IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: _load)],
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppTheme.primary, unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary, indicatorSize: TabBarIndicatorSize.label,
          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          tabs: const [Tab(text: 'Utilization'), Tab(text: 'Profitability'), Tab(text: 'Cash Flow')],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : TabBarView(controller: _tabs, children: [
              _UtilizationTab(perf: _perf, project: widget.project),
              _ProfitabilityTab(pl: _pl, project: widget.project),
              _CashFlowTab(data: _cashFlow, project: widget.project),
            ]),
    );
  }
}

// ── Utilization Tab ───────────────────────────────────────────────────────────

class _UtilizationTab extends StatelessWidget {
  final Map<String, dynamic> perf;
  final Project project;
  const _UtilizationTab({required this.perf, required this.project});

  @override
  Widget build(BuildContext context) {
    final p = project;
    final pv = (perf['plannedValue'] ?? p.budget).toDouble();
    final ev = (perf['earnedValue'] ?? 0.0).toDouble();
    final ac = (perf['actualCost'] ?? p.spentBudget).toDouble();
    final cpi = (perf['cpi'] ?? 0.0).toDouble();
    final spi = (perf['spi'] ?? 0.0).toDouble();
    final budgetUsed = pv > 0 ? (ac / pv).clamp(0.0, 1.0) : 0.0;
    final roi = ac > 0 ? ((ev - ac) / ac * 100) : 0.0;
    final variance = pv - ac;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // KPI row
        LayoutBuilder(builder: (_, c) {
          final cols = c.maxWidth < 360 ? 2 : 4;
          final gap = (cols - 1) * 10.0;
          final w = (c.maxWidth - gap) / cols;
          final tiles = [
            _KPITile('Utilization', '${(budgetUsed * 100).toStringAsFixed(0)}%',
                budgetUsed > 0.9 ? AppTheme.red : AppTheme.primary, w),
            _KPITile('ROI', '${roi.toStringAsFixed(1)}%', roi >= 0 ? AppTheme.green : AppTheme.red, w),
            _KPITile('CPI', cpi.toStringAsFixed(2), cpi >= 1 ? AppTheme.green : AppTheme.red, w),
            _KPITile('SPI', spi.toStringAsFixed(2), spi >= 1 ? AppTheme.green : AppTheme.red, w),
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
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Budget vs Actual', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          _BudgetBar('Planned Value', pv, pv, p.currency, AppTheme.blue),
          const SizedBox(height: 8),
          _BudgetBar('Earned Value', ev, pv, p.currency, AppTheme.green),
          const SizedBox(height: 8),
          _BudgetBar('Actual Cost', ac, pv, p.currency, ac > pv ? AppTheme.red : AppTheme.amber),
        ])),
        const SizedBox(height: 12),
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Variance Analysis', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 10),
          _VRow('Cost Variance (CV)', (perf['costVariance'] ?? ev - ac).toDouble(), p.currency),
          _VRow('Schedule Variance (SV)', (perf['scheduleVariance'] ?? 0.0).toDouble(), p.currency),
          _VRow('Budget Variance', variance, p.currency),
        ])),
      ]),
    );
  }
}

class _KPITile extends StatelessWidget {
  final String label, value; final Color color; final double w;
  const _KPITile(this.label, this.value, this.color, this.w);
  @override
  Widget build(BuildContext context) => Container(
    width: w, padding: const EdgeInsets.all(8),
    decoration: BoxDecoration(color: color.withOpacity(0.06), borderRadius: BorderRadius.circular(8), border: Border.all(color: color.withOpacity(0.2))),
    child: Column(children: [
      FittedBox(child: Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: color))),
      Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary), textAlign: TextAlign.center),
    ]),
  );
}

class _BudgetBar extends StatelessWidget {
  final String label, currency; final double value, max; final Color color;
  const _BudgetBar(this.label, this.value, this.max, this.currency, this.color);
  @override
  Widget build(BuildContext context) => Row(children: [
    SizedBox(width: 90, child: Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary))),
    Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4),
        child: LinearProgressIndicator(value: max > 0 ? (value / max).clamp(0, 1) : 0, minHeight: 10,
            backgroundColor: AppTheme.border, valueColor: AlwaysStoppedAnimation(color)))),
    const SizedBox(width: 8),
    Text('$currency ${value.toStringAsFixed(0)}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
  ]);
}

class _VRow extends StatelessWidget {
  final String label, currency; final double value;
  const _VRow(this.label, this.value, this.currency);
  @override
  Widget build(BuildContext context) {
    final color = value >= 0 ? AppTheme.green : AppTheme.red;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(children: [
        Expanded(child: Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
        Icon(value >= 0 ? Icons.arrow_upward : Icons.arrow_downward, size: 12, color: color),
        const SizedBox(width: 4),
        Text('$currency ${value.abs().toStringAsFixed(0)}',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
      ]),
    );
  }
}

// ── Profitability Tab ─────────────────────────────────────────────────────────

class _ProfitabilityTab extends StatelessWidget {
  final Map<String, dynamic> pl;
  final Project project;
  const _ProfitabilityTab({required this.pl, required this.project});

  @override
  Widget build(BuildContext context) {
    if (pl.isEmpty) return _empty('No P&L data available');
    final rows = <Widget>[];
    pl.forEach((key, value) {
      if (value is Map<String, dynamic>) {
        rows.add(Padding(
          padding: const EdgeInsets.fromLTRB(0, 12, 0, 4),
          child: Text(_fmt(key), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
        ));
        value.forEach((k, v) => rows.add(_PLRow(label: _fmt(k), value: v)));
      } else {
        rows.add(_PLRow(label: _fmt(key), value: value,
            bold: key.toLowerCase().contains('total') || key.toLowerCase().contains('net') || key.toLowerCase().contains('profit')));
      }
    });
    return ListView(padding: const EdgeInsets.all(16), children: rows);
  }

  String _fmt(String k) => k.replaceAllMapped(RegExp(r'([A-Z])'), (m) => ' ${m[0]}').replaceAll('_', ' ').trim()
      .split(' ').map((w) => w.isEmpty ? '' : '${w[0].toUpperCase()}${w.substring(1)}').join(' ');
}

class _PLRow extends StatelessWidget {
  final String label; final dynamic value; final bool bold;
  const _PLRow({required this.label, required this.value, this.bold = false});
  @override
  Widget build(BuildContext context) {
    final isNum = value is num;
    final numVal = isNum ? (value as num).toDouble() : null;
    final color = numVal != null ? (numVal < 0 ? AppTheme.red : AppTheme.textPrimary) : AppTheme.textPrimary;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 12),
      decoration: BoxDecoration(
        color: bold ? AppTheme.primary.withOpacity(0.04) : Colors.white,
        border: Border(bottom: BorderSide(color: AppTheme.border)),
      ),
      child: Row(children: [
        Expanded(child: Text(label, style: TextStyle(fontSize: 12,
            fontWeight: bold ? FontWeight.w700 : FontWeight.normal, color: AppTheme.textSecondary))),
        Text(isNum ? (numVal! < 0 ? '-${numVal.abs().toStringAsFixed(2)}' : numVal.toStringAsFixed(2)) : value.toString(),
            style: TextStyle(fontSize: 12, fontWeight: bold ? FontWeight.w700 : FontWeight.w500, color: color)),
      ]),
    );
  }
}

// ── Cash Flow Tab ─────────────────────────────────────────────────────────────

class _CashFlowTab extends StatelessWidget {
  final Map<String, dynamic> data;
  final Project project;
  const _CashFlowTab({required this.data, required this.project});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return _empty('No cash flow data available');
    return _ProfitabilityTab(pl: data, project: project);
  }
}

// ── Shared ────────────────────────────────────────────────────────────────────

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

Widget _empty(String msg) => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
  const Icon(Icons.receipt_long_outlined, size: 48, color: AppTheme.textMuted),
  const SizedBox(height: 12),
  Text(msg, style: const TextStyle(color: AppTheme.textSecondary)),
]));
