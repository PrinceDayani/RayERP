import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../services/project_budget_service.dart';

class ProjectLedgerScreen extends StatefulWidget {
  final Project project;
  const ProjectLedgerScreen({super.key, required this.project});
  @override
  State<ProjectLedgerScreen> createState() => _ProjectLedgerScreenState();
}

class _ProjectLedgerScreenState extends State<ProjectLedgerScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  Map<String, dynamic> _dashboard = {}, _budgetActual = {}, _profitability = {};
  List<Map<String, dynamic>> _journal = [], _ledger = [];
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
    final id = widget.project.id;
    final svc = ProjectLedgerService();
    final results = await Future.wait([
      svc.getFinancialDashboard(id),
      svc.getJournalEntries(id),
      svc.getLedgerEntries(id),
      svc.getBudgetActual(id),
      svc.getProfitability(id),
    ]);
    _dashboard = results[0] as Map<String, dynamic>;
    _journal = results[1] as List<Map<String, dynamic>>;
    _ledger = results[2] as List<Map<String, dynamic>>;
    _budgetActual = results[3] as Map<String, dynamic>;
    _profitability = results[4] as Map<String, dynamic>;
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Text('Ledger · ${widget.project.name}'),
        actions: [IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: _load)],
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppTheme.primary, unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary, indicatorSize: TabBarIndicatorSize.label,
          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          tabs: const [Tab(text: 'Dashboard'), Tab(text: 'Journal'), Tab(text: 'Ledger'), Tab(text: 'Budget vs Actual')],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : TabBarView(controller: _tabs, children: [
              _DashboardTab(dashboard: _dashboard, profitability: _profitability, project: widget.project),
              _JournalTab(entries: _journal),
              _LedgerTab(entries: _ledger),
              _BudgetActualTab(data: _budgetActual, project: widget.project),
            ]),
    );
  }
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────

class _DashboardTab extends StatelessWidget {
  final Map<String, dynamic> dashboard, profitability;
  final Project project;
  const _DashboardTab({required this.dashboard, required this.profitability, required this.project});

  @override
  Widget build(BuildContext context) {
    final d = dashboard.isNotEmpty ? dashboard : profitability;
    if (d.isEmpty) return _empty('No financial dashboard data');
    final currency = project.currency;
    final revenue = (d['revenue'] ?? d['actualRevenue'] ?? 0).toDouble();
    final costs = (d['totalCosts'] ?? d['actualCost'] ?? 0).toDouble();
    final profit = (d['netProfit'] ?? d['actualProfit'] ?? revenue - costs).toDouble();
    final margin = (d['netMargin'] ?? d['grossMargin'] ?? 0).toDouble();
    final roi = (d['roi'] ?? 0).toDouble();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        LayoutBuilder(builder: (_, c) {
          final cols = c.maxWidth < 360 ? 2 : 4;
          final gap = (cols - 1) * 10.0;
          final w = (c.maxWidth - gap) / cols;
          final tiles = [
            _KTile('Revenue', '$currency ${revenue.toStringAsFixed(0)}', AppTheme.green, w),
            _KTile('Costs', '$currency ${costs.toStringAsFixed(0)}', AppTheme.red, w),
            _KTile('Profit', '$currency ${profit.toStringAsFixed(0)}', profit >= 0 ? AppTheme.green : AppTheme.red, w),
            _KTile('ROI', '${roi.toStringAsFixed(1)}%', roi >= 0 ? AppTheme.green : AppTheme.red, w),
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
          const Text('Margin', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(value: (margin / 100).clamp(0, 1), minHeight: 10,
                    backgroundColor: AppTheme.border,
                    valueColor: AlwaysStoppedAnimation(margin >= 0 ? AppTheme.green : AppTheme.red)))),
            const SizedBox(width: 10),
            Text('${margin.toStringAsFixed(1)}%',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
                    color: margin >= 0 ? AppTheme.green : AppTheme.red)),
          ]),
        ])),
        if (profitability['profitTrend'] != null) ...[ 
          const SizedBox(height: 12),
          _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Profit Trend', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            ...(profitability['profitTrend'] as List).map((pt) {
              final m = pt['month'] ?? '';
              final p = (pt['profit'] ?? 0).toDouble();
              final color = p >= 0 ? AppTheme.green : AppTheme.red;
              return Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(children: [
                  SizedBox(width: 60, child: Text(m, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary))),
                  Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(3),
                      child: LinearProgressIndicator(value: revenue > 0 ? (p.abs() / revenue).clamp(0, 1) : 0,
                          minHeight: 7, backgroundColor: AppTheme.border,
                          valueColor: AlwaysStoppedAnimation(color)))),
                  const SizedBox(width: 8),
                  Text('$currency ${p.toStringAsFixed(0)}',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
                ]),
              );
            }),
          ])),
        ],
      ]),
    );
  }
}

