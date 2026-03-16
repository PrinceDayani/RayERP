import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../models/task.dart';
import '../../services/project_service.dart';
import '../../services/task_service.dart';
import 'project_detail_screen.dart';
import 'project_form_screen.dart';
import 'global_analytics_screen.dart';
import 'global_timeline_screen.dart';
import 'project_templates_screen.dart';

class ProjectListScreen extends StatefulWidget {
  const ProjectListScreen({super.key});
  @override
  State<ProjectListScreen> createState() => _ProjectListScreenState();
}

class _ProjectListScreenState extends State<ProjectListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<Project> _all = [];
  ProjectStats? _stats;
  bool _loading = true;
  String _search = '';
  String _status = 'all';
  String _priority = 'all';
  String _sort = 'recent';
  String _currency = 'USD';

  @override
  void initState() {
    super.initState();
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
        ProjectService().getAll(),
        ProjectService().getStats().catchError((_) => ProjectStats(
            totalProjects: 0, activeProjects: 0,
            completedProjects: 0, atRiskProjects: 0, overdueTasks: 0)),
      ]);
      _all = results[0] as List<Project>;
      _stats = results[1] as ProjectStats;
    } catch (_) {}
    setState(() => _loading = false);
  }

  List<Project> get _filtered {
    var list = _all.where((p) {
      final q = _search.toLowerCase();
      final matchSearch = q.isEmpty ||
          p.name.toLowerCase().contains(q) ||
          p.description.toLowerCase().contains(q);
      final matchStatus = _status == 'all' || p.status == _status;
      final matchPriority = _priority == 'all' || p.priority == _priority;
      return matchSearch && matchStatus && matchPriority;
    }).toList();
    switch (_sort) {
      case 'name':
        list.sort((a, b) => a.name.compareTo(b.name));
      case 'progress':
        list.sort((a, b) => b.progress.compareTo(a.progress));
      case 'dueDate':
        list.sort((a, b) => a.endDate.compareTo(b.endDate));
      default:
        list.sort((a, b) => b.startDate.compareTo(a.startDate));
    }
    return list;
  }

  Color _statusColor(String s) => switch (s) {
        'active' => AppTheme.green,
        'planning' => AppTheme.blue,
        'on-hold' => AppTheme.amber,
        'completed' => AppTheme.cyan,
        _ => AppTheme.red,
      };

  Color _statusBg(String s) => switch (s) {
        'active' => AppTheme.greenBg,
        'planning' => AppTheme.blueBg,
        'on-hold' => AppTheme.amberBg,
        'completed' => const Color(0xFFECFEFF),
        _ => AppTheme.redBg,
      };

  Color _priorityColor(String p) => switch (p) {
        'critical' => AppTheme.red,
        'high' => AppTheme.amber,
        'medium' => AppTheme.blue,
        _ => AppTheme.textSecondary,
      };

  Future<void> _delete(Project p) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Project'),
        content: Text('Delete "${p.name}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: AppTheme.red)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ProjectService().deleteProject(p.id);
      setState(() => _all.removeWhere((x) => x.id == p.id));
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Project deleted')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _showCurrencyPicker() {
    const currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD'];
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Display Currency', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8, runSpacing: 8,
              children: currencies.map((c) {
                final sel = c == _currency;
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
              }).toList(),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final wide = AppTheme.isWide(context);
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: ShaderMask(
          shaderCallback: (b) => const LinearGradient(
            colors: [AppTheme.primary, AppTheme.primaryHover],
          ).createShader(b),
          child: const Text('Projects', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.currency_exchange_outlined),
            tooltip: 'Currency',
            onPressed: _showCurrencyPicker,
          ),
          IconButton(
            icon: const Icon(Icons.bar_chart_outlined),
            tooltip: 'Analytics',
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GlobalAnalyticsScreen())),
          ),
        ],
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          indicatorSize: wide ? TabBarIndicatorSize.tab : TabBarIndicatorSize.label,
          tabs: const [
            Tab(text: 'Projects'),
            Tab(text: 'Tasks'),
            Tab(text: 'Budgets'),
            Tab(text: 'Reports'),
          ],
        ),
      ),
      floatingActionButton: ListenableBuilder(
        listenable: _tabs,
        builder: (_, _) => _tabs.index == 0
            ? FloatingActionButton(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                onPressed: () async {
                  final created = await Navigator.push<bool>(
                      context, MaterialPageRoute(builder: (_) => const ProjectFormScreen()));
                  if (created == true) _load();
                },
                child: const Icon(Icons.add),
              )
            : const SizedBox.shrink(),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _ProjectsTab(
            loading: _loading,
            filtered: _filtered,
            stats: _stats,
            search: _search,
            status: _status,
            priority: _priority,
            sort: _sort,
            onRefresh: _load,
            onSearch: (v) => setState(() => _search = v),
            onStatus: (v) => setState(() => _status = v),
            onPriority: (v) => setState(() => _priority = v),
            onSort: (v) => setState(() => _sort = v),
            statusColor: _statusColor,
            statusBg: _statusBg,
            priorityColor: _priorityColor,
            onTap: (p) async {
              await Navigator.push(context, MaterialPageRoute(builder: (_) => ProjectDetailScreen(id: p.id)));
              _load();
            },
            onEdit: (p) async {
              final updated = await Navigator.push<bool>(context,
                  MaterialPageRoute(builder: (_) => ProjectFormScreen(project: p)));
              if (updated == true) _load();
            },
            onDelete: _delete,
          ),
          const _AllTasksTab(),
          _BudgetsTab(projects: _all, currency: _currency),
          const _ReportsTab(),
        ],
      ),
    );
  }
}

