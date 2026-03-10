import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../services/project_budget_service.dart';

class ProjectBudgetScreen extends StatefulWidget {
  final Project project;
  const ProjectBudgetScreen({super.key, required this.project});
  @override
  State<ProjectBudgetScreen> createState() => _ProjectBudgetScreenState();
}

class _ProjectBudgetScreenState extends State<ProjectBudgetScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  ProjectBudget? _budget;
  List<BudgetItem> _items = [];
  List<BudgetApproval> _approvals = [];
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
    try {
      final results = await Future.wait([
        ProjectBudgetService().getByProject(widget.project.id),
        ProjectBudgetDetailService().getDetail(widget.project.id),
      ]);
      _budget = results[0] as ProjectBudget?;
      final d = results[1] as ({List<BudgetItem> items, List<BudgetApproval> approvals});
      _items = d.items; _approvals = d.approvals;
    } catch (_) {}
    setState(() => _loading = false);
  }

  void _showBudgetForm(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => _BudgetFormSheet(
        project: widget.project,
        existing: _budget,
        onSaved: _load,
      ),
    );
  }

  Future<void> _submitAction(String budgetId, String action) async {
    try {
      await ProjectBudgetService().budgetAction(budgetId, action);
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Color _sc(String s) => switch (s) {
    'approved' => AppTheme.green, 'pending' => AppTheme.amber,
    'rejected' => AppTheme.red, _ => AppTheme.textSecondary,
  };

  @override
  Widget build(BuildContext context) {
    final wide = AppTheme.isWide(context);
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Text('Budget · ${widget.project.name}'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: _load),
          IconButton(
            icon: const Icon(Icons.add_outlined),
            tooltip: _budget == null ? 'Create Budget' : 'Edit Budget',
            onPressed: () => _showBudgetForm(context),
          ),
        ],
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppTheme.primary, unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          indicatorSize: wide ? TabBarIndicatorSize.tab : TabBarIndicatorSize.label,
          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          tabs: const [Tab(text: 'Overview'), Tab(text: 'Categories'), Tab(text: 'Items'), Tab(text: 'Approvals')],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : TabBarView(controller: _tabs, children: [
              _OverviewTab(budget: _budget, project: widget.project, statusColor: _sc, onAction: _submitAction),
              _CategoriesTab(budget: _budget, project: widget.project),
              _ItemsTab(items: _items, currency: _budget?.currency ?? widget.project.currency),
              _ApprovalsTab(approvals: _approvals, statusColor: _sc),
            ]),
    );
  }
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

class _OverviewTab extends StatelessWidget {
  final ProjectBudget? budget;
  final Project project;
  final Color Function(String) statusColor;
  final void Function(String, String) onAction;
  const _OverviewTab({required this.budget, required this.project, required this.statusColor, required this.onAction});

  @override
  Widget build(BuildContext context) {
    final b = budget;
    final total = b?.totalBudget ?? project.budget;
    final spent = b?.totalSpent ?? project.spentBudget;
    final remaining = total - spent;
    final currency = b?.currency ?? project.currency;
    final used = total > 0 ? (spent / total).clamp(0.0, 1.0) : 0.0;
    final status = b?.status ?? '';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Status + workflow actions
        if (status.isNotEmpty) ...[
          Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              decoration: BoxDecoration(
                color: statusColor(status).withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: statusColor(status).withOpacity(0.3)),
              ),
              child: Text(status.toUpperCase(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: statusColor(status))),
            ),
            const Spacer(),
            if (b != null) ..._workflowButtons(b, onAction),
          ]),
          const SizedBox(height: 12),
        ],
        // Summary tiles
        LayoutBuilder(builder: (_, c) {
          final w = c.maxWidth;
          final cols = w < 360 ? 2 : 3;
          final tw = (w - (cols - 1) * 10.0) / cols;
          if (cols == 2) {
            return Column(children: [
              Row(children: [
                _BTile('Total', '$currency ${total.toStringAsFixed(0)}', AppTheme.blue, tw),
                const SizedBox(width: 10),
                _BTile('Spent', '$currency ${spent.toStringAsFixed(0)}', AppTheme.red, tw),
              ]),
              const SizedBox(height: 10),
              _BTile('Left', '$currency ${remaining.toStringAsFixed(0)}', remaining < 0 ? AppTheme.red : AppTheme.green, double.infinity),
            ]);
          }
          return Row(children: [
            _BTile('Total', '$currency ${total.toStringAsFixed(0)}', AppTheme.blue, tw),
            const SizedBox(width: 10),
            _BTile('Spent', '$currency ${spent.toStringAsFixed(0)}', AppTheme.red, tw),
            const SizedBox(width: 10),
            _BTile('Left', '$currency ${remaining.toStringAsFixed(0)}', remaining < 0 ? AppTheme.red : AppTheme.green, tw),
          ]);
        }),
        const SizedBox(height: 12),
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Utilization', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            Text('${(used * 100).toStringAsFixed(1)}%',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: used > 0.9 ? AppTheme.red : AppTheme.primary)),
          ]),
          const SizedBox(height: 8),
          ClipRRect(borderRadius: BorderRadius.circular(5),
              child: LinearProgressIndicator(value: used, minHeight: 10, backgroundColor: AppTheme.border,
                  valueColor: AlwaysStoppedAnimation(used > 0.9 ? AppTheme.red : AppTheme.primary))),
          const SizedBox(height: 8),
          Row(children: [
            _MiniStat('Budget Health', used > 0.9 ? 'Critical' : used > 0.75 ? 'Warning' : 'Good',
                used > 0.9 ? AppTheme.red : used > 0.75 ? AppTheme.amber : AppTheme.green),
            const SizedBox(width: 16),
            _MiniStat('Variance', '$currency ${remaining.abs().toStringAsFixed(0)}',
                remaining >= 0 ? AppTheme.green : AppTheme.red),
          ]),
        ])),
      ]),
    );
  }

  List<Widget> _workflowButtons(ProjectBudget b, void Function(String, String) onAction) {
    return switch (b.status) {
      'draft' => [_ActionBtn('Submit', AppTheme.blue, () => onAction(b.id, 'submit'))],
      'pending' => [
        _ActionBtn('Approve', AppTheme.green, () => onAction(b.id, 'approve')),
        const SizedBox(width: 8),
        _ActionBtn('Reject', AppTheme.red, () => onAction(b.id, 'reject')),
      ],
      'approved' => [_ActionBtn('Revoke', AppTheme.amber, () => onAction(b.id, 'unapprove'))],
      'rejected' => [_ActionBtn('Reset', AppTheme.blue, () => onAction(b.id, 'unreject'))],
      _ => [],
    };
  }
}

