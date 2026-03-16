import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/project_budget_service.dart';
import 'budget_form_screen.dart';

class BudgetDetailScreen extends StatefulWidget {
  final Budget budget;
  const BudgetDetailScreen({super.key, required this.budget});
  @override
  State<BudgetDetailScreen> createState() => _BudgetDetailScreenState();
}

class _BudgetDetailScreenState extends State<BudgetDetailScreen>
    with SingleTickerProviderStateMixin {
  final _svc = BudgetService();
  late TabController _tabs;
  Budget? _budget;
  Map<String, dynamic> _tracking = {};
  bool _loading = true;
  bool _changed = false;

  @override
  void initState() {
    super.initState();
    _budget = widget.budget;
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
        _svc.getById(widget.budget.id),
        _svc.getTracking(widget.budget.id),
      ]);
      if (mounted) {
        setState(() {
          _budget = (results[0] as Budget?) ?? _budget;
          _tracking = results[1] as Map<String, dynamic>;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _doAction(String action) async {
    try {
      await _svc.action(widget.budget.id, action);
      _changed = true;
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Color _sc(String s) => switch (s) {
        'approved' || 'active' => AppTheme.green,
        'pending' => AppTheme.amber,
        'rejected' => AppTheme.red,
        'closed' => AppTheme.textSecondary,
        _ => AppTheme.blue,
      };

  @override
  Widget build(BuildContext context) {
    final b = _budget!;
    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (_, _) {
        if (_changed) Navigator.of(context).pop(true);
      },
      child: Scaffold(
        backgroundColor: AppTheme.bg,
        appBar: AppBar(
          title: Text(b.displayName, overflow: TextOverflow.ellipsis),
          actions: [
            IconButton(
                icon: const Icon(Icons.refresh_outlined), onPressed: _load),
            if (b.status == 'draft' || b.status == 'rejected')
              IconButton(
                icon: const Icon(Icons.edit_outlined),
                tooltip: 'Edit',
                onPressed: () async {
                  final saved = await Navigator.push<bool>(
                    context,
                    MaterialPageRoute(
                        builder: (_) => BudgetFormScreen(existing: b)),
                  );
                  if (saved == true) {
                    _changed = true;
                    _load();
                  }
                },
              ),
          ],
          bottom: TabBar(
            controller: _tabs,
            labelColor: AppTheme.primary,
            unselectedLabelColor: AppTheme.textSecondary,
            indicatorColor: AppTheme.primary,
            indicatorSize: TabBarIndicatorSize.label,
            labelStyle:
                const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            tabs: const [
              Tab(text: 'Overview'),
              Tab(text: 'Categories'),
              Tab(text: 'Approvals'),
              Tab(text: 'Tracking'),
            ],
          ),
        ),
        body: _loading
            ? const Center(
                child: CircularProgressIndicator(color: AppTheme.primary))
            : TabBarView(controller: _tabs, children: [
                _OverviewTab(budget: b, statusColor: _sc, onAction: _doAction),
                _CategoriesTab(budget: b),
                _ApprovalsTab(budget: b, statusColor: _sc),
                _TrackingTab(tracking: _tracking, budget: b),
              ]),
      ),
    );
  }
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

class _OverviewTab extends StatelessWidget {
  final Budget budget;
  final Color Function(String) statusColor;
  final void Function(String) onAction;
  const _OverviewTab(
      {required this.budget,
      required this.statusColor,
      required this.onAction});

  @override
  Widget build(BuildContext context) {
    final b = budget;
    final util = b.totalBudget > 0
        ? (b.actualSpent / b.totalBudget).clamp(0.0, 1.0)
        : 0.0;
    final sc = statusColor(b.status);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Status row + workflow actions
        Row(children: [
          _Badge(b.status.toUpperCase(), sc),
          const SizedBox(width: 8),
          _Tag(b.budgetType, AppTheme.blue),
          const SizedBox(width: 6),
          _Tag('FY${b.fiscalYear} ${b.fiscalPeriod}', AppTheme.textSecondary),
          const Spacer(),
          ..._workflowButtons(b.status, onAction),
        ]),
        const SizedBox(height: 14),
        // Summary tiles
        LayoutBuilder(builder: (_, c) {
          final cols = c.maxWidth < 360 ? 2 : 3;
          final gap = (cols - 1) * 10.0;
          final w = (c.maxWidth - gap) / cols;
          if (cols == 2) {
            return Column(children: [
              Row(children: [
                _BTile('Total', '${b.currency} ${_fmt(b.totalBudget)}',
                    AppTheme.blue, w),
                const SizedBox(width: 10),
                _BTile('Spent', '${b.currency} ${_fmt(b.actualSpent)}',
                    AppTheme.red, w),
              ]),
              const SizedBox(height: 10),
              _BTile(
                  'Remaining',
                  '${b.currency} ${_fmt(b.remainingBudget)}',
                  b.remainingBudget < 0 ? AppTheme.red : AppTheme.green,
                  double.infinity),
            ]);
          }
          return Row(children: [
            _BTile('Total', '${b.currency} ${_fmt(b.totalBudget)}',
                AppTheme.blue, w),
            const SizedBox(width: 10),
            _BTile('Spent', '${b.currency} ${_fmt(b.actualSpent)}',
                AppTheme.red, w),
            const SizedBox(width: 10),
            _BTile(
                'Remaining',
                '${b.currency} ${_fmt(b.remainingBudget)}',
                b.remainingBudget < 0 ? AppTheme.red : AppTheme.green,
                w),
          ]);
        }),
        const SizedBox(height: 12),
        // Utilization
        _Card(
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text('Utilization',
                    style:
                        TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                Text('${(util * 100).toStringAsFixed(1)}%',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: util > 0.9
                            ? AppTheme.red
                            : util > 0.7
                                ? AppTheme.amber
                                : AppTheme.primary)),
              ]),
              const SizedBox(height: 8),
              ClipRRect(
                  borderRadius: BorderRadius.circular(5),
                  child: LinearProgressIndicator(
                      value: util,
                      minHeight: 10,
                      backgroundColor: AppTheme.border,
                      valueColor: AlwaysStoppedAnimation(util > 0.9
                          ? AppTheme.red
                          : util > 0.7
                              ? AppTheme.amber
                              : AppTheme.primary))),
              const SizedBox(height: 8),
              Text(
                  util > 0.9
                      ? 'Critical — over 90% utilized'
                      : util > 0.7
                          ? 'Warning — over 70% utilized'
                          : 'Healthy utilization',
                  style: TextStyle(
                      fontSize: 11,
                      color: util > 0.9
                          ? AppTheme.red
                          : util > 0.7
                              ? AppTheme.amber
                              : AppTheme.green)),
            ])),
        const SizedBox(height: 12),
        // Meta info
        _Card(
            child: Column(children: [
          _InfoRow('Budget Name', b.displayName),
          _InfoRow('Type', b.budgetType),
          _InfoRow('Fiscal Year', b.fiscalYear.toString()),
          _InfoRow('Period', b.fiscalPeriod),
          _InfoRow('Currency', b.currency),
          _InfoRow('Created', AppTheme.fmtDate(b.createdAt)),
          if (b.projectName?.isNotEmpty == true)
            _InfoRow('Project', b.projectName!),
          if (b.departmentName?.isNotEmpty == true)
            _InfoRow('Department', b.departmentName!),
        ])),
      ]),
    );
  }

  List<Widget> _workflowButtons(
      String status, void Function(String) onAction) {
    return switch (status) {
      'draft' => [_ActionBtn('Submit', AppTheme.blue, () => onAction('submit'))],
      'pending' => [
          _ActionBtn('Approve', AppTheme.green, () => onAction('approve')),
          const SizedBox(width: 6),
          _ActionBtn('Reject', AppTheme.red, () => onAction('reject')),
        ],
      'approved' => [
          _ActionBtn('Revoke', AppTheme.amber, () => onAction('unapprove'))
        ],
      'rejected' => [
          _ActionBtn('Reset', AppTheme.blue, () => onAction('unreject'))
        ],
      _ => [],
    };
  }
}