// ── Journal Tab ───────────────────────────────────────────────────────────────

class _JournalTab extends StatelessWidget {
  final List<Map<String, dynamic>> entries;
  const _JournalTab({required this.entries});

  Color _statusColor(String s) => switch (s) {
    'approved' => AppTheme.green, 'posted' => AppTheme.blue, _ => AppTheme.amber,
  };

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) return _empty('No journal entries');
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: entries.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final e = entries[i];
        final status = e['status'] ?? 'draft';
        final sc = _statusColor(status);
        final lines = (e['lines'] as List? ?? []);
        final totalDebit = (e['totalDebit'] ?? 0).toDouble();
        return Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.border)),
          padding: const EdgeInsets.all(12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(e['reference'] ?? e['entryNumber'] ?? '',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(color: sc.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                child: Text(status, style: TextStyle(fontSize: 10, color: sc, fontWeight: FontWeight.w600))),
            ]),
            if ((e['description'] ?? '').isNotEmpty) ...[ 
              const SizedBox(height: 4),
              Text(e['description'], style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
            ],
            const SizedBox(height: 6),
            Row(children: [
              Text(_fmtDate(e['date']), style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
              const Spacer(),
              Text('Dr: ${totalDebit.toStringAsFixed(0)}',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.blue)),
            ]),
            if (lines.isNotEmpty) ...[ 
              const SizedBox(height: 6),
              const Divider(height: 1, color: AppTheme.border),
              const SizedBox(height: 6),
              ...lines.take(3).map((l) => Padding(
                padding: const EdgeInsets.only(bottom: 3),
                child: Row(children: [
                  Expanded(child: Text(l['accountName'] ?? l['accountCode'] ?? '',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary))),
                  if ((l['debit'] ?? 0) > 0)
                    Text('Dr ${(l['debit'] as num).toStringAsFixed(0)}',
                        style: const TextStyle(fontSize: 11, color: AppTheme.blue)),
                  if ((l['credit'] ?? 0) > 0)
                    Text('Cr ${(l['credit'] as num).toStringAsFixed(0)}',
                        style: const TextStyle(fontSize: 11, color: AppTheme.green)),
                ]),
              )),
              if (lines.length > 3)
                Text('+${lines.length - 3} more lines',
                    style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
            ],
          ]),
        );
      },
    );
  }
}

// ── Ledger Tab ────────────────────────────────────────────────────────────────

class _LedgerTab extends StatelessWidget {
  final List<Map<String, dynamic>> entries;
  const _LedgerTab({required this.entries});

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) return _empty('No ledger entries');
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: entries.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final e = entries[i];
        final debit = (e['debit'] ?? 0).toDouble();
        final credit = (e['credit'] ?? 0).toDouble();
        final balance = (e['balance'] ?? debit - credit).toDouble();
        return Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.border)),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(e['accountName'] ?? e['accountCode'] ?? '',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              Text(_fmtDate(e['date']), style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
            ])),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              if (debit > 0) Text('Dr ${debit.toStringAsFixed(0)}',
                  style: const TextStyle(fontSize: 11, color: AppTheme.blue, fontWeight: FontWeight.w500)),
              if (credit > 0) Text('Cr ${credit.toStringAsFixed(0)}',
                  style: const TextStyle(fontSize: 11, color: AppTheme.green, fontWeight: FontWeight.w500)),
              Text('Bal ${balance.toStringAsFixed(0)}',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
                      color: balance >= 0 ? AppTheme.textPrimary : AppTheme.red)),
            ]),
          ]),
        );
      },
    );
  }
}

// ── Budget vs Actual Tab ──────────────────────────────────────────────────────