class _ActionBtn extends StatelessWidget {
  final String label; final Color color; final VoidCallback onPressed;
  const _ActionBtn(this.label, this.color, this.onPressed);
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onPressed,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w600)),
    ),
  );
}

class _MiniStat extends StatelessWidget {
  final String label, value; final Color color;
  const _MiniStat(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
    Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
  ]);
}

// ── Categories Tab ────────────────────────────────────────────────────────────

class _CategoriesTab extends StatelessWidget {
  final ProjectBudget? budget;
  final Project project;
  const _CategoriesTab({required this.budget, required this.project});

  @override
  Widget build(BuildContext context) {
    final cats = budget?.categories ?? [];
    final currency = budget?.currency ?? project.currency;
    if (cats.isEmpty) return _empty('No budget categories');
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: cats.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, i) {
        final cat = cats[i];
        final used = cat.allocated > 0 ? (cat.spent / cat.allocated).clamp(0.0, 1.0) : 0.0;
        return _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(cat.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: AppTheme.bg, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppTheme.border)),
              child: Text(cat.type, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
            ),
          ]),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(child: Text('Allocated: $currency ${cat.allocated.toStringAsFixed(0)}',
                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary))),
            Text('Spent: $currency ${cat.spent.toStringAsFixed(0)}',
                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
          ]),
          const SizedBox(height: 6),
          ClipRRect(borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(value: used, minHeight: 6, backgroundColor: AppTheme.border,
                  valueColor: AlwaysStoppedAnimation(used > 0.9 ? AppTheme.red : AppTheme.primary))),
          const SizedBox(height: 4),
          Text('${(used * 100).toStringAsFixed(0)}% utilized',
              style: TextStyle(fontSize: 10, color: used > 0.9 ? AppTheme.red : AppTheme.textSecondary)),
        ]));
      },
    );
  }
}

// ── Items Tab ─────────────────────────────────────────────────────────────────

class _ItemsTab extends StatelessWidget {
  final List<BudgetItem> items;
  final String currency;
  const _ItemsTab({required this.items, required this.currency});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return _empty('No budget items');
    final grandTotal = items.fold(0.0, (s, i) => s + i.total);
    return Column(children: [
      Container(
        color: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(children: [
          const Expanded(flex: 3, child: Text('Item', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textSecondary))),
          const SizedBox(width: 8),
          const SizedBox(width: 40, child: Text('Qty', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textSecondary), textAlign: TextAlign.center)),
          const SizedBox(width: 8),
          const SizedBox(width: 60, child: Text('Unit', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textSecondary), textAlign: TextAlign.right)),
          const SizedBox(width: 8),
          const SizedBox(width: 70, child: Text('Total', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textSecondary), textAlign: TextAlign.right)),
        ]),
      ),
      const Divider(height: 1, color: AppTheme.border),
      Expanded(child: ListView.separated(
        itemCount: items.length + 1,
        separatorBuilder: (_, __) => const Divider(height: 1, color: AppTheme.border),
        itemBuilder: (_, i) {
          if (i == items.length) {
            return Container(
              color: AppTheme.primary.withOpacity(0.04),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(children: [
                const Expanded(flex: 3, child: Text('Grand Total', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700))),
                Expanded(child: Text('$currency ${grandTotal.toStringAsFixed(0)}',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primary), textAlign: TextAlign.right)),
              ]),
            );
          }
          final item = items[i];
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(children: [
              Expanded(flex: 3, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(item.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                if (item.type.isNotEmpty) Text(item.type, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
              ])),
              const SizedBox(width: 8),
              SizedBox(width: 40, child: Text(item.quantity.toStringAsFixed(item.quantity % 1 == 0 ? 0 : 1),
                  style: const TextStyle(fontSize: 12), textAlign: TextAlign.center)),
              const SizedBox(width: 8),
              SizedBox(width: 60, child: Text(item.unitCost.toStringAsFixed(0),
                  style: const TextStyle(fontSize: 12), textAlign: TextAlign.right)),
              const SizedBox(width: 8),
              SizedBox(width: 70, child: Text(item.total.toStringAsFixed(0),
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primary), textAlign: TextAlign.right)),
            ]),
          );
        },
      )),
    ]);
  }
}

