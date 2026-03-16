import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/project_budget_service.dart';
import 'budget_detail_screen.dart';
import 'budget_form_screen.dart';

class BudgetListScreen extends StatefulWidget {
  const BudgetListScreen({super.key});
  @override
  State<BudgetListScreen> createState() => _BudgetListScreenState();
}

class _BudgetListScreenState extends State<BudgetListScreen> {
  final _svc = BudgetService();
  List<Budget> _budgets = [];
  BudgetSummary? _summary;
  bool _loading = true;
  String? _error;

  String _statusFilter = 'all';
  String _typeFilter = 'all';
  int _fiscalYear = DateTime.now().year;
  int _page = 1;
  int _totalPages = 1;

  static const _statuses = ['all', 'draft', 'pending', 'approved', 'rejected', 'active', 'closed'];
  static const _types = ['all', 'project', 'department', 'special'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool reset = false}) async {
    if (reset) _page = 1;
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([
        _svc.getAll(
          status: _statusFilter == 'all' ? null : _statusFilter,
          budgetType: _typeFilter == 'all' ? null : _typeFilter,
          fiscalYear: _fiscalYear,
          page: _page,
        ),
        _svc.getSummary(fiscalYear: _fiscalYear),
      ]);
      final r = results[0] as ({List<Budget> budgets, int total, int pages});
      if (mounted) {
        setState(() {
          _budgets = r.budgets;
          _totalPages = r.pages;
          _summary = results[1] as BudgetSummary?;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Color _statusColor(String s) => switch (s) {
    'approved' || 'active' => AppTheme.green,
    'pending' => AppTheme.amber,
    'rejected' => AppTheme.red,
    'closed' => AppTheme.textSecondary,
    _ => AppTheme.blue,
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Budgets'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: () => _load(reset: true)),
          IconButton(
            icon: const Icon(Icons.add_outlined),
            tooltip: 'New Budget',
            onPressed: () async {
              final created = await Navigator.push<bool>(
                context,
                MaterialPageRoute(builder: (_) => const BudgetFormScreen()),
              );
              if (created == true) _load(reset: true);
            },
          ),
        ],
      ),
      body: Column(children: [
        _FilterBar(
          statusFilter: _statusFilter,
          typeFilter: _typeFilter,
          fiscalYear: _fiscalYear,
          statuses: _statuses,
          types: _types,
          onStatusChanged: (v) { _statusFilter = v; _load(reset: true); },
          onTypeChanged: (v) { _typeFilter = v; _load(reset: true); },
          onYearChanged: (v) { _fiscalYear = v; _load(reset: true); },
        ),
        if (_summary != null) _SummaryBar(summary: _summary!),
        Expanded(child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
            : _error != null
                ? _ErrorView(error: _error!, onRetry: () => _load(reset: true))
                : _budgets.isEmpty
                    ? _Empty(onAdd: () async {
                        final created = await Navigator.push<bool>(
                          context,
                          MaterialPageRoute(builder: (_) => const BudgetFormScreen()),
                        );
                        if (created == true) _load(reset: true);
                      })
                    : RefreshIndicator(
                        onRefresh: () => _load(reset: true),
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _budgets.length + (_totalPages > 1 ? 1 : 0),
                          separatorBuilder: (_, _) => const SizedBox(height: 10),
                          itemBuilder: (_, i) {
                            if (i == _budgets.length) {
                              return _PaginationRow(
                                page: _page,
                                totalPages: _totalPages,
                                onPrev: _page > 1 ? () { _page--; _load(); } : null,
                                onNext: _page < _totalPages ? () { _page++; _load(); } : null,
                              );
                            }
                            return _BudgetCard(
                              budget: _budgets[i],
                              statusColor: _statusColor,
                              onTap: () async {
                                final changed = await Navigator.push<bool>(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => BudgetDetailScreen(budget: _budgets[i]),
                                  ),
                                );
                                if (changed == true) _load(reset: true);
                              },
                            );
                          },
                        ),
                      )),
      ]),
    );
  }
}

