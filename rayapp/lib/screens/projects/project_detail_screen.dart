import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../models/task.dart';
import '../../services/project_service.dart';
import '../../services/project_budget_service.dart';
import '../../services/task_service.dart';
import 'project_form_screen.dart';
import '../tasks/task_list_screen.dart';
import '../tasks/task_kanban_screen.dart';


class ProjectDetailScreen extends StatefulWidget {
  final String id;
  const ProjectDetailScreen({super.key, required this.id});
  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  Project? _project;
  List<ProjectMilestone> _milestones = [];
  List<ProjectRisk> _risks = [];
  bool _loading = true;
  String? _currency;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 8, vsync: this);
    _load();
  }

  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ProjectService().getById(widget.id),
        ProjectMilestoneService().getByProject(widget.id),
        ProjectRiskService().getByProject(widget.id),
      ]);
      _project = results[0] as Project;
      _milestones = results[1] as List<ProjectMilestone>;
      _risks = results[2] as List<ProjectRisk>;
    } catch (_) {}
    setState(() => _loading = false);
  }

  Color _statusColor(String s) => switch (s) {
    'active' => AppTheme.green, 'planning' => AppTheme.blue,
    'on-hold' => AppTheme.amber, 'completed' => AppTheme.cyan, _ => AppTheme.red,
  };

  Color _priorityColor(String p) => switch (p) {
    'critical' => AppTheme.red, 'high' => AppTheme.amber,
    'medium' => AppTheme.blue, _ => AppTheme.green,
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Text(_project?.name ?? 'Project'),
        actions: [
          if (_project != null)
          IconButton(
            icon: const Icon(Icons.currency_exchange_outlined),
            tooltip: 'Currency',
            onPressed: _showCurrencyPicker,
          ),
        IconButton(
            icon: const Icon(Icons.bar_chart_outlined),
            tooltip: 'Analytics',
            onPressed: () { if (_project != null) _tabs.animateTo(6); },
          ),
          IconButton(
            icon: const Icon(Icons.view_kanban_outlined),
            tooltip: 'Kanban',
            onPressed: () {
              if (_project != null) {
                Navigator.push(context, MaterialPageRoute(
                  builder: (_) => TaskKanbanScreen(projectId: _project!.id, projectName: _project!.name),
                )).then((_) => _load());
              }
            },
          ),
          if (_project != null)
            IconButton(
              icon: const Icon(Icons.settings_outlined),
              tooltip: 'Settings',
              onPressed: () async {
                final updated = await Navigator.push<bool>(context,
                    MaterialPageRoute(builder: (_) => ProjectFormScreen(project: _project)));
                if (updated == true) _load();
              },
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _project == null
              ? const Center(child: Text('Project not found'))
              : _buildBody(),
    );
  }

  void _showCurrencyPicker() {
    const currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD'];
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(16),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Project Currency', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, children: currencies.map((c) {
            final sel = c == (_currency ?? _project!.currency);
            return GestureDetector(
              onTap: () { setState(() => _currency = c); Navigator.pop(context); },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: sel ? AppTheme.primary : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: sel ? AppTheme.primary : AppTheme.border),
                ),
                child: Text(c, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500,
                    color: sel ? Colors.white : AppTheme.textSecondary)),
              ),
            );
          }).toList()),
          const SizedBox(height: 8),
        ]),
      ),
    );
  }

  Widget _buildBody() {
    final p = _project!;
    final now = DateTime.now();
    final totalDays = p.endDate.difference(p.startDate).inDays.clamp(1, 99999);
    final elapsed = now.difference(p.startDate).inDays.clamp(0, totalDays);
    final remaining = p.endDate.difference(now).inDays;
    final timeProgress = (elapsed / totalDays).clamp(0.0, 1.0);
    final budgetUsed = p.budget > 0 ? (p.spentBudget / p.budget).clamp(0.0, 1.0) : 0.0;
    final eff = timeProgress > 0 ? (p.progress / 100) / timeProgress : 0.0;

    return NestedScrollView(
      headerSliverBuilder: (context, _) {
        final wide = AppTheme.isWide(context);
        final pad = AppTheme.hPad(context);
        final quickCards = [
          _QuickCard(
            label: 'Budget Health',
            color: budgetUsed > 0.9 ? AppTheme.red : AppTheme.amber,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${(budgetUsed * 100).toStringAsFixed(0)}% used',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold,
                      color: budgetUsed > 0.9 ? AppTheme.red : AppTheme.amber)),
              const SizedBox(height: 2),
              ClipRRect(borderRadius: BorderRadius.circular(3),
                child: LinearProgressIndicator(value: budgetUsed, minHeight: 4,
                    backgroundColor: AppTheme.border,
                    valueColor: AlwaysStoppedAnimation(budgetUsed > 0.9 ? AppTheme.red : AppTheme.amber))),
              const SizedBox(height: 1),
              Text('${_currency ?? p.currency} ${(p.budget - p.spentBudget).toStringAsFixed(0)} left',
                  style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary),
                  overflow: TextOverflow.ellipsis),
            ]),
          ),
          _QuickCard(
            label: 'Performance',
            color: eff >= 1.0 ? AppTheme.green : eff >= 0.8 ? AppTheme.amber : AppTheme.red,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${(eff * 100).toStringAsFixed(0)}% eff.',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold,
                      color: eff >= 1.0 ? AppTheme.green : eff >= 0.8 ? AppTheme.amber : AppTheme.red)),
              const SizedBox(height: 2),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1),
                decoration: BoxDecoration(
                  color: (eff >= 0.8 ? AppTheme.green : AppTheme.red).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(eff >= 0.8 ? 'On Track' : 'At Risk',
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600,
                        color: eff >= 0.8 ? AppTheme.green : AppTheme.red)),
              ),
            ]),
          ),
          _QuickCard(
            label: 'Quick Stats',
            color: AppTheme.primary,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                _MiniChip(p.priority, _priorityColor(p.priority)),
                const SizedBox(width: 4),
                _MiniChip(p.status, _statusColor(p.status)),
              ]),
              const SizedBox(height: 2),
              Text('${p.team.length} members · ${remaining}d left',
                  style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary),
                  overflow: TextOverflow.ellipsis),
            ]),
          ),
        ];
        return [
        // ── Quick Analytics Row ──────────────────────────────────────────────
        SliverToBoxAdapter(
          child: wide
              ? Padding(
                  padding: EdgeInsets.fromLTRB(pad, 10, pad, 0),
                  child: Row(children: quickCards
                      .map((c) => Expanded(child: Padding(padding: const EdgeInsets.only(right: 8), child: c)))
                      .toList()),
                )
              : SizedBox(
                  height: 76,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: EdgeInsets.fromLTRB(pad, 10, pad, 0),
                    children: quickCards,
                  ),
                ),
        ),
        // ── Overview Cards ───────────────────────────────────────────────────
        SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(pad, 8, pad, 0),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              // ── Compact stats row ──────────────────────────────────────
              Container(
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Row(children: [
                  _CStat('Status', p.status, _statusColor(p.status)),
                  _vDivider(),
                  _CStat('Progress', '${p.progress}%', AppTheme.primary),
                  _vDivider(),
                  _CStat('Budget', '${_currency ?? p.currency} ${p.budget.toStringAsFixed(0)}', AppTheme.amber),
                  _vDivider(),
                  _CStat('Team', '${p.team.length}', AppTheme.purple),
                ]),
              ),
              const SizedBox(height: 6),
              // Progress bar
              ClipRRect(borderRadius: BorderRadius.circular(3),
                child: LinearProgressIndicator(value: p.progress / 100, minHeight: 4,
                    backgroundColor: AppTheme.border,
                    valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary))),
              const SizedBox(height: 8),
              // Timeline card
              Container(
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
                padding: const EdgeInsets.all(10),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Timeline', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Row(children: [
                    Expanded(child: _TStat(label: 'Start', value: AppTheme.fmtDate(p.startDate))),
                    Expanded(child: _TStat(label: 'End', value: AppTheme.fmtDate(p.endDate))),
                    Expanded(child: _TStat(label: 'Elapsed', value: '${elapsed}d')),
                    Expanded(child: _TStat(label: 'Left', value: '${remaining}d', color: remaining < 0 ? AppTheme.red : null)),
                  ]),
                  const SizedBox(height: 8),
                  ClipRRect(borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(value: timeProgress, minHeight: 6,
                        backgroundColor: AppTheme.border,
                        valueColor: AlwaysStoppedAnimation<Color>(timeProgress > 0.9 ? AppTheme.red : AppTheme.blue))),
                ]),
              ),
              const SizedBox(height: 8),
              // Info card
              Container(
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
                child: Column(children: [
                  _IRow(icon: Icons.flag_outlined, label: 'Priority',
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: _priorityColor(p.priority).withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                        child: Text(p.priority, style: TextStyle(color: _priorityColor(p.priority), fontSize: 12, fontWeight: FontWeight.w500)))),
                  if (p.client != null && p.client!.isNotEmpty) ...[
                    const Divider(height: 1, color: AppTheme.border),
                    _IRow(icon: Icons.business_outlined, label: 'Client',
                        child: Text(p.client!, style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary))),
                  ],
                  if (p.tags.isNotEmpty) ...[
                    const Divider(height: 1, color: AppTheme.border),
                    _IRow(icon: Icons.label_outline, label: 'Tags',
                        child: Wrap(spacing: 6, runSpacing: 4,
                          children: p.tags.map((t) => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(color: AppTheme.bg, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppTheme.border)),
                            child: Text(t, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)))).toList())),
                  ],
                ]),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
                padding: const EdgeInsets.all(10),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Description', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(p.description, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.4)),
                ]),
              ),
              const SizedBox(height: 8),
              if (p.managers.isNotEmpty || p.team.isNotEmpty)
                Container(
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
                  padding: const EdgeInsets.all(10),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Team', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    ...p.managers.map((m) => _MRow(member: m, role: 'Manager', color: AppTheme.blue)),
                    if (p.managers.isNotEmpty && p.team.isNotEmpty) const SizedBox(height: 4),
                    ...p.team.map((m) => _MRow(member: m, role: 'Member', color: AppTheme.textSecondary)),
                  ]),
                ),
              const SizedBox(height: 12),
              // Milestones
              if (_milestones.isNotEmpty) ...[
                _SectionHeader('Milestones', Icons.flag_outlined, AppTheme.blue),
                const SizedBox(height: 8),
                ..._milestones.map((m) {
                  final done = m.status == 'completed';
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    child: Row(children: [
                      Icon(done ? Icons.check_circle : Icons.radio_button_unchecked,
                          size: 15, color: done ? AppTheme.green : AppTheme.textSecondary),
                      const SizedBox(width: 8),
                      Expanded(child: Text(m.title, style: TextStyle(fontSize: 12,
                          decoration: done ? TextDecoration.lineThrough : null,
                          color: done ? AppTheme.textSecondary : AppTheme.textPrimary))),
                      Text(AppTheme.fmtDate(m.dueDate), style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
                    ]),
                  );
                }),
                const SizedBox(height: 8),
              ],
              // Risks
              if (_risks.isNotEmpty) ...[
                _SectionHeader('Risks', Icons.warning_amber_outlined, AppTheme.red),
                const SizedBox(height: 8),
                ..._risks.map((r) {
                  final c = switch (r.level) { 'high' || 'critical' => AppTheme.red, 'medium' => AppTheme.amber, _ => AppTheme.green };
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: c.withOpacity(0.3))),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                    child: Row(children: [
                      Container(width: 7, height: 7, decoration: BoxDecoration(color: c, shape: BoxShape.circle)),
                      const SizedBox(width: 8),
                      Expanded(child: Text(r.title, style: const TextStyle(fontSize: 12))),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(color: c.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                        child: Text(r.level, style: TextStyle(fontSize: 10, color: c, fontWeight: FontWeight.w600))),
                    ]),
                  );
                }),
                const SizedBox(height: 4),
              ],
            ]),
          ),
        ),
        // ── Tab Bar ──────────────────────────────────────────────────────────
        SliverToBoxAdapter(
          child: TabBar(
            controller: _tabs, isScrollable: true,
            labelColor: AppTheme.primary, unselectedLabelColor: AppTheme.textSecondary,
            indicatorColor: AppTheme.primary, indicatorSize: TabBarIndicatorSize.label,
            labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            unselectedLabelStyle: const TextStyle(fontSize: 12),
            labelPadding: const EdgeInsets.symmetric(horizontal: 14),
            tabAlignment: TabAlignment.start,
            tabs: const [
              Tab(text: 'Tasks'), Tab(text: 'Budget'), Tab(text: 'Timeline'),
              Tab(text: 'Files'), Tab(text: 'Finance'), Tab(text: 'Permissions'),
              Tab(text: 'Analytics'), Tab(text: 'Activity'),
            ],
          ),
        ),
        ];
      },
      body: TabBarView(
        controller: _tabs,
        children: [
          _TasksTab(projectId: p.id, projectName: p.name),
          _BudgetTab(project: p, currency: _currency),
          _GanttTab(project: p),
          _FilesTab(projectId: p.id),
          _FinanceTab(projectId: p.id),
          _PermissionsTab(projectId: p.id),
          _AnalyticsTab(projectId: p.id, project: p),
          _ActivityTab(projectId: p.id),
        ],
      ),
    );
  }
}

