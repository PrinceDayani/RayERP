import 'package:flutter/material.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../config/app_theme.dart';
import '../../models/task.dart';
import '../../services/task_service.dart';
import 'task_detail_screen.dart';
import 'task_form_screen.dart';
import 'task_analytics_screen.dart';
import 'task_calendar_screen.dart';
import 'task_kanban_screen.dart';
import 'task_templates_screen.dart';

class TaskListScreen extends StatefulWidget {
  final String? projectId;
  final String? projectName;
  final bool myTasksOnly;

  const TaskListScreen({
    super.key,
    this.projectId,
    this.projectName,
    this.myTasksOnly = false,
  });

  @override
  State<TaskListScreen> createState() => _TaskListScreenState();
}

class _TaskListScreenState extends State<TaskListScreen> {
  final _svc = TaskService();
  final _searchCtrl = TextEditingController();

  List<Task> _tasks = [];
  List<Task> _filtered = [];
  bool _loading = true;
  String _statusFilter = 'all';
  String _priorityFilter = 'all';
  bool _myTasks = false;
  String _searchQuery = '';

  static const _statuses = ['all', 'todo', 'in-progress', 'review', 'completed', 'blocked'];
  static const _priorities = ['all', 'low', 'medium', 'high', 'critical'];

  @override
  void initState() {
    super.initState();
    _myTasks = widget.myTasksOnly;
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      if (_myTasks) {
        _tasks = await _svc.getMyTasks();
      } else {
        _tasks = await _svc.getAll(projectId: widget.projectId);
      }
      _applyFilters();
    } catch (e) {
      if (mounted) _showError(e.toString());
    }
    if (mounted) setState(() => _loading = false);
  }

  void _applyFilters() {
    var list = _tasks.where((t) => !t.isTemplate).toList();
    if (_statusFilter != 'all') list = list.where((t) => t.status == _statusFilter).toList();
    if (_priorityFilter != 'all') list = list.where((t) => t.priority == _priorityFilter).toList();
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      list = list.where((t) =>
          t.title.toLowerCase().contains(q) ||
          t.description.toLowerCase().contains(q) ||
          (t.assignedTo?.name.toLowerCase().contains(q) ?? false)).toList();
    }
    setState(() => _filtered = list);
  }

  Future<void> _exportCsv() async {
    final rows = [
      'Title,Status,Priority,Assignee,Project,Due Date',
      ..._filtered.map((t) => '"${t.title}","${t.status}","${t.priority}","${t.assignedTo?.name ?? ''}","${t.projectName}","${t.dueDate != null ? AppTheme.fmtDate(t.dueDate!) : ''}"'),
    ];
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/tasks.csv');
    await file.writeAsString(rows.join('\n'));
    await Share.shareXFiles([XFile(file.path)], text: 'Tasks Export');
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppTheme.red),
    );
  }

  Color _statusColor(String s) => AppTheme.taskStatusColor(s);
  Color _priorityColor(String p) => AppTheme.taskPriorityColor(p);

  @override
  Widget build(BuildContext context) {
    final isProjectContext = widget.projectId != null;
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: isProjectContext
          ? null
          : AppBar(
              title: Text(_myTasks ? 'My Tasks' : 'Tasks'),
              actions: [
                IconButton(
                  icon: const Icon(Icons.download_outlined),
                  tooltip: 'Export CSV',
                  onPressed: _exportCsv,
                ),
                IconButton(
                  icon: const Icon(Icons.view_kanban_outlined),
                  tooltip: 'Kanban',
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => TaskKanbanScreen(
                        projectId: widget.projectId,
                        projectName: widget.projectName,
                      ),
                    ),
                  ).then((_) => _load()),
                ),
                IconButton(
                  icon: const Icon(Icons.calendar_month_outlined),
                  tooltip: 'Calendar',
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const TaskCalendarScreen()),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.bar_chart_outlined),
                  tooltip: 'Analytics',
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => TaskAnalyticsScreen(projectId: widget.projectId),
                    ),
                  ),
                ),
                if (widget.projectId != null)
                  IconButton(
                    icon: const Icon(Icons.folder_copy_outlined),
                    tooltip: 'Templates',
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => TaskTemplatesScreen(projectId: widget.projectId),
                      ),
                    ).then((created) { if (created == true) _load(); }),
                  ),
              ],
            ),
      body: Column(
        children: [
          _buildSearchBar(),
          _buildFilterRow(),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : RefreshIndicator(
                    onRefresh: _load,
                    color: AppTheme.primary,
                    child: _filtered.isEmpty
                        ? _buildEmpty()
                        : AppTheme.constrain(
                            LayoutBuilder(builder: (context, constraints) {
                              final wide = constraints.maxWidth >= 600;
                              if (wide) {
                                final h = AppTheme.hPad(context);
                                return GridView.builder(
                                  padding: EdgeInsets.fromLTRB(h, 8, h, 80),
                                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: constraints.maxWidth >= 900 ? 3 : 2,
                                    crossAxisSpacing: 10,
                                    mainAxisSpacing: 10,
                                    childAspectRatio: 1.6,
                                  ),
                                  itemCount: _filtered.length,
                                  itemBuilder: (_, i) => _TaskCard(
                                    task: _filtered[i],
                                    statusColor: _statusColor,
                                    priorityColor: _priorityColor,
                                    onTap: () => Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => TaskDetailScreen(taskId: _filtered[i].id),
                                      ),
                                    ).then((_) => _load()),
                                  ),
                                );
                              }
                              final h = AppTheme.hPad(context);
                              return ListView.separated(
                                padding: EdgeInsets.fromLTRB(h, 8, h, 80),
                                itemCount: _filtered.length,
                                separatorBuilder: (_, __) => const SizedBox(height: 8),
                                itemBuilder: (_, i) => _TaskCard(
                                  task: _filtered[i],
                                  statusColor: _statusColor,
                                  priorityColor: _priorityColor,
                                  onTap: () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => TaskDetailScreen(taskId: _filtered[i].id),
                                    ),
                                  ).then((_) => _load()),
                                ),
                              );
                            }),
                          ),
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'task_list_fab',
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => TaskFormScreen(
                projectId: widget.projectId,
              ),
            ),
          ).then((created) {
            if (created == true) _load();
          });
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildSearchBar() => Padding(
        padding: EdgeInsets.fromLTRB(AppTheme.hPad(context), 12, AppTheme.hPad(context), 0),
        child: TextField(
          controller: _searchCtrl,
          decoration: InputDecoration(
            hintText: 'Search tasks…',
            prefixIcon: const Icon(Icons.search, size: 20, color: AppTheme.textSecondary),
            suffixIcon: _searchQuery.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, size: 18),
                    onPressed: () {
                      _searchCtrl.clear();
                      setState(() => _searchQuery = '');
                      _applyFilters();
                    },
                  )
                : null,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),
          onChanged: (v) {
            setState(() => _searchQuery = v);
            _applyFilters();
          },
        ),
      );

  Widget _buildFilterRow() => SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.fromLTRB(AppTheme.hPad(context), 10, AppTheme.hPad(context), 4),
        child: Row(
          children: [
            // My Tasks toggle
            if (widget.projectId == null) ...[
              _FilterChip(
                label: 'My Tasks',
                selected: _myTasks,
                color: AppTheme.purple,
                onTap: () {
                  setState(() => _myTasks = !_myTasks);
                  _load();
                },
              ),
              const SizedBox(width: 6),
              Container(width: 1, height: 20, color: AppTheme.border),
              const SizedBox(width: 6),
            ],
            ..._statuses.map((s) => Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: _FilterChip(
                    label: s == 'all' ? 'All' : s,
                    selected: _statusFilter == s,
                    color: s == 'all' ? AppTheme.primary : _statusColor(s),
                    onTap: () {
                      setState(() => _statusFilter = s);
                      _applyFilters();
                    },
                  ),
                )),
            Container(width: 1, height: 20, color: AppTheme.border),
            const SizedBox(width: 6),
            ..._priorities.skip(1).map((p) => Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: _FilterChip(
                    label: p,
                    selected: _priorityFilter == p,
                    color: _priorityColor(p),
                    onTap: () {
                      setState(() => _priorityFilter = p);
                      _applyFilters();
                    },
                  ),
                )),
          ],
        ),
      );

  Widget _buildEmpty() => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.task_outlined, size: 52, color: AppTheme.textMuted),
            const SizedBox(height: 12),
            Text(
              _searchQuery.isNotEmpty ? 'No tasks match your search' : 'No tasks found',
              style: const TextStyle(color: AppTheme.textSecondary),
            ),
          ],
        ),
      );
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final Color color;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.selected,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
          decoration: BoxDecoration(
            color: selected ? color : Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: selected ? color : AppTheme.border),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: selected ? Colors.white : AppTheme.textSecondary,
              fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ),
      );
}