// ── Filter Bar ────────────────────────────────────────────────────────────────

class _FilterBar extends StatelessWidget {
  final String statusFilter, typeFilter;
  final int fiscalYear;
  final List<String> statuses, types;
  final ValueChanged<String> onStatusChanged, onTypeChanged;
  final ValueChanged<int> onYearChanged;

  const _FilterBar({
    required this.statusFilter, required this.typeFilter,
    required this.fiscalYear, required this.statuses, required this.types,
    required this.onStatusChanged, required this.onTypeChanged,
    required this.onYearChanged,
  });

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now().year;
    final years = List.generate(5, (i) => now - 2 + i);
    return Container(
      color: Theme.of(context).colorScheme.surface,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(children: [
          _Chip('Status', statusFilter, statuses, onStatusChanged),
          const SizedBox(width: 8),
          _Chip('Type', typeFilter, types, onTypeChanged),
          const SizedBox(width: 8),
          _Chip('Year', fiscalYear.toString(),
              years.map((y) => y.toString()).toList(),
              (v) => onYearChanged(int.parse(v))),
        ]),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label, value;
  final List<String> options;
  final ValueChanged<String> onChanged;
  const _Chip(this.label, this.value, this.options, this.onChanged);

  @override
  Widget build(BuildContext context) => PopupMenuButton<String>(
    onSelected: onChanged,
    itemBuilder: (_) => options
        .map((o) => PopupMenuItem(value: o, child: Text(o.toUpperCase())))
        .toList(),
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: value == 'all' || value == DateTime.now().year.toString()
            ? AppTheme.bg
            : AppTheme.primary.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: value == 'all' || value == DateTime.now().year.toString()
              ? AppTheme.border
              : AppTheme.primary.withOpacity(0.3),
        ),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text('$label: ${value.toUpperCase()}',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: value == 'all' ? AppTheme.textSecondary : AppTheme.primary,
            )),
        const SizedBox(width: 4),
        const Icon(Icons.arrow_drop_down, size: 14, color: AppTheme.textSecondary),
      ]),
    ),
  );
}

// ── Summary Bar ───────────────────────────────────────────────────────────────

class _SummaryBar extends StatelessWidget {
  final BudgetSummary summary;
  const _SummaryBar({required this.summary});

  @override
  Widget build(BuildContext context) {
    final util = summary.totalBudgetAmount > 0
        ? (summary.totalSpent / summary.totalBudgetAmount).clamp(0.0, 1.0)
        : 0.0;
    return Container(
      color: Theme.of(context).colorScheme.surface,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Divider(height: 1, color: AppTheme.border),
        const SizedBox(height: 10),
        Row(children: [
          _SumTile('Total', _fmt(summary.totalBudgetAmount), AppTheme.primary),
          const SizedBox(width: 12),
          _SumTile('Spent', _fmt(summary.totalSpent), AppTheme.red),
          const SizedBox(width: 12),
          _SumTile('Remaining', _fmt(summary.totalRemaining), AppTheme.green),
          const SizedBox(width: 12),
          _SumTile('Budgets', summary.totalBudgets.toString(), AppTheme.blue),
        ]),
        const SizedBox(height: 8),
        Row(children: [
          Expanded(child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: util,
              minHeight: 5,
              backgroundColor: AppTheme.border,
              valueColor: AlwaysStoppedAnimation(
                  util > 0.9 ? AppTheme.red : util > 0.7 ? AppTheme.amber : AppTheme.green),
            ),
          )),
          const SizedBox(width: 8),
          Text('${(util * 100).toStringAsFixed(1)}%',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: util > 0.9 ? AppTheme.red : util > 0.7 ? AppTheme.amber : AppTheme.green,
              )),
        ]),
      ]),
    );
  }
}

class _SumTile extends StatelessWidget {
  final String label, value;
  final Color color;
  const _SumTile(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textMuted)),
    Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
  ]);
}

// ── Budget Card ───────────────────────────────────────────────────────────────