// ── Shared Widgets ────────────────────────────────────────────────────────────

class _QuickCard extends StatelessWidget {
  final String label; final Color color; final Widget child;
  const _QuickCard({required this.label, required this.color, required this.child});
  @override
  Widget build(BuildContext context) {
    final wide = AppTheme.isWide(context);
    return Container(
      width: wide ? null : 140,
      height: 66,
      margin: wide ? EdgeInsets.zero : const EdgeInsets.only(right: 8),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: color.withOpacity(0.25))),
      padding: const EdgeInsets.all(8),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: color)),
        const SizedBox(height: 4),
        Expanded(child: child),
      ]),
    );
  }
}

class _MiniChip extends StatelessWidget {
  final String label; final Color color;
  const _MiniChip(this.label, this.color);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
    decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: TextStyle(fontSize: 9, color: color, fontWeight: FontWeight.w600)),
  );
}

class _SectionHeader extends StatelessWidget {
  final String title; final IconData icon; final Color color;
  const _SectionHeader(this.title, this.icon, this.color);
  @override
  Widget build(BuildContext context) => Row(children: [
    Icon(icon, size: 16, color: color),
    const SizedBox(width: 6),
    Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: color)),
  ]);
}

class _CStat extends StatelessWidget {
  final String label, value; final Color color;
  const _CStat(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Expanded(child: Column(children: [
    FittedBox(child: Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color))),
    Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary)),
  ]));
}