// ── Projects Tab ──────────────────────────────────────────────────────────────

class _ProjectsTab extends StatefulWidget {
  final bool loading;
  final List<Project> filtered;
  final ProjectStats? stats;
  final String search, status, priority, sort;
  final Future<void> Function() onRefresh;
  final ValueChanged<String> onSearch, onStatus, onPriority, onSort;
  final Color Function(String) statusColor, statusBg, priorityColor;
  final void Function(Project) onTap, onEdit, onDelete;

  const _ProjectsTab({
    required this.loading, required this.filtered, required this.stats,
    required this.search, required this.status, required this.priority, required this.sort,
    required this.onRefresh, required this.onSearch, required this.onStatus,
    required this.onPriority, required this.onSort,
    required this.statusColor, required this.statusBg, required this.priorityColor,
    required this.onTap, required this.onEdit, required this.onDelete,
  });

  @override
  State<_ProjectsTab> createState() => _ProjectsTabState();
}

class _ProjectsTabState extends State<_ProjectsTab> {
  bool _grid = false;

  int _gridCols(BuildContext ctx) {
    final w = MediaQuery.of(ctx).size.width;
    if (w < 480) return 1;
    if (w < 768) return 2;
    if (w < 1024) return 3;
    return 4;
  }

  int _listCols(BuildContext ctx) {
    final w = MediaQuery.of(ctx).size.width;
    if (w < 768) return 1;
    if (w < 1024) return 2;
    return 3;
  }