class _TaskCard extends StatefulWidget {
  final Task task;
  final Color Function(String) statusColor;
  final Color Function(String) priorityColor;
  final VoidCallback onTap;

  const _TaskCard({
    required this.task,
    required this.statusColor,
    required this.priorityColor,
    required this.onTap,
  });

  @override
  State<_TaskCard> createState() => _TaskCardState();
}

class _TaskCardState extends State<_TaskCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final t = widget.task;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isOverdue = t.dueDate != null &&
        t.dueDate!.isBefore(DateTime.now()) &&
        t.status != 'completed';

    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          decoration: isDark
              ? AppTheme.taskCardDark(overdue: isOverdue)
              : AppTheme.taskCard(overdue: isOverdue, hover: _hovered),
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      t.title,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  _WebBadge(t.priority,
                      AppTheme.taskPriorityColor(t.priority),
                      AppTheme.taskPriorityBg(t.priority)),
                ],
              ),
              if (t.description.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  t.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.4),
                ),
              ],
              const SizedBox(height: 10),
              const Divider(height: 1, color: Color(0xFFE5E7EB)),
              const SizedBox(height: 8),
              Row(
                children: [
                  _WebBadge(t.status,
                      AppTheme.taskStatusColor(t.status),
                      AppTheme.taskStatusBg(t.status)),
                  const SizedBox(width: 6),
                  if (t.projectName.isNotEmpty) ...[
                    const Icon(Icons.folder_outlined, size: 11, color: AppTheme.textMuted),
                    const SizedBox(width: 3),
                    Flexible(
                      child: Text(
                        t.projectName,
                        style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                  const Spacer(),
                  if (t.dueDate != null)
                    Row(
                      children: [
                        Icon(
                          Icons.calendar_today_outlined,
                          size: 11,
                          color: isOverdue ? AppTheme.red : AppTheme.textMuted,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          AppTheme.fmtDate(t.dueDate!),
                          style: TextStyle(
                            fontSize: 10,
                            color: isOverdue ? AppTheme.red : AppTheme.textMuted,
                            fontWeight: isOverdue ? FontWeight.w600 : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
              if (t.tags.isNotEmpty) ...[
                const SizedBox(height: 6),
                Wrap(
                  spacing: 4,
                  children: t.tags
                      .take(4)
                      .map((tag) => _WebBadge(
                            tag.name,
                            _hexColor(tag.color),
                            _hexColor(tag.color).withOpacity(0.12),
                          ))
                      .toList(),
                ),
              ],
              if (t.checklist.isNotEmpty || t.subtasks.isNotEmpty || t.hasActiveTimer) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    if (t.checklist.isNotEmpty) ...[
                      const Icon(Icons.checklist_outlined, size: 12, color: AppTheme.textMuted),
                      const SizedBox(width: 3),
                      Text('${t.checklistDone}/${t.checklist.length}',
                          style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                      const SizedBox(width: 8),
                    ],
                    if (t.subtasks.isNotEmpty) ...[
                      const Icon(Icons.account_tree_outlined, size: 12, color: AppTheme.textMuted),
                      const SizedBox(width: 3),
                      Text('${t.subtasks.length}',
                          style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                      const SizedBox(width: 8),
                    ],
                    if (t.hasActiveTimer) ...[
                      Container(
                        width: 6, height: 6,
                        decoration: const BoxDecoration(color: AppTheme.green, shape: BoxShape.circle),
                      ),
                      const SizedBox(width: 4),
                      const Text('Timer running',
                          style: TextStyle(fontSize: 10, color: AppTheme.green)),
                    ],
                    const Spacer(),
                    if (t.assignedTo != null)
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 9,
                            backgroundColor: AppTheme.primary.withOpacity(0.12),
                            child: Text(
                              t.assignedTo!.name.isNotEmpty
                                  ? t.assignedTo!.name[0].toUpperCase()
                                  : '?',
                              style: const TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.primary),
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(t.assignedTo!.name,
                              style: const TextStyle(
                                  fontSize: 10, color: AppTheme.textSecondary)),
                        ],
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Web-style badge: rounded-full px-2.5 py-0.5 text-xs font-semibold
class _WebBadge extends StatelessWidget {
  final String label;
  final Color color;
  final Color bg;
  const _WebBadge(this.label, this.color, this.bg);

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
        child: Text(label,
            style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
      );
}

Color _hexColor(String hex) {
  try {
    final h = hex.replaceAll('#', '');
    return Color(int.parse('FF$h', radix: 16));
  } catch (_) {
    return AppTheme.blue;
  }
}