Widget _vDivider() => Container(width: 1, height: 28, margin: const EdgeInsets.symmetric(horizontal: 4), color: AppTheme.border);

class _TStat extends StatelessWidget {
  final String label, value; final Color? color;
  const _TStat({required this.label, required this.value, this.color});
  @override
  Widget build(BuildContext context) => Column(children: [
    Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color ?? AppTheme.textPrimary)),
    Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
  ]);
}

class _IRow extends StatelessWidget {
  final IconData icon; final String label; final Widget child;
  const _IRow({required this.icon, required this.label, required this.child});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
    child: Row(children: [
      Icon(icon, size: 14, color: AppTheme.primary),
      const SizedBox(width: 8),
      SizedBox(width: 66, child: Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary))),
      Expanded(child: child),
    ]),
  );
}

class _MRow extends StatelessWidget {
  final ProjectMember member; final String role; final Color color;
  const _MRow({required this.member, required this.role, required this.color});
  @override
  Widget build(BuildContext context) {
    final initials = member.firstName.isNotEmpty
        ? '${member.firstName[0]}${member.lastName.isNotEmpty ? member.lastName[0] : ''}'.toUpperCase() : '?';
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(children: [
        CircleAvatar(radius: 14, backgroundColor: color.withOpacity(0.15),
            child: Text(initials, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color))),
        const SizedBox(width: 8),
        Expanded(child: Text(member.name.isNotEmpty ? member.name : member.id,
            style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary))),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
          child: Text(role, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w500))),
      ]),
    );
  }
}

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