// ── Categories Tab ────────────────────────────────────────────────────────────

class _CategoriesTab extends StatelessWidget {
  final Budget budget;
  const _CategoriesTab({required this.budget});

  @override
  Widget build(BuildContext context) {
    final cats = budget.categories;
    if (cats.isEmpty) return _empty('No categories defined');
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: cats.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (_, i) {
        final cat = cats[i];
        final util =
            cat.allocated > 0 ? (cat.spent / cat.allocated).clamp(0.0, 1.0) : 0.0;
        return _Card(
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
              Row(children: [
                Expanded(
                    child: Text(cat.name,
                        style: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w600))),
                _Tag(cat.type, AppTheme.textSecondary),
              ]),
              const SizedBox(height: 8),
              Row(children: [
                Expanded(
                    child: Text(
                        'Allocated: ${budget.currency} ${_fmt(cat.allocated)}',
                        style: const TextStyle(
                            fontSize: 11, color: AppTheme.textSecondary))),
                Text('Spent: ${budget.currency} ${_fmt(cat.spent)}',
                    style: const TextStyle(
                        fontSize: 11, color: AppTheme.textSecondary)),
              ]),
              const SizedBox(height: 6),
              ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                      value: util,
                      minHeight: 6,
                      backgroundColor: AppTheme.border,
                      valueColor: AlwaysStoppedAnimation(
                          util > 0.9 ? AppTheme.red : AppTheme.primary))),
              const SizedBox(height: 4),
              Text('${(util * 100).toStringAsFixed(0)}% utilized',
                  style: TextStyle(
                      fontSize: 10,
                      color:
                          util > 0.9 ? AppTheme.red : AppTheme.textSecondary)),
            ]));
      },
    );
  }
}