  @override
  Widget build(BuildContext context) {
    if (widget.loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    return RefreshIndicator(
      onRefresh: widget.onRefresh,
      color: AppTheme.primary,
      child: CustomScrollView(
        slivers: [
          if (widget.stats != null) _StatsGrid(stats: widget.stats!),
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(AppTheme.hPad(context), 4, AppTheme.hPad(context), 0),
              child: Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                GestureDetector(
                  onTap: () => setState(() => _grid = !_grid),
                  child: Icon(_grid ? Icons.view_list_outlined : Icons.grid_view_outlined,
                      size: 22, color: AppTheme.primary),
                ),
              ]),
            ),
          ),
          _FilterBar(
            search: widget.search, status: widget.status, priority: widget.priority, sort: widget.sort,
            onSearch: widget.onSearch, onStatus: widget.onStatus, onPriority: widget.onPriority, onSort: widget.onSort,
          ),
          widget.filtered.isEmpty
              ? SliverFillRemaining(
                  child: Center(
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.folder_open, size: 48, color: AppTheme.textMuted),
                      const SizedBox(height: 12),
                      Text('No projects found', style: TextStyle(color: AppTheme.textSecondary)),
                    ]),
                  ),
                )
              : _grid
                  ? SliverPadding(
                      padding: EdgeInsets.fromLTRB(AppTheme.hPad(context), 0, AppTheme.hPad(context), 100),
                      sliver: SliverGrid(
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: _gridCols(context),
                          crossAxisSpacing: 10, mainAxisSpacing: 10,
                          childAspectRatio: AppTheme.isDesktop(context) ? 1.3 : 1.05,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, i) => _ProjectCard(
                            project: widget.filtered[i],
                            statusColor: widget.statusColor, statusBg: widget.statusBg, priorityColor: widget.priorityColor,
                            onTap: () => widget.onTap(widget.filtered[i]),
                            onEdit: () => widget.onEdit(widget.filtered[i]),
                            onDelete: () => widget.onDelete(widget.filtered[i]),
                          ),
                          childCount: widget.filtered.length,
                        ),
                      ),
                    )
                  : SliverPadding(
                      padding: EdgeInsets.fromLTRB(AppTheme.hPad(context), 0, AppTheme.hPad(context), 100),
                      sliver: AppTheme.isWide(context)
                          ? SliverGrid(
                              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: _listCols(context),
                                crossAxisSpacing: 10, mainAxisSpacing: 10,
                                childAspectRatio: AppTheme.isDesktop(context) ? 2.8 : 2.2,
                              ),
                              delegate: SliverChildBuilderDelegate(
                                (context, i) => _ProjectCard(
                                  project: widget.filtered[i],
                                  statusColor: widget.statusColor, statusBg: widget.statusBg, priorityColor: widget.priorityColor,
                                  onTap: () => widget.onTap(widget.filtered[i]),
                                  onEdit: () => widget.onEdit(widget.filtered[i]),
                                  onDelete: () => widget.onDelete(widget.filtered[i]),
                                ),
                                childCount: widget.filtered.length,
                              ),
                            )
                          : SliverList(
                              delegate: SliverChildBuilderDelegate(
                                (context, i) => Padding(
                                  padding: const EdgeInsets.only(bottom: 10),
                                  child: _ProjectCard(
                                    project: widget.filtered[i],
                                    statusColor: widget.statusColor, statusBg: widget.statusBg, priorityColor: widget.priorityColor,
                                    onTap: () => widget.onTap(widget.filtered[i]),
                                    onEdit: () => widget.onEdit(widget.filtered[i]),
                                    onDelete: () => widget.onDelete(widget.filtered[i]),
                                  ),
                                ),
                                childCount: widget.filtered.length,
                              ),
                            ),
                    ),
        ],
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  final ProjectStats stats;
  const _StatsGrid({required this.stats});

  @override
  Widget build(BuildContext context) {
    final tiles = [
      _StatTile(label: 'Total', value: '${stats.totalProjects}', icon: Icons.folder_outlined, color: AppTheme.primary),
      _StatTile(label: 'Active', value: '${stats.activeProjects}', icon: Icons.play_circle_outline, color: AppTheme.green),
      _StatTile(label: 'Completed', value: '${stats.completedProjects}', icon: Icons.check_circle_outline, color: AppTheme.cyan),
      _StatTile(label: 'At Risk', value: '${stats.atRiskProjects}', icon: Icons.warning_amber_outlined, color: AppTheme.amber),
      _StatTile(label: 'Overdue', value: '${stats.overdueTasks}', icon: Icons.alarm_outlined, color: AppTheme.red),
    ];
    final wide = AppTheme.isWide(context);
    return SliverToBoxAdapter(
      child: wide
          ? Padding(
              padding: EdgeInsets.fromLTRB(AppTheme.hPad(context), 12, AppTheme.hPad(context), 0),
              child: Row(children: tiles.map((t) => Expanded(child: Padding(
                padding: const EdgeInsets.only(right: 8),
                child: t,
              ))).toList()),
            )
          : SizedBox(
              height: 72,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                children: tiles,
              ),
            ),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  const _StatTile({required this.label, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    final wide = AppTheme.isWide(context);
    return Container(
      width: wide ? null : 110,
      margin: wide ? EdgeInsets.zero : const EdgeInsets.only(right: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        boxShadow: [BoxShadow(color: color.withOpacity(0.08), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      child: Row(children: [
        Container(
          width: 32, height: 32,
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [color, color.withOpacity(0.75)], begin: Alignment.topLeft, end: Alignment.bottomRight),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: Colors.white, size: 16),
        ),
        const SizedBox(width: 8),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
          FittedBox(child: ShaderMask(
            shaderCallback: (b) => LinearGradient(colors: [color, color.withOpacity(0.7)]).createShader(b),
            child: Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
          )),
          Text(label.toUpperCase(), style: TextStyle(fontSize: 8, fontWeight: FontWeight.w600, color: color, letterSpacing: 0.5)),
        ])),
      ]),
    );
  }
}