class _BudgetCard extends StatelessWidget {
  final Budget budget;
  final Color Function(String) statusColor;
  final VoidCallback onTap;
  const _BudgetCard({required this.budget, required this.statusColor, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final util = budget.totalBudget > 0
        ? (budget.actualSpent / budget.totalBudget).clamp(0.0, 1.0)
        : 0.0;
    final sc = statusColor(budget.status);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(budget.displayName,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                maxLines: 1, overflow: TextOverflow.ellipsis)),
            const SizedBox(width: 8),
            _Badge(budget.status.toUpperCase(), sc),
          ]),
          const SizedBox(height: 4),
          Row(children: [
            _Tag(budget.budgetType, AppTheme.blue),
            const SizedBox(width: 6),
            _Tag('FY${budget.fiscalYear} ${budget.fiscalPeriod}', AppTheme.textSecondary),
          ]),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${budget.currency} ${_fmt(budget.totalBudget)}',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
              Text('Total Budget', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
            ])),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('${budget.currency} ${_fmt(budget.actualSpent)}',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
                      color: util > 0.9 ? AppTheme.red : AppTheme.textPrimary)),
              const Text('Spent', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
            ]),
          ]),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: util,
              minHeight: 6,
              backgroundColor: AppTheme.border,
              valueColor: AlwaysStoppedAnimation(
                  util > 0.9 ? AppTheme.red : util > 0.7 ? AppTheme.amber : AppTheme.primary),
            ),
          ),
          const SizedBox(height: 4),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('${(util * 100).toStringAsFixed(1)}% utilized',
                style: TextStyle(fontSize: 10,
                    color: util > 0.9 ? AppTheme.red : AppTheme.textMuted)),
            Text('${budget.currency} ${_fmt(budget.remainingBudget)} left',
                style: TextStyle(fontSize: 10,
                    color: budget.remainingBudget < 0 ? AppTheme.red : AppTheme.textMuted)),
          ]),
        ]),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color color;
  const _Badge(this.label, this.color);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: color.withOpacity(0.1),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: color.withOpacity(0.3)),
    ),
    child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
  );
}

class _Tag extends StatelessWidget {
  final String label;
  final Color color;
  const _Tag(this.label, this.color);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
    decoration: BoxDecoration(
      color: color.withOpacity(0.08),
      borderRadius: BorderRadius.circular(4),
    ),
    child: Text(label, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w500)),
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

class _PaginationRow extends StatelessWidget {
  final int page, totalPages;
  final VoidCallback? onPrev, onNext;
  const _PaginationRow({required this.page, required this.totalPages, this.onPrev, this.onNext});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
      IconButton(
        icon: const Icon(Icons.chevron_left),
        onPressed: onPrev,
        color: onPrev != null ? AppTheme.primary : AppTheme.textMuted,
      ),
      Text('$page / $totalPages', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
      IconButton(
        icon: const Icon(Icons.chevron_right),
        onPressed: onNext,
        color: onNext != null ? AppTheme.primary : AppTheme.textMuted,
      ),
    ]),
  );
}

// ── Empty / Error ─────────────────────────────────────────────────────────────

class _Empty extends StatelessWidget {
  final VoidCallback onAdd;
  const _Empty({required this.onAdd});
  @override
  Widget build(BuildContext context) => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
    const Icon(Icons.account_balance_wallet_outlined, size: 52, color: AppTheme.textMuted),
    const SizedBox(height: 12),
    const Text('No budgets found', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
    const SizedBox(height: 4),
    const Text('Create your first budget to get started',
        style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
    const SizedBox(height: 16),
    ElevatedButton.icon(
      onPressed: onAdd,
      icon: const Icon(Icons.add, size: 16),
      label: const Text('New Budget'),
    ),
  ]));
}

class _ErrorView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _ErrorView({required this.error, required this.onRetry});
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

String _fmt(double v) {
  if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(1)}M';
  if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
  return v.toStringAsFixed(0);
}