class _Stat extends StatelessWidget {
  final String label, value; final Color color;
  const _Stat(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Expanded(child: Column(children: [
    FittedBox(child: Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color))),
    Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary), textAlign: TextAlign.center),
  ]));
}

// ── Tasks Tab ─────────────────────────────────────────────────────────────────

class _TasksTab extends StatelessWidget {
  final String projectId;
  final String projectName;
  const _TasksTab({required this.projectId, required this.projectName});

  @override
  Widget build(BuildContext context) => TaskListScreen(
        projectId: projectId,
        projectName: projectName,
      );
}


// ── Budget Tab ────────────────────────────────────────────────────────────────

class _BudgetTab extends StatefulWidget {
  final Project project;
  final String? currency;
  const _BudgetTab({required this.project, this.currency});
  @override
  State<_BudgetTab> createState() => _BudgetTabState();
}

class _BudgetTabState extends State<_BudgetTab> {
  ProjectBudget? _budget;
  List<BudgetItem> _items = [];
  List<BudgetApproval> _approvals = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ProjectBudgetService().getByProject(widget.project.id),
        ProjectBudgetDetailService().getDetail(widget.project.id),
      ]);
      _budget = results[0] as ProjectBudget?;
      final detail = results[1] as ({List<BudgetItem> items, List<BudgetApproval> approvals});
      _items = detail.items;
      _approvals = detail.approvals;
    } catch (_) {}
    setState(() => _loading = false);
  }

  Color _bsc(String s) => switch (s) {
    'approved' => AppTheme.green, 'pending' => AppTheme.amber, 'rejected' => AppTheme.red, _ => AppTheme.textSecondary,
  };

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    final b = _budget; final p = widget.project;
    final total = b?.totalBudget ?? p.budget;
    final spent = b?.totalSpent ?? p.spentBudget;
    final remaining = total - spent;
    final currency = widget.currency ?? b?.currency ?? p.currency;
    final used = total > 0 ? (spent / total).clamp(0.0, 1.0) : 0.0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (b?.status != null)
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: _bsc(b!.status).withOpacity(0.1), borderRadius: BorderRadius.circular(20),
                border: Border.all(color: _bsc(b.status).withOpacity(0.3))),
            child: Text('Budget: ${b.status.toUpperCase()}',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _bsc(b.status)))),
        LayoutBuilder(builder: (_, c) {
          final w = (c.maxWidth - 20) / 3;
          return Row(children: [
            _BTile('Total', '$currency ${total.toStringAsFixed(0)}', AppTheme.blue, w),
            const SizedBox(width: 10),
            _BTile('Spent', '$currency ${spent.toStringAsFixed(0)}', AppTheme.red, w),
            const SizedBox(width: 10),
            _BTile('Left', '$currency ${remaining.toStringAsFixed(0)}', AppTheme.green, w),
          ]);
        }),
        const SizedBox(height: 14),
        Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
          padding: const EdgeInsets.all(10),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Utilization', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              Text('${(used * 100).toStringAsFixed(1)}%',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: used > 0.9 ? AppTheme.red : AppTheme.primary)),
            ]),
            const SizedBox(height: 6),
            ClipRRect(borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(value: used, minHeight: 7, backgroundColor: AppTheme.border,
                  valueColor: AlwaysStoppedAnimation<Color>(used > 0.9 ? AppTheme.red : AppTheme.primary))),
          ]),
        ),
        // Budget Items with qty × unit cost
        if (_items.isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text('Budget Items', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
            child: Column(children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
              ..._items.asMap().entries.map((e) {
                final item = e.value;
                final isLast = e.key == _items.length - 1;
                return Column(children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    child: Row(children: [
                      Expanded(flex: 3, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(item.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                        if (item.type.isNotEmpty)
                          Text(item.type, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
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
                  ),
                  if (!isLast) const Divider(height: 1, color: AppTheme.border),
                ]);
              }),
            ]),
          ),
        ],
        // Categories
        if (b != null && b.categories.isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text('Categories', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          ...b.categories.map((cat) {
            final cu = cat.allocated > 0 ? (cat.spent / cat.allocated).clamp(0.0, 1.0) : 0.0;
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
              padding: const EdgeInsets.all(12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(child: Text(cat.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
                  Container(padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(color: AppTheme.bg, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppTheme.border)),
                      child: Text(cat.type, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary))),
                ]),
                const SizedBox(height: 6),
                Row(children: [
                  Expanded(child: Text('Allocated: $currency ${cat.allocated.toStringAsFixed(0)}',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary))),
                  Text('Spent: $currency ${cat.spent.toStringAsFixed(0)}',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                ]),
                const SizedBox(height: 6),
                ClipRRect(borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(value: cu, minHeight: 5, backgroundColor: AppTheme.border,
                      valueColor: AlwaysStoppedAnimation<Color>(cu > 0.9 ? AppTheme.red : AppTheme.primary))),
              ]),
            );
          }),
        ],
        // Approval History
        if (_approvals.isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text('Approval History', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          ..._approvals.map((a) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
            padding: const EdgeInsets.all(12),
            child: Row(children: [
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(color: _bsc(a.action).withOpacity(0.1), shape: BoxShape.circle),
                child: Icon(_approvalIcon(a.action), color: _bsc(a.action), size: 16)),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Text(a.userName.isNotEmpty ? a.userName : 'System',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  const Spacer(),
                  Text(AppTheme.fmtDate(a.createdAt), style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
                ]),
                if (a.action.isNotEmpty)
                  Text(a.action, style: TextStyle(fontSize: 11, color: _bsc(a.action), fontWeight: FontWeight.w500)),
                if (a.comment.isNotEmpty)
                  Text(a.comment, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
              ])),
            ]),
          )),
        ],
      ]),
    );
  }
}