// ── Filter Bar ────────────────────────────────────────────────────────────────

class _FilterBar extends StatelessWidget {
  final String search, status, priority, sort;
  final ValueChanged<String> onSearch, onStatus, onPriority, onSort;
  const _FilterBar({
    required this.search, required this.status, required this.priority, required this.sort,
    required this.onSearch, required this.onStatus, required this.onPriority, required this.onSort,
  });

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: EdgeInsets.fromLTRB(AppTheme.hPad(context), 4, AppTheme.hPad(context), 12),
        child: Column(children: [
          TextField(
            onChanged: onSearch,
            decoration: InputDecoration(
              hintText: 'Search projects…',
              prefixIcon: const Icon(Icons.search, size: 20),
              suffixIcon: PopupMenuButton<String>(
                icon: const Icon(Icons.sort, size: 20),
                tooltip: 'Sort',
                onSelected: onSort,
                itemBuilder: (_) => const [
                  PopupMenuItem(value: 'recent', child: Text('Recent')),
                  PopupMenuItem(value: 'name', child: Text('Name')),
                  PopupMenuItem(value: 'progress', child: Text('Progress')),
                  PopupMenuItem(value: 'dueDate', child: Text('Due Date')),
                ],
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
              filled: true, fillColor: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              _Chip(label: 'All', selected: status == 'all', onTap: () => onStatus('all')),
              _Chip(label: 'Active', selected: status == 'active', onTap: () => onStatus('active')),
              _Chip(label: 'Planning', selected: status == 'planning', onTap: () => onStatus('planning')),
              _Chip(label: 'On Hold', selected: status == 'on-hold', onTap: () => onStatus('on-hold')),
              _Chip(label: 'Completed', selected: status == 'completed', onTap: () => onStatus('completed')),
              const SizedBox(width: 8),
              const VerticalDivider(width: 1, thickness: 1, color: AppTheme.border),
              const SizedBox(width: 8),
              _Chip(label: 'Critical', selected: priority == 'critical', onTap: () => onPriority(priority == 'critical' ? 'all' : 'critical'), color: AppTheme.red),
              _Chip(label: 'High', selected: priority == 'high', onTap: () => onPriority(priority == 'high' ? 'all' : 'high'), color: AppTheme.amber),
              _Chip(label: 'Medium', selected: priority == 'medium', onTap: () => onPriority(priority == 'medium' ? 'all' : 'medium'), color: AppTheme.blue),
            ]),
          ),
        ]),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color? color;
  const _Chip({required this.label, required this.selected, required this.onTap, this.color});

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppTheme.primary;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 6),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? c : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? c : AppTheme.border),
        ),
        child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: selected ? Colors.white : AppTheme.textSecondary)),
      ),
    );
  }
}

// ── Project Card ──────────────────────────────────────────────────────────────