class _BudgetActualTab extends StatelessWidget {
  final Map<String, dynamic> data;
  final Project project;
  const _BudgetActualTab({required this.data, required this.project});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return _empty('No budget vs actual data');
    final currency = project.currency;
    final budgetedCost = (data['budgetedCost'] ?? 0).toDouble();
    final actualCost = (data['actualCost'] ?? 0).toDouble();
    final variance = (data['variance'] ?? budgetedCost - actualCost).toDouble();
    final utilization = (data['utilizationPercent'] ?? 0).toDouble();
    final categories = (data['categories'] as List? ?? []);
    final alerts = (data['alerts'] as List? ?? []);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        LayoutBuilder(builder: (_, c) {
          final cols = c.maxWidth < 360 ? 2 : 3;
          final gap = (cols - 1) * 10.0;
          final w = (c.maxWidth - gap) / cols;
          if (cols == 2) {
            return Column(children: [
              Row(children: [
                _KTile('Budgeted', '$currency ${budgetedCost.toStringAsFixed(0)}', AppTheme.blue, w),
                const SizedBox(width: 10),
                _KTile('Actual', '$currency ${actualCost.toStringAsFixed(0)}', AppTheme.amber, w),
              ]),
              const SizedBox(height: 10),
              _KTile('Variance', '$currency ${variance.abs().toStringAsFixed(0)}',
                  variance >= 0 ? AppTheme.green : AppTheme.red, double.infinity),
            ]);
          }
          return Row(children: [
            _KTile('Budgeted', '$currency ${budgetedCost.toStringAsFixed(0)}', AppTheme.blue, w),
            const SizedBox(width: 10),
            _KTile('Actual', '$currency ${actualCost.toStringAsFixed(0)}', AppTheme.amber, w),
            const SizedBox(width: 10),
            _KTile('Variance', '$currency ${variance.abs().toStringAsFixed(0)}',
                variance >= 0 ? AppTheme.green : AppTheme.red, w),
          ]);
        }),
        const SizedBox(height: 12),
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Utilization', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            Text('${utilization.toStringAsFixed(1)}%',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
                    color: utilization > 90 ? AppTheme.red : AppTheme.primary)),
          ]),
          const SizedBox(height: 8),
          ClipRRect(borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(value: (utilization / 100).clamp(0, 1), minHeight: 10,
                  backgroundColor: AppTheme.border,
                  valueColor: AlwaysStoppedAnimation(utilization > 90 ? AppTheme.red : AppTheme.primary))),
        ])),
        if (categories.isNotEmpty) ...[ 
          const SizedBox(height: 12),
          const Text('Categories', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          ...categories.map((cat) {
            final budgeted = (cat['budgeted'] ?? 0).toDouble();
            final actual = (cat['actual'] ?? 0).toDouble();
            final pct = budgeted > 0 ? (actual / budgeted).clamp(0.0, 1.0) : 0.0;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.border)),
              padding: const EdgeInsets.all(10),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(child: Text(cat['name'] ?? '', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600))),
                  Text('${(pct * 100).toStringAsFixed(0)}%',
                      style: TextStyle(fontSize: 11, color: pct > 0.9 ? AppTheme.red : AppTheme.textSecondary)),
                ]),
                const SizedBox(height: 6),
                ClipRRect(borderRadius: BorderRadius.circular(3),
                    child: LinearProgressIndicator(value: pct, minHeight: 6, backgroundColor: AppTheme.border,
                        valueColor: AlwaysStoppedAnimation(pct > 0.9 ? AppTheme.red : AppTheme.primary))),
                const SizedBox(height: 4),
                Row(children: [
                  Text('Budget: $currency ${budgeted.toStringAsFixed(0)}',
                      style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
                  const Spacer(),
                  Text('Actual: $currency ${actual.toStringAsFixed(0)}',
                      style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
                ]),
              ]),
            );
          }),
        ],
        if (alerts.isNotEmpty) ...[ 
          const SizedBox(height: 12),
          const Text('Alerts', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          ...alerts.map((a) {
            final isCritical = (a['type'] ?? '') == 'critical';
            final color = isCritical ? AppTheme.red : AppTheme.amber;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(color: color.withOpacity(0.05), borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: color.withOpacity(0.3))),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(children: [
                Icon(isCritical ? Icons.error_outline : Icons.warning_amber_outlined, size: 16, color: color),
                const SizedBox(width: 8),
                Expanded(child: Text(a['message'] ?? '', style: TextStyle(fontSize: 12, color: color))),
              ]),
            );
          }),
        ],
      ]),
    );
  }
}

// ── Shared ────────────────────────────────────────────────────────────────────

class _KTile extends StatelessWidget {
  final String label, value; final Color color; final double w;
  const _KTile(this.label, this.value, this.color, this.w);
  @override
  Widget build(BuildContext context) => Container(
    width: w, padding: const EdgeInsets.all(8),
    decoration: BoxDecoration(color: color.withOpacity(0.06), borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.2))),
    child: Column(children: [
      FittedBox(child: Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color))),
      Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary), textAlign: TextAlign.center),
    ]),
  );
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});
  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border)),
    padding: const EdgeInsets.all(12),
    child: child,
  );
}

Widget _empty(String msg) => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
  const Icon(Icons.account_balance_outlined, size: 48, color: AppTheme.textMuted),
  const SizedBox(height: 12),
  Text(msg, style: const TextStyle(color: AppTheme.textSecondary)),
]));

String _fmtDate(dynamic d) {
  if (d == null) return '';
  final dt = DateTime.tryParse(d.toString());
  if (dt == null) return d.toString();
  return '${dt.day}/${dt.month}/${dt.year}';
}