IconData _approvalIcon(String action) => switch (action.toLowerCase()) {
  'approved' => Icons.check_circle_outline,
  'rejected' => Icons.cancel_outlined,
  'pending' => Icons.hourglass_empty_outlined,
  _ => Icons.history_outlined,
};

// ── Gantt Timeline Tab ────────────────────────────────────────────────────────

class _GanttTab extends StatefulWidget {
  final Project project;
  const _GanttTab({required this.project});
  @override
  State<_GanttTab> createState() => _GanttTabState();
}

class _GanttTabState extends State<_GanttTab> {
  List<Task> _tasks = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try { _tasks = await TaskService().getAll(projectId: widget.project.id); } catch (_) {}
    setState(() => _loading = false);
  }

  Color _sc(String s) => switch (s) {
    'completed' => AppTheme.green, 'in-progress' => AppTheme.blue,
    'review' => AppTheme.amber, _ => AppTheme.textSecondary,
  };

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_tasks.isEmpty) return Center(child: Text('No tasks', style: TextStyle(color: AppTheme.textSecondary)));

    final p = widget.project;
    final start = p.startDate;
    final end = p.endDate;
    final totalDays = end.difference(start).inDays.clamp(1, 99999).toDouble();
    final now = DateTime.now();
    final todayOffset = now.difference(start).inDays.clamp(0, totalDays.toInt()).toDouble();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Date axis header
        Row(children: [
          const SizedBox(width: 120),
          Expanded(child: LayoutBuilder(builder: (_, c) {
            final w = c.maxWidth;
            return Stack(children: [
              Container(height: 20, color: Colors.transparent),
              Positioned(left: 0, child: Text(AppTheme.fmtDate(start), style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary))),
              Positioned(right: 0, child: Text(AppTheme.fmtDate(end), style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary))),
              // Today marker label
              if (todayOffset >= 0 && todayOffset <= totalDays)
                Positioned(
                  left: (todayOffset / totalDays * w).clamp(0, w - 24),
                  child: const Text('Today', style: TextStyle(fontSize: 9, color: AppTheme.red, fontWeight: FontWeight.w600)),
                ),
            ]);
          })),
        ]),
        const SizedBox(height: 4),
        ..._tasks.map((t) {
          final due = t.dueDate ?? widget.project.endDate;
          final taskEnd = due.isAfter(end) ? end : due.isBefore(start) ? start : due;
          final barEnd = taskEnd.difference(start).inDays.clamp(0, totalDays.toInt()).toDouble();
          const barStart = 0.0;

          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(children: [
              SizedBox(
                width: 120,
                child: Text(t.title, maxLines: 2, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: AppTheme.textPrimary)),
              ),
              const SizedBox(width: 8),
              Expanded(child: LayoutBuilder(builder: (_, c) {
                final w = c.maxWidth;
                final left = barStart / totalDays * w;
                final barW = ((barEnd - barStart) / totalDays * w).clamp(8.0, w - left);
                final todayX = todayOffset / totalDays * w;
                return SizedBox(height: 28, child: Stack(children: [
                  // Track
                  Positioned.fill(child: Container(
                    decoration: BoxDecoration(color: AppTheme.border.withOpacity(0.5), borderRadius: BorderRadius.circular(4)))),
                  // Bar
                  Positioned(left: left, width: barW, top: 4, bottom: 4,
                    child: Container(
                      decoration: BoxDecoration(color: _sc(t.status), borderRadius: BorderRadius.circular(4)),
                      alignment: Alignment.centerLeft,
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Text(t.status, style: const TextStyle(fontSize: 8, color: Colors.white, fontWeight: FontWeight.w600),
                          overflow: TextOverflow.clip, maxLines: 1),
                    )),
                  // Today line
                  if (todayOffset >= 0 && todayOffset <= totalDays)
                    Positioned(left: todayX, top: 0, bottom: 0,
                      child: Container(width: 1.5, color: AppTheme.red)),
                ]));
              })),
            ]),
          );
        }),
        const SizedBox(height: 12),
        // Legend
        Row(children: [
          _GanttLegend('Todo', AppTheme.textSecondary),
          const SizedBox(width: 12),
          _GanttLegend('In Progress', AppTheme.blue),
          const SizedBox(width: 12),
          _GanttLegend('Review', AppTheme.amber),
          const SizedBox(width: 12),
          _GanttLegend('Done', AppTheme.green),
          const SizedBox(width: 12),
          Row(children: [
            Container(width: 2, height: 12, color: AppTheme.red),
            const SizedBox(width: 4),
            const Text('Today', style: TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
          ]),
        ]),
      ]),
    );
  }
}