class _ProjectCard extends StatelessWidget {
  final Project project;
  final Color Function(String) statusColor, statusBg, priorityColor;
  final VoidCallback onTap, onEdit, onDelete;
  const _ProjectCard({
    required this.project, required this.statusColor, required this.statusBg,
    required this.priorityColor, required this.onTap, required this.onEdit, required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final p = project;
    final pc = priorityColor(p.priority);
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            boxShadow: [BoxShadow(color: AppTheme.primary.withOpacity(0.07), blurRadius: 10, offset: const Offset(0, 3))],
          ),
          padding: const EdgeInsets.all(12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [pc, pc.withOpacity(0.7)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.folder_outlined, color: Colors.white, size: 18),
              ),
              const SizedBox(width: 8),
              Expanded(child: Text(p.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.textPrimary))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: statusBg(p.status), borderRadius: BorderRadius.circular(20)),
                child: Text(p.status, style: TextStyle(color: statusColor(p.status), fontSize: 11, fontWeight: FontWeight.w500)),
              ),
              const SizedBox(width: 4),
              GestureDetector(onTap: onEdit, child: const Icon(Icons.edit_outlined, size: 18, color: AppTheme.textSecondary)),
              const SizedBox(width: 4),
              GestureDetector(onTap: onDelete, child: const Icon(Icons.delete_outline, size: 18, color: AppTheme.red)),
            ]),
            const SizedBox(height: 6),
            Text(p.description, maxLines: 1, overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
            const SizedBox(height: 8),
            Row(children: [
              Text('${p.progress}%', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.primary)),
              const SizedBox(width: 6),
              Expanded(child: ClipRRect(
                borderRadius: BorderRadius.circular(3),
                child: LinearProgressIndicator(
                  value: p.progress / 100, minHeight: 5,
                  backgroundColor: AppTheme.border,
                  valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                ),
              )),
            ]),
            const SizedBox(height: 8),
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(color: pc.withOpacity(0.08), borderRadius: BorderRadius.circular(20)),
                child: Text(p.priority, style: TextStyle(color: pc, fontSize: 10, fontWeight: FontWeight.w500)),
              ),
              const Spacer(),
              const Icon(Icons.calendar_today_outlined, size: 11, color: AppTheme.textSecondary),
              const SizedBox(width: 3),
              Text(AppTheme.fmtDate(p.endDate), style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
              const SizedBox(width: 10),
              const Icon(Icons.group_outlined, size: 11, color: AppTheme.textSecondary),
              const SizedBox(width: 3),
              Text('${p.team.length}', style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
            ]),
          ]),
        ),
      ),
    );
  }
}

// ── All Tasks Tab ─────────────────────────────────────────────────────────────

class _AllTasksTab extends StatefulWidget {
  const _AllTasksTab();
  @override
  State<_AllTasksTab> createState() => _AllTasksTabState();
}