// ── Approvals Tab ─────────────────────────────────────────────────────────────

class _ApprovalsTab extends StatelessWidget {
  final List<BudgetApproval> approvals;
  final Color Function(String) statusColor;
  const _ApprovalsTab({required this.approvals, required this.statusColor});

  @override
  Widget build(BuildContext context) {
    if (approvals.isEmpty) return _empty('No approval history');
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: approvals.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final a = approvals[i];
        return _Card(child: Row(children: [
          Container(
            width: 34, height: 34,
            decoration: BoxDecoration(color: statusColor(a.action).withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(_approvalIcon(a.action), color: statusColor(a.action), size: 16)),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Text(a.userName.isNotEmpty ? a.userName : 'System',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              const Spacer(),
              Text(AppTheme.fmtDate(a.createdAt), style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
            ]),
            if (a.action.isNotEmpty)
              Text(a.action, style: TextStyle(fontSize: 11, color: statusColor(a.action), fontWeight: FontWeight.w500)),
            if (a.comment.isNotEmpty)
              Text(a.comment, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
          ])),
        ]));
      },
    );
  }
}

IconData _approvalIcon(String a) => switch (a.toLowerCase()) {
  'approved' => Icons.check_circle_outline,
  'rejected' => Icons.cancel_outlined,
  'pending' => Icons.hourglass_empty_outlined,
  _ => Icons.history_outlined,
};

// ── Shared ────────────────────────────────────────────────────────────────────

class _BTile extends StatelessWidget {
  final String label, value; final Color color; final double w;
  const _BTile(this.label, this.value, this.color, this.w);
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
  final Widget child; final EdgeInsets? margin;
  const _Card({required this.child, this.margin});
  @override
  Widget build(BuildContext context) => Container(
    margin: margin,
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
    padding: const EdgeInsets.all(12),
    child: child,
  );
}

Widget _empty(String msg) => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
  const Icon(Icons.account_balance_wallet_outlined, size: 48, color: AppTheme.textMuted),
  const SizedBox(height: 12),
  Text(msg, style: const TextStyle(color: AppTheme.textSecondary)),
]));

// ── Budget Form Sheet ───────────────────────────────────────────────────────────────

class _BudgetFormSheet extends StatefulWidget {
  final dynamic project;
  final ProjectBudget? existing;
  final VoidCallback onSaved;
  const _BudgetFormSheet({required this.project, required this.existing, required this.onSaved});
  @override
  State<_BudgetFormSheet> createState() => _BudgetFormSheetState();
}

class _BudgetFormSheetState extends State<_BudgetFormSheet> {
  final _totalCtrl = TextEditingController();
  String _currency = 'USD';
  bool _saving = false;

  static const _currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD'];

  @override
  void initState() {
    super.initState();
    if (widget.existing != null) {
      _totalCtrl.text = widget.existing!.totalBudget.toStringAsFixed(0);
      _currency = widget.existing!.currency;
    } else {
      _currency = widget.project.currency ?? 'USD';
    }
  }

  @override
  void dispose() { _totalCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    final total = double.tryParse(_totalCtrl.text.trim());
    if (total == null || total <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a valid total budget')));
      return;
    }
    setState(() => _saving = true);
    try {
      final body = {'totalBudget': total, 'currency': _currency};
      final svc = ProjectBudgetService();
      if (widget.existing != null) {
        await svc.update(widget.existing!.id, body);
      } else {
        await svc.create(widget.project.id, body);
      }
      widget.onSaved();
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
    if (mounted) setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(context).viewInsets.bottom + 16),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(widget.existing != null ? 'Edit Budget' : 'Create Budget',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        const SizedBox(height: 16),
        TextField(
          controller: _totalCtrl,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Total Budget *', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: _currency,
          decoration: const InputDecoration(labelText: 'Currency', border: OutlineInputBorder()),
          items: _currencies.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
          onChanged: (v) => setState(() => _currency = v ?? _currency),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _saving ? null : _save,
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, foregroundColor: Colors.white),
            child: _saving
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text(widget.existing != null ? 'Update' : 'Create'),
          ),
        ),
      ]),
    );
  }
}