class _GanttLegend extends StatelessWidget {
  final String label; final Color color;
  const _GanttLegend(this.label, this.color);
  @override
  Widget build(BuildContext context) => Row(children: [
    Container(width: 12, height: 8, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
    const SizedBox(width: 4),
    Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
  ]);
}

// ── Files Tab ─────────────────────────────────────────────────────────────────

class _FilesTab extends StatefulWidget {
  final String projectId;
  const _FilesTab({required this.projectId});
  @override
  State<_FilesTab> createState() => _FilesTabState();
}

class _FilesTabState extends State<_FilesTab> {
  List<ProjectFile> _files = [];
  bool _loading = true;
  bool _uploading = false;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try { _files = await ProjectFilesService().getByProject(widget.projectId); } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _upload() async {
    final result = await FilePicker.platform.pickFiles(withData: true);
    if (result == null || result.files.isEmpty) return;
    final f = result.files.first;
    if (f.bytes == null) return;
    setState(() => _uploading = true);
    try {
      await ProjectFilesService().upload(
        widget.projectId, f.bytes!, f.name, f.extension ?? 'application/octet-stream');
      await _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload failed: $e')));
    }
    if (mounted) setState(() => _uploading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    return Stack(
      children: [
        _files.isEmpty
            ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.folder_open, size: 48, color: AppTheme.textMuted),
                const SizedBox(height: 12),
                Text('No files uploaded', style: TextStyle(color: AppTheme.textSecondary)),
              ]))
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                itemCount: _files.length,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (_, i) {
                  final f = _files[i];
                  return Container(
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
                    padding: const EdgeInsets.all(12),
                    child: Row(children: [
                      Container(width: 34, height: 34,
                          decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(7)),
                          child: Icon(_fileIcon(f.iconName), color: AppTheme.primary, size: 17)),
                      const SizedBox(width: 10),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(f.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
                        Text('${f.sizeLabel} · ${f.uploaderName.isNotEmpty ? f.uploaderName : 'Unknown'} · ${AppTheme.fmtDate(f.createdAt)}',
                            style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
                      ])),
                    ]),
                  );
                },
              ),
        Positioned(
          bottom: 16, right: 16,
          child: FloatingActionButton(
            heroTag: 'files_upload_fab',
            backgroundColor: AppTheme.primary,
            foregroundColor: Colors.white,
            onPressed: _uploading ? null : _upload,
            child: _uploading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.upload_file_outlined),
          ),
        ),
      ],
    );
  }
}

// ── Finance Tab ───────────────────────────────────────────────────────────────

class _FinanceTab extends StatefulWidget {
  final String projectId;
  const _FinanceTab({required this.projectId});
  @override
  State<_FinanceTab> createState() => _FinanceTabState();
}

class _FinanceTabState extends State<_FinanceTab> with SingleTickerProviderStateMixin {
  late TabController _sub;
  static const _types = ['pl', 'trial-balance', 'balance-sheet', 'cash-flow', 'ledger', 'journal'];
  static const _labels = ['P&L', 'Trial Balance', 'Balance Sheet', 'Cash Flow', 'Ledger', 'Journal'];

  @override
  void initState() {
    super.initState();
    _sub = TabController(length: 6, vsync: this);
  }

  @override
  void dispose() { _sub.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      TabBar(
        controller: _sub, isScrollable: true,
        labelColor: AppTheme.primary, unselectedLabelColor: AppTheme.textSecondary,
        indicatorColor: AppTheme.primary, indicatorSize: TabBarIndicatorSize.label,
        labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        unselectedLabelStyle: const TextStyle(fontSize: 11),
        labelPadding: const EdgeInsets.symmetric(horizontal: 10),
        tabs: _labels.map((l) => Tab(text: l)).toList(),
      ),
      Expanded(
        child: TabBarView(
          controller: _sub,
          children: _types.map((t) => _FinanceReportView(projectId: widget.projectId, type: t)).toList(),
        ),
      ),
    ]);
  }
}

class _FinanceReportView extends StatefulWidget {
  final String projectId, type;
  const _FinanceReportView({required this.projectId, required this.type});
  @override
  State<_FinanceReportView> createState() => _FinanceReportViewState();
}