class _AllTasksTabState extends State<_AllTasksTab> {
  List<Task> _tasks = [];
  bool _loading = true;
  String _statusFilter = 'all';
  String _priorityFilter = 'all';

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try { _tasks = await TaskService().getMyTasks(); } catch (_) {}
    setState(() => _loading = false);
  }

  Color _sc(String s) => switch (s) {
    'completed' => AppTheme.green, 'in-progress' => AppTheme.blue,
    'review' => AppTheme.amber, _ => AppTheme.textSecondary,
  };
  Color _pc(String p) => switch (p) {
    'critical' => AppTheme.red, 'high' => AppTheme.amber,
    'medium' => AppTheme.blue, _ => AppTheme.textSecondary,
  };

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    final filtered = _tasks.where((t) {
      final ms = _statusFilter == 'all' || t.status == _statusFilter;
      final mp = _priorityFilter == 'all' || t.priority == _priorityFilter;
      return ms && mp;
    }).toList();
    final overdue = _tasks.where((t) => t.dueDate != null && t.dueDate!.isBefore(DateTime.now()) && t.status != 'completed').length;

    return Column(children: [
      Padding(
        padding: EdgeInsets.fromLTRB(AppTheme.hPad(context), 12, AppTheme.hPad(context), 0),
        child: Row(children: [
          _TStat('Total', '${_tasks.length}', AppTheme.primary),
          _TStat('In Progress', '${_tasks.where((t) => t.status == 'in-progress').length}', AppTheme.blue),
          _TStat('Done', '${_tasks.where((t) => t.status == 'completed').length}', AppTheme.green),
          _TStat('Overdue', '$overdue', AppTheme.red),
        ]),
      ),
      SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.fromLTRB(AppTheme.hPad(context), 10, AppTheme.hPad(context), 0),
        child: Row(children: [
          ...[('all', 'All'), ('todo', 'Todo'), ('in-progress', 'Active'), ('review', 'Review'), ('completed', 'Done')].map((e) {
            final sel = _statusFilter == e.$1;
            return GestureDetector(
              onTap: () => setState(() => _statusFilter = e.$1),
              child: Container(
                margin: const EdgeInsets.only(right: 6),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: sel ? AppTheme.primary : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: sel ? AppTheme.primary : AppTheme.border),
                ),
                child: Text(e.$2, style: TextStyle(fontSize: 12, color: sel ? Colors.white : AppTheme.textSecondary)),
              ),
            );
          }),
          const SizedBox(width: 8),
          const VerticalDivider(width: 1, thickness: 1, color: AppTheme.border),
          const SizedBox(width: 8),
          ...[('critical', AppTheme.red), ('high', AppTheme.amber), ('medium', AppTheme.blue)].map((e) {
            final sel = _priorityFilter == e.$1;
            return GestureDetector(
              onTap: () => setState(() => _priorityFilter = sel ? 'all' : e.$1),
              child: Container(
                margin: const EdgeInsets.only(right: 6),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: sel ? e.$2 : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: sel ? e.$2 : AppTheme.border),
                ),
                child: Text(e.$1, style: TextStyle(fontSize: 12, color: sel ? Colors.white : AppTheme.textSecondary)),
              ),
            );
          }),
        ]),
      ),
      const SizedBox(height: 8),
      Expanded(
        child: filtered.isEmpty
            ? Center(child: Text('No tasks', style: TextStyle(color: AppTheme.textSecondary)))
            : ListView.separated(
                  padding: EdgeInsets.fromLTRB(AppTheme.hPad(context), 4, AppTheme.hPad(context), 80),
                itemCount: filtered.length,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (_, i) {
                  final t = filtered[i];
                  final isOverdue = t.dueDate != null && t.dueDate!.isBefore(DateTime.now()) && t.status != 'completed';
                  return Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: isOverdue ? AppTheme.red.withOpacity(0.3) : AppTheme.border),
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Expanded(child: Text(t.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(color: _pc(t.priority).withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                          child: Text(t.priority, style: TextStyle(fontSize: 10, color: _pc(t.priority))),
                        ),
                      ]),
                      const SizedBox(height: 6),
                      Row(children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(color: _sc(t.status).withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                          child: Text(t.status, style: TextStyle(fontSize: 10, color: _sc(t.status))),
                        ),
                        const Spacer(),
                        Icon(Icons.calendar_today_outlined, size: 11, color: isOverdue ? AppTheme.red : AppTheme.textSecondary),
                        const SizedBox(width: 3),
                        Text(t.dueDate != null ? AppTheme.fmtDate(t.dueDate!) : '—', style: TextStyle(fontSize: 11, color: isOverdue ? AppTheme.red : AppTheme.textSecondary)),
                      ]),
                    ]),
                  );
                },
              ),
      ),
    ]);
  }
}

class _TStat extends StatelessWidget {
  final String label, value;
  final Color color;
  const _TStat(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Expanded(
    child: Column(children: [
      FittedBox(child: Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color))),
      Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary), textAlign: TextAlign.center),
    ]),
  );
}

// ── Budgets Tab ───────────────────────────────────────────────────────────────

class _BudgetsTab extends StatelessWidget {
  final List<Project> projects;
  final String currency;
  const _BudgetsTab({required this.projects, required this.currency});