// ── Approvals Tab ─────────────────────────────────────────────────────────────

class _ApprovalsTab extends StatelessWidget {
  final Budget budget;
  final Color Function(String) statusColor;
  const _ApprovalsTab({required this.budget, required this.statusColor});

  @override
  Widget build(BuildContext context) {
    final approvals = budget.approvals;
    if (approvals.isEmpty) return _empty('No approval history');
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: approvals.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final a = approvals[i];
        final sc = statusColor(a.status);
        return _Card(
            child: Row(children: [
          Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                  color: sc.withOpacity(0.1), shape: BoxShape.circle),
              child: Icon(_approvalIcon(a.status), color: sc, size: 16)),
          const SizedBox(width: 10),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Row(children: [
                  Text(
                      a.userName.isNotEmpty ? a.userName : 'System',
                      style: const TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w600)),
                  const Spacer(),
                  if (a.approvedAt != null)
                    Text(AppTheme.fmtDate(a.approvedAt!),
                        style: const TextStyle(
                            fontSize: 10, color: AppTheme.textSecondary)),
                ]),
                Text(a.status,
                    style: TextStyle(
                        fontSize: 11,
                        color: sc,
                        fontWeight: FontWeight.w500)),
                if (a.comments?.isNotEmpty == true)
                  Text(a.comments!,
                      style: const TextStyle(
                          fontSize: 11, color: AppTheme.textSecondary)),
              ])),
        ]));
      },
    );
  }
}

// ── Tracking Tab ──────────────────────────────────────────────────────────────

class _TrackingTab extends StatelessWidget {
  final Map<String, dynamic> tracking;
  final Budget budget;
  const _TrackingTab({required this.tracking, required this.budget});

  @override
  Widget build(BuildContext context) {
    if (tracking.isEmpty) return _empty('No tracking data available');
    final entries = tracking.entries
        .where((e) => e.value != null && e.value.toString().isNotEmpty)
        .toList();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _Card(
            child: Column(
                children: entries
                    .map((e) => _InfoRow(
                        _camelToLabel(e.key), e.value.toString()))
                    .toList())),
      ],
    );
  }

  String _camelToLabel(String key) {
    final result = key.replaceAllMapped(
        RegExp(r'([A-Z])'), (m) => ' ${m.group(0)}');
    return result[0].toUpperCase() + result.substring(1);
  }
}

// ── Shared helpers ────────────────────────────────────────────────────────────

IconData _approvalIcon(String s) => switch (s.toLowerCase()) {
      'approved' => Icons.check_circle_outline,
      'rejected' => Icons.cancel_outlined,
      'pending' => Icons.hourglass_empty_outlined,
      _ => Icons.history_outlined,
    };

class _ActionBtn extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onPressed;
  const _ActionBtn(this.label, this.color, this.onPressed);
  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onPressed,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
          decoration:
              BoxDecoration(color: color, borderRadius: BorderRadius.circular(20)),
          child: Text(label,
              style: const TextStyle(
                  fontSize: 11,
                  color: Colors.white,
                  fontWeight: FontWeight.w600)),
        ),
      );
}

class _BTile extends StatelessWidget {
  final String label, value;
  final Color color;
  final double w;
  const _BTile(this.label, this.value, this.color, this.w);
  @override
  Widget build(BuildContext context) => Container(
        width: w,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppTheme.border)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 10, color: AppTheme.textSecondary)),
          const SizedBox(height: 4),
          FittedBox(
              child: Text(value,
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: color))),
        ]),
      );
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});
  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.border)),
        child: child,
      );
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
            border: Border.all(color: color.withOpacity(0.3))),
        child: Text(label,
            style: TextStyle(
                fontSize: 10, fontWeight: FontWeight.w700, color: color)),
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
            borderRadius: BorderRadius.circular(4)),
        child: Text(label,
            style: TextStyle(
                fontSize: 10, color: color, fontWeight: FontWeight.w500)),
      );
}

class _InfoRow extends StatelessWidget {
  final String label, value;
  const _InfoRow(this.label, this.value);
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Row(children: [
          SizedBox(
              width: 110,
              child: Text(label,
                  style: const TextStyle(
                      fontSize: 12, color: AppTheme.textSecondary))),
          Expanded(
              child: Text(value,
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w500))),
        ]),
      );
}

Widget _empty(String msg) =>
    Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.account_balance_wallet_outlined,
          size: 48, color: AppTheme.textMuted),
      const SizedBox(height: 12),
      Text(msg,
          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
    ]));

String _fmt(double v) {
  if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(1)}M';
  if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
  return v.toStringAsFixed(0);
}