class _FinanceReportViewState extends State<_FinanceReportView> with AutomaticKeepAliveClientMixin {
  Map<String, dynamic> _data = {};
  bool _loading = true;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() => _loading = true);
    _data = await ProjectFinanceService().fetchReport(widget.projectId, widget.type);
    if (!mounted) return;
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_data.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.receipt_long_outlined, size: 48, color: AppTheme.textMuted),
      const SizedBox(height: 12),
      Text('No ${widget.type} data available', style: TextStyle(color: AppTheme.textSecondary)),
    ]));
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.primary,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: _buildRows(_data),
      ),
    );
  }

  List<Widget> _buildRows(Map<String, dynamic> data) {
    final rows = <Widget>[];
    data.forEach((key, value) {
      if (value is Map<String, dynamic>) {
        rows.add(Padding(
          padding: const EdgeInsets.only(top: 12, bottom: 6),
          child: Text(_fmt(key), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
        ));
        value.forEach((k, v) {
          rows.add(_FinanceRow(label: _fmt(k), value: v));
        });
      } else {
        rows.add(_FinanceRow(label: _fmt(key), value: value, bold: key.toLowerCase().contains('total') || key.toLowerCase().contains('net')));
      }
    });
    return rows;
  }

  String _fmt(String key) => key.replaceAllMapped(RegExp(r'([A-Z])'), (m) => ' ${m[0]}').replaceAll('_', ' ').trim()
      .split(' ').map((w) => w.isEmpty ? '' : '${w[0].toUpperCase()}${w.substring(1)}').join(' ');
}

class _FinanceRow extends StatelessWidget {
  final String label;
  final dynamic value;
  final bool bold;
  const _FinanceRow({required this.label, required this.value, this.bold = false});

  @override
  Widget build(BuildContext context) {
    final isNum = value is num;
    final numVal = isNum ? (value as num).toDouble() : null;
    final color = numVal != null ? (numVal < 0 ? AppTheme.red : AppTheme.textPrimary) : AppTheme.textPrimary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: bold ? AppTheme.primary.withOpacity(0.04) : Colors.white,
        border: Border(bottom: BorderSide(color: AppTheme.border)),
      ),
      child: Row(children: [
        Expanded(child: Text(label, style: TextStyle(fontSize: 12,
            fontWeight: bold ? FontWeight.w700 : FontWeight.normal, color: AppTheme.textSecondary))),
        Text(
          isNum ? (numVal! < 0 ? '-${numVal.abs().toStringAsFixed(2)}' : numVal.toStringAsFixed(2)) : value.toString(),
          style: TextStyle(fontSize: 12, fontWeight: bold ? FontWeight.w700 : FontWeight.w500, color: color),
        ),
      ]),
    );
  }
}

// ── Permissions Tab ───────────────────────────────────────────────────────────

class _PermissionsTab extends StatefulWidget {
  final String projectId;
  const _PermissionsTab({required this.projectId});
  @override
  State<_PermissionsTab> createState() => _PermissionsTabState();
}

class _PermissionsTabState extends State<_PermissionsTab> {
  List<ProjectPermission> _perms = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() => _loading = true);
    _perms = await ProjectPermissionsService().getByProject(widget.projectId);
    if (!mounted) return;
    setState(() => _loading = false);
  }

  Color _roleColor(String r) => switch (r) {
    'manager' || 'admin' => AppTheme.blue,
    'lead' => AppTheme.purple,
    _ => AppTheme.textSecondary,
  };

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_perms.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.lock_outline, size: 48, color: AppTheme.textMuted),
      const SizedBox(height: 12),
      Text('No permissions configured', style: TextStyle(color: AppTheme.textSecondary)),
    ]));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _perms.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final perm = _perms[i];
        final initials = perm.userName.isNotEmpty ? perm.userName[0].toUpperCase() : '?';
        final rc = _roleColor(perm.role);
        return Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
          padding: const EdgeInsets.all(12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              CircleAvatar(radius: 14, backgroundColor: rc.withOpacity(0.15),
                  child: Text(initials, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: rc))),
              const SizedBox(width: 8),
              Expanded(child: Text(perm.userName.isNotEmpty ? perm.userName : perm.userId,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(color: rc.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                child: Text(perm.role, style: TextStyle(fontSize: 10, color: rc, fontWeight: FontWeight.w600))),
            ]),
            if (perm.permissions.isNotEmpty) ...[
              const SizedBox(height: 6),
              Wrap(spacing: 6, runSpacing: 4,
                children: perm.permissions.map((p) => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(color: AppTheme.bg, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppTheme.border)),
                  child: Text(p, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)))).toList()),
            ],
          ]),
        );
      },
    );
  }
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────

class _AnalyticsTab extends StatefulWidget {
  final String projectId;
  final Project project;
  const _AnalyticsTab({required this.projectId, required this.project});
  @override
  State<_AnalyticsTab> createState() => _AnalyticsTabState();
}