  @override
  Widget build(BuildContext context) {
    if (projects.isEmpty) {
      return Center(child: Text('No projects', style: TextStyle(color: AppTheme.textSecondary)));
    }

    final totalBudget = projects.fold(0.0, (s, p) => s + p.budget);
    final totalSpent = projects.fold(0.0, (s, p) => s + p.spentBudget);
    final totalRemaining = totalBudget - totalSpent;
    final overallUsed = totalBudget > 0 ? (totalSpent / totalBudget).clamp(0.0, 1.0) : 0.0;

    return ListView(
      padding: EdgeInsets.all(AppTheme.hPad(context)),
      children: [
        LayoutBuilder(builder: (_, c) {
          final cols = c.maxWidth < 360 ? 2 : 3;
          final gap = (cols - 1) * 10.0;
          final w = (c.maxWidth - gap) / cols;
          if (cols == 2) {
            return Column(children: [
              Row(children: [
                _BudgetTile('Total Budget', totalBudget.toStringAsFixed(0), AppTheme.blue, w),
                const SizedBox(width: 10),
                _BudgetTile('Total Spent', totalSpent.toStringAsFixed(0), AppTheme.red, w),
              ]),
              const SizedBox(height: 10),
              _BudgetTile('Remaining', totalRemaining.toStringAsFixed(0), AppTheme.green, double.infinity),
            ]);
          }
          return Row(children: [
            _BudgetTile('Total Budget', totalBudget.toStringAsFixed(0), AppTheme.blue, w),
            const SizedBox(width: 10),
            _BudgetTile('Total Spent', totalSpent.toStringAsFixed(0), AppTheme.red, w),
            const SizedBox(width: 10),
            _BudgetTile('Remaining', totalRemaining.toStringAsFixed(0), AppTheme.green, w),
          ]);
        }),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Overall Utilization', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              Text('${(overallUsed * 100).toStringAsFixed(1)}%',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
                      color: overallUsed > 0.9 ? AppTheme.red : AppTheme.primary)),
            ]),
            const SizedBox(height: 8),
            ClipRRect(borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(value: overallUsed, minHeight: 10,
                  backgroundColor: AppTheme.border,
                  valueColor: AlwaysStoppedAnimation<Color>(overallUsed > 0.9 ? AppTheme.red : AppTheme.primary))),
          ]),
        ),
        const SizedBox(height: 16),
        const Text('Projects', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        ...projects.map((p) {
          final used = p.budget > 0 ? (p.spentBudget / p.budget).clamp(0.0, 1.0) : 0.0;
          final remaining = p.budget - p.spentBudget;
          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(p.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
                Text('${(used * 100).toStringAsFixed(0)}%',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                        color: used > 0.9 ? AppTheme.red : AppTheme.primary)),
              ]),
              const SizedBox(height: 6),
              ClipRRect(borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(value: used, minHeight: 6,
                    backgroundColor: AppTheme.border,
                    valueColor: AlwaysStoppedAnimation<Color>(used > 0.9 ? AppTheme.red : AppTheme.primary))),
              const SizedBox(height: 6),
              Row(children: [
                Text('${p.currency} ${p.budget.toStringAsFixed(0)} total',
                    style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                const Spacer(),
                Text('Spent: ${p.currency} ${p.spentBudget.toStringAsFixed(0)}',
                    style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                const SizedBox(width: 8),
                Text('Left: ${p.currency} ${remaining.toStringAsFixed(0)}',
                    style: TextStyle(fontSize: 11, color: remaining < 0 ? AppTheme.red : AppTheme.green)),
              ]),
            ]),
          );
        }),
      ],
    );
  }
}

class _BudgetTile extends StatelessWidget {
  final String label, value;
  final Color color;
  final double w;
  const _BudgetTile(this.label, this.value, this.color, this.w);
  @override
  Widget build(BuildContext context) => Container(
    width: w, padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(10),
      boxShadow: [BoxShadow(color: color.withOpacity(0.08), blurRadius: 8, offset: const Offset(0, 2))],
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: color, letterSpacing: 0.4)),
      const SizedBox(height: 4),
      FittedBox(child: ShaderMask(
        shaderCallback: (b) => LinearGradient(colors: [color, color.withOpacity(0.7)]).createShader(b),
        child: Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
      )),
    ]),
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────────

class _ReportsTab extends StatefulWidget {
  const _ReportsTab();
  @override
  State<_ReportsTab> createState() => _ReportsTabState();
}

class _ReportsTabState extends State<_ReportsTab> {
  final _svc = ProjectService();
  List<Project> _projects = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final data = await _svc.getAll();
      if (mounted) setState(() { _projects = data; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Color _statusColor(String s) => switch (s) {
    'active' => AppTheme.green, 'planning' => AppTheme.blue,
    'on-hold' => AppTheme.amber, 'completed' => AppTheme.cyan, _ => AppTheme.red,
  };

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));