class _AnalyticsTabState extends State<_AnalyticsTab> {
  ProjectAnalytics? _analytics;
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try { _analytics = await ProjectAnalyticsService().getByProject(widget.projectId); } catch (_) {}
    setState(() => _loading = false);
  }

  Color _rc(String r) => switch (r) { 'high' || 'critical' => AppTheme.red, 'medium' => AppTheme.amber, _ => AppTheme.green };
  Color _ic(double v) => v >= 1.0 ? AppTheme.green : v >= 0.8 ? AppTheme.amber : AppTheme.red;

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    final p = widget.project;
    final a = _analytics;
    final now = DateTime.now();
    final totalDays = p.endDate.difference(p.startDate).inDays.clamp(1, 99999);
    final elapsed = now.difference(p.startDate).inDays.clamp(0, totalDays);
    final tp = elapsed / totalDays;
    final eff = tp > 0 ? (p.progress / 100) / tp : 0.0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        LayoutBuilder(builder: (_, c) {
          final w = (c.maxWidth - 20) / 3;
          return Row(children: [
            _ATile('Efficiency', '${(eff * 100).toStringAsFixed(0)}%', eff >= 1.0 ? AppTheme.green : eff >= 0.8 ? AppTheme.amber : AppTheme.red, w),
            const SizedBox(width: 10),
            _ATile('CPI', a != null ? a.cpi.toStringAsFixed(2) : '-', a != null ? _ic(a.cpi) : AppTheme.textSecondary, w),
            const SizedBox(width: 10),
            _ATile('SPI', a != null ? a.spi.toStringAsFixed(2) : '-', a != null ? _ic(a.spi) : AppTheme.textSecondary, w),
          ]);
        }),
        if (a != null) ...[
        const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
            padding: const EdgeInsets.all(10),
            child: Row(children: [
              Icon(Icons.warning_amber_outlined, color: _rc(a.overallRisk), size: 16),
              const SizedBox(width: 8),
              const Text('Overall Risk', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: _rc(a.overallRisk).withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                child: Text(a.overallRisk.toUpperCase(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _rc(a.overallRisk)))),
            ]),
          ),
        ],
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
          padding: const EdgeInsets.all(10),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Task Breakdown', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            const SizedBox(height: 10),
            if (a != null) ...[
              _PRow('Completed', a.completedTasks, a.totalTasks, AppTheme.green),
              const SizedBox(height: 8),
              _PRow('In Progress', a.inProgressTasks, a.totalTasks, AppTheme.blue),
              const SizedBox(height: 8),
              _PRow('Remaining', (a.totalTasks - a.completedTasks - a.inProgressTasks).clamp(0, a.totalTasks), a.totalTasks, AppTheme.textSecondary),
            ] else
              _PRow('Progress', p.progress, 100, AppTheme.primary),
          ]),
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
          padding: const EdgeInsets.all(10),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Timeline Health', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            const SizedBox(height: 10),
            _PRow('Time Elapsed', (tp * 100).round(), 100, AppTheme.blue),
            const SizedBox(height: 8),
            _PRow('Work Done', p.progress, 100, AppTheme.primary),
          ]),
        ),
      ]),
    );
  }
}

class _ATile extends StatelessWidget {
  final String label, value; final Color color; final double w;
  const _ATile(this.label, this.value, this.color, this.w);
  @override
  Widget build(BuildContext context) => Container(
    width: w, padding: const EdgeInsets.all(8),
    decoration: BoxDecoration(color: color.withOpacity(0.06), borderRadius: BorderRadius.circular(8), border: Border.all(color: color.withOpacity(0.2))),
    child: Column(children: [
      FittedBox(child: Text(value, style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: color))),
      Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary), textAlign: TextAlign.center),
    ]),
  );
}

class _PRow extends StatelessWidget {
  final String label; final num value, total; final Color color;
  const _PRow(this.label, this.value, this.total, this.color);
  @override
  Widget build(BuildContext context) {
    final pct = total > 0 ? (value / total).clamp(0.0, 1.0) : 0.0;
    return Row(children: [
      SizedBox(width: 90, child: Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
      Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(value: pct.toDouble(), minHeight: 7, backgroundColor: AppTheme.border,
              valueColor: AlwaysStoppedAnimation<Color>(color)))),
      const SizedBox(width: 8),
      Text('$value', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
    ]);
  }
}

// ── Activity Tab ──────────────────────────────────────────────────────────────

class _ActivityTab extends StatefulWidget {
  final String projectId;
  const _ActivityTab({required this.projectId});
  @override
  State<_ActivityTab> createState() => _ActivityTabState();
}

class _ActivityTabState extends State<_ActivityTab> {
  List<ActivityEntry> _entries = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try { _entries = await ProjectActivityService().getByProject(widget.projectId); } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_entries.isEmpty) return Center(child: Text('No activity yet', style: TextStyle(color: AppTheme.textSecondary)));
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _entries.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final e = _entries[i];
        final initials = e.userName.isNotEmpty ? e.userName[0].toUpperCase() : '?';
        return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          CircleAvatar(radius: 13, backgroundColor: AppTheme.primary.withOpacity(0.1),
              child: Text(initials, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.primary))),
          const SizedBox(width: 8),
          Expanded(child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppTheme.border)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(e.userName.isNotEmpty ? e.userName : 'System',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600))),
                Text(AppTheme.fmtDate(e.createdAt), style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
              ]),
              if (e.action.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(e.action, style: const TextStyle(fontSize: 11, color: AppTheme.primary, fontWeight: FontWeight.w500)),
              ],
              if (e.description.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(e.description, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
              ],
            ]),
          )),
        ]);
      },
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

IconData _fileIcon(String name) => switch (name) {
  'image' => Icons.image_outlined,
  'pdf' => Icons.picture_as_pdf_outlined,
  'doc' => Icons.description_outlined,
  'sheet' => Icons.table_chart_outlined,
  'zip' => Icons.folder_zip_outlined,
  _ => Icons.insert_drive_file_outlined,
};