    final globalReports = [
      (Icons.analytics_outlined, 'Global Analytics', 'Status distribution, performance matrix, budget breakdown', AppTheme.blue,
          () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GlobalAnalyticsScreen()))),
      (Icons.timeline_outlined, 'Timeline Overview', 'Cross-project Gantt with search, filter & CSV export', AppTheme.purple,
          () => Navigator.push(context, MaterialPageRoute(builder: (_) => const GlobalTimelineScreen()))),
      (Icons.folder_copy_outlined, 'Project Templates', 'Create projects from templates or save as template', AppTheme.teal,
          () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProjectTemplatesScreen()))),
    ];

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: EdgeInsets.all(AppTheme.hPad(context)),
        children: [
          const _ReportSectionHeader('Global Reports'),
          const SizedBox(height: 8),
          ...globalReports.map((r) => _ReportCard(
            icon: r.$1, title: r.$2, subtitle: r.$3, color: r.$4, onTap: r.$5,
          )),
          const SizedBox(height: 16),
          // Per-project reports
          const _ReportSectionHeader('Per-Project Reports'),
          const SizedBox(height: 8),
          if (_projects.isEmpty)
            const Center(child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('No projects found', style: TextStyle(color: AppTheme.textSecondary)),
            ))
          else
            ..._projects.map((p) {
              final daysLeft = p.endDate.difference(DateTime.now()).inDays;
              final budgetUsed = p.budget > 0 ? (p.spentBudget / p.budget * 100).toStringAsFixed(0) : '—';
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => Navigator.push(context, MaterialPageRoute(
                      builder: (_) => ProjectDetailScreen(id: p.id))),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Expanded(child: Text(p.name,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700))),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: _statusColor(p.status).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(p.status, style: TextStyle(
                              fontSize: 11, fontWeight: FontWeight.w600, color: _statusColor(p.status))),
                        ),
                      ]),
                      const SizedBox(height: 8),
                      // Progress bar
                      Row(children: [
                        const Text('Progress', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                        const SizedBox(width: 8),
                        Expanded(child: ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: LinearProgressIndicator(
                            value: p.progress / 100, minHeight: 6,
                            backgroundColor: AppTheme.border,
                            valueColor: const AlwaysStoppedAnimation(AppTheme.primary),
                          ),
                        )),
                        const SizedBox(width: 8),
                        Text('${p.progress}%', style: const TextStyle(
                            fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.primary)),
                      ]),
                      const SizedBox(height: 8),
                      Row(children: [
                        _ReportMetric(Icons.account_balance_wallet_outlined,
                            'Budget', '$budgetUsed% used', AppTheme.amber),
                        const SizedBox(width: 12),
                        _ReportMetric(Icons.schedule_outlined, 'Deadline',
                            daysLeft < 0 ? 'Overdue' : '${daysLeft}d left',
                            daysLeft < 0 ? AppTheme.red : daysLeft <= 7 ? AppTheme.amber : AppTheme.green),
                        const SizedBox(width: 12),
                        _ReportMetric(Icons.group_outlined, 'Team',
                            '${p.team.length} members', AppTheme.blue),
                      ]),
                      if (p.requiredSkills.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Wrap(spacing: 4, runSpacing: 4, children: [
                          const Icon(Icons.psychology_outlined, size: 12, color: AppTheme.textMuted),
                          ...p.requiredSkills.take(4).map((s) => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withOpacity(0.06),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(s, style: const TextStyle(fontSize: 10, color: AppTheme.primary)),
                          )),
                          if (p.requiredSkills.length > 4)
                            Text('+${p.requiredSkills.length - 4} more',
                                style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                        ]),
                      ],
                      const SizedBox(height: 4),
                      Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                        Text('View full report →',
                            style: TextStyle(fontSize: 11, color: AppTheme.primary, fontWeight: FontWeight.w600)),
                      ]),
                    ]),
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}

class _ReportSectionHeader extends StatelessWidget {
  final String title;
  const _ReportSectionHeader(this.title);
  @override
  Widget build(BuildContext context) => Text(title,
      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textPrimary));
}

class _ReportCard extends StatelessWidget {
  final IconData icon; final String title, subtitle; final Color color; final VoidCallback onTap;
  const _ReportCard({required this.icon, required this.title, required this.subtitle,
      required this.color, required this.onTap});
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 10),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
    child: ListTile(
      leading: Container(
        width: 40, height: 40,
        decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
      trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.textSecondary),
      onTap: onTap,
    ),
  );
}

class _ReportMetric extends StatelessWidget {
  final IconData icon; final String label, value; final Color color;
  const _ReportMetric(this.icon, this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
    Icon(icon, size: 12, color: color),
    const SizedBox(width: 3),
    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textMuted)),
      Text(value, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
    ]),
  ]);
}
