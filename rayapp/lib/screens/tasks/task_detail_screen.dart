import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import '../../config/app_theme.dart';
import '../../models/task.dart';
import '../../services/task_service.dart';
import '../../services/auth_provider.dart';
import 'task_form_screen.dart';
import 'task_recurring_screen.dart';
import 'task_dependencies_screen.dart';

class TaskDetailScreen extends StatefulWidget {
  final String taskId;
  const TaskDetailScreen({super.key, required this.taskId});

  @override
  State<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends State<TaskDetailScreen>
    with SingleTickerProviderStateMixin {
  final _svc = TaskService();
  late TabController _tabs;
  Task? _task;
  bool _loading = true;
  final _commentCtrl = TextEditingController();
  final _checkCtrl = TextEditingController();
  final bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 6, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    _commentCtrl.dispose();
    _checkCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _task = await _svc.getById(widget.taskId);
    } catch (e) {
      if (mounted) _err(e.toString());
    }
    if (mounted) setState(() => _loading = false);
  }

  void _err(String msg) => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), backgroundColor: AppTheme.red),
      );

  void _ok(String msg) => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), backgroundColor: AppTheme.green),
      );

  Color _sc(String s) => AppTheme.taskStatusColor(s);
  Color _pc(String p) => AppTheme.taskPriorityColor(p);

  Future<void> _changeStatus(String status) async {
    final auth = context.read<AuthProvider>();
    try {
      await _svc.updateStatus(widget.taskId, status, userId: auth.user?.id);
      await _load();
      _ok('Status updated');
    } catch (e) {
      _err(e.toString());
    }
  }

  void _openRecurring() => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => TaskRecurringScreen(task: _task!)),
      ).then((updated) { if (updated == true) _load(); });

  void _openDependencies() => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => TaskDependenciesScreen(task: _task!)),
      ).then((updated) { if (updated == true) _load(); });

  Future<void> _addSubtask(String title) async {
    try {
      await _svc.addSubtask(widget.taskId, {
        'title': title,
        'project': _task!.projectId,
      });
      await _load();
      _ok('Subtask added');
    } catch (e) {
      _err(e.toString());
    }
  }

  Future<void> _addTag(String name, String color) async {
    try {
      await _svc.addTag(widget.taskId, name, color: color);
      await _load();
      _ok('Tag added');
    } catch (e) {
      _err(e.toString());
    }
  }

  Future<void> _clone() async {
    try {
      await _svc.clone(widget.taskId);
      if (mounted) { _ok('Task cloned'); Navigator.pop(context, true); }
    } catch (e) { _err(e.toString()); }
  }

  Future<void> _delete() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Task', style: TextStyle(fontSize: 15)),
        content: const Text('This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Delete', style: TextStyle(color: AppTheme.red))),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await _svc.deleteTask(widget.taskId);
      if (mounted) Navigator.pop(context, true);
    } catch (e) { _err(e.toString()); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Text(_task?.title ?? 'Task', overflow: TextOverflow.ellipsis),
        actions: [
          if (_task != null) ...[
            PopupMenuButton<String>(
              icon: const Icon(Icons.swap_horiz_outlined),
              tooltip: 'Change Status',
              onSelected: _changeStatus,
              itemBuilder: (_) => ['todo', 'in-progress', 'review', 'completed', 'blocked']
                  .map((s) => PopupMenuItem(
                        value: s,
                        child: Row(children: [
                          Container(
                            width: 8, height: 8,
                            decoration: BoxDecoration(color: _sc(s), shape: BoxShape.circle),
                          ),
                          const SizedBox(width: 8),
                          Text(s, style: const TextStyle(fontSize: 13)),
                        ]),
                      ))
                  .toList(),
            ),
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Edit',
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => TaskFormScreen(
                    task: _task,
                    projectId: _task!.projectId,
                  ),
                ),
              ).then((updated) { if (updated == true) _load(); }),
            ),
            IconButton(
              icon: const Icon(Icons.copy_outlined),
              tooltip: 'Clone',
              onPressed: _clone,
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline, color: AppTheme.red),
              tooltip: 'Delete',
              onPressed: _delete,
            ),
          ],
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _task == null
              ? const Center(child: Text('Task not found'))
              : AppTheme.constrain(_buildBody()),
    );
  }

  Widget _buildBody() {
    final t = _task!;
    return NestedScrollView(
      headerSliverBuilder: (_, _) => [
        SliverToBoxAdapter(child: _buildHeader(t)),
        SliverToBoxAdapter(
          child: TabBar(
            controller: _tabs,
            isScrollable: true,
            labelColor: AppTheme.primary,
            unselectedLabelColor: AppTheme.textSecondary,
            indicatorColor: AppTheme.primary,
            indicatorSize: TabBarIndicatorSize.label,
            labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
            labelPadding: const EdgeInsets.symmetric(horizontal: 10),
            tabs: const [
              Tab(text: 'Details'),
              Tab(text: 'Checklist'),
              Tab(text: 'Comments'),
              Tab(text: 'Time'),
              Tab(text: 'Attachments'),
              Tab(text: 'Dependencies'),
            ],
          ),
        ),
      ],
      body: TabBarView(
        controller: _tabs,
        children: [
          _DetailsTab(
            task: t,
            sc: _sc,
            pc: _pc,
            onAddSubtask: _addSubtask,
            onManageRecurring: _openRecurring,
            svc: _svc,
            onRefresh: _load,
          ),
          _ChecklistTab(task: t, svc: _svc, onRefresh: _load, ctrl: _checkCtrl),
          _CommentsTab(task: t, svc: _svc, onRefresh: _load, ctrl: _commentCtrl),
          _TimeTab(task: t, svc: _svc, onRefresh: _load),
          _AttachmentsTab(task: t, svc: _svc, onRefresh: _load),
          _DependenciesTab(
            task: t,
            svc: _svc,
            onRefresh: _load,
            onManage: _openDependencies,
          ),
        ],
      ),
    );
  }

  void _showAddTagDialog() {
    final ctrl = TextEditingController();
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#06b6d4', '#ec4899', '#6b7280',
    ];
    String selected = colors[0];
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Text('Add Tag', style: TextStyle(fontSize: 15)),
          content: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(
              controller: ctrl,
              autofocus: true,
              decoration: const InputDecoration(
                labelText: 'Tag name',
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              children: colors.map((c) => GestureDetector(
                onTap: () => setS(() => selected = c),
                child: Container(
                  width: 24, height: 24,
                  decoration: BoxDecoration(
                    color: _hexColor(c),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: selected == c ? Colors.black54 : Colors.transparent,
                      width: 2,
                    ),
                  ),
                ),
              )).toList(),
            ),
          ]),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                final name = ctrl.text.trim();
                if (name.isEmpty) return;
                Navigator.pop(ctx);
                _addTag(name, selected);
              },
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(Task t) {
    final sc = _sc(t.status);
    final pc = _pc(t.priority);
    final isOverdue = t.dueDate != null &&
        t.dueDate!.isBefore(DateTime.now()) &&
        t.status != 'completed';
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        border: Border(
          bottom: BorderSide(color: Theme.of(context).dividerColor),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: EdgeInsets.all(AppTheme.hPad(context)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          _WebBadge(t.status, AppTheme.taskStatusColor(t.status), AppTheme.taskStatusBg(t.status)),
          const SizedBox(width: 8),
          _WebBadge(t.priority, AppTheme.taskPriorityColor(t.priority), AppTheme.taskPriorityBg(t.priority)),
          if (t.isRecurring) ...[
            const SizedBox(width: 8),
            _WebBadge('recurring', AppTheme.purple, AppTheme.purple.withOpacity(0.1)),
          ],
          if (t.isTemplate) ...[
            const SizedBox(width: 8),
            _WebBadge('template', AppTheme.cyan, AppTheme.cyan.withOpacity(0.1)),
          ],
        ]),
        const SizedBox(height: 10),
        Text(t.title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        if (t.description.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(t.description,
              style: const TextStyle(
                  fontSize: 13, color: AppTheme.textSecondary, height: 1.4)),
        ],
        const SizedBox(height: 12),
        Wrap(spacing: 16, runSpacing: 8, children: [
          if (t.assignedTo != null)
            _InfoItem(Icons.person_outline, 'Assigned', t.assignedTo!.name),
          if (t.assignedBy != null)
            _InfoItem(Icons.person_add_outlined, 'By', t.assignedBy!.name),
          if (t.dueDate != null)
            _InfoItem(
              Icons.calendar_today_outlined,
              'Due',
              AppTheme.fmtDate(t.dueDate!),
              color: isOverdue ? AppTheme.red : null,
            ),
          if (t.projectName != null && t.projectName!.isNotEmpty)
            _InfoItem(Icons.folder_outlined, 'Project', t.projectName!),
          _InfoItem(Icons.timer_outlined, 'Est.',
              '${t.estimatedHours.toStringAsFixed(1)}h'),
          _InfoItem(Icons.access_time_outlined, 'Logged',
              '${(t.totalLoggedMinutes / 60).toStringAsFixed(1)}h'),
        ]),
        if (t.tags.isNotEmpty || true) ...[
          const SizedBox(height: 10),
          Row(children: [
            Expanded(
              child: Wrap(
                spacing: 6,
                runSpacing: 4,
                children: t.tags
                    .map((tag) => Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: _hexColor(tag.color).withOpacity(0.12),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                                color: _hexColor(tag.color).withOpacity(0.3)),
                          ),
                          child: Text(tag.name,
                              style: TextStyle(
                                  fontSize: 11, color: _hexColor(tag.color))),
                        ))
                    .toList(),
              ),
            ),
            GestureDetector(
              onTap: () => _showAddTagDialog(),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
                ),
                child: const Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.add, size: 12, color: AppTheme.primary),
                  SizedBox(width: 3),
                  Text('Tag', style: TextStyle(fontSize: 11, color: AppTheme.primary)),
                ]),
              ),
            ),
          ]),
        ],
        if (t.checklist.isNotEmpty) ...[
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: t.checklist.isEmpty
                  ? 0
                  : t.checklistDone / t.checklist.length,
              minHeight: 5,
              backgroundColor: AppTheme.border,
              valueColor:
                  const AlwaysStoppedAnimation<Color>(AppTheme.green),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${t.checklistDone}/${t.checklist.length} checklist items done',
            style: const TextStyle(
                fontSize: 11, color: AppTheme.textSecondary),
          ),
        ],
      ]),
    );
  }
}

// ── Details Tab ───────────────────────────────────────────────────────────────

class _DetailsTab extends StatelessWidget {
  final Task task;
  final Color Function(String) sc;
  final Color Function(String) pc;
  final Future<void> Function(String) onAddSubtask;
  final VoidCallback onManageRecurring;
  final TaskService svc;
  final VoidCallback onRefresh;
  const _DetailsTab({
    required this.task,
    required this.sc,
    required this.pc,
    required this.onAddSubtask,
    required this.onManageRecurring,
    required this.svc,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(AppTheme.hPad(context)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text('Subtasks',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          _AddInlineButton(
            label: 'Add Subtask',
            onSubmit: onAddSubtask,
          ),
        ]),
        const SizedBox(height: 8),
        if (task.subtasks.isNotEmpty) ...[
          ...task.subtasks.map((s) => Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(children: [
                  Container(
                    width: 8, height: 8,
                    decoration: BoxDecoration(
                        color: sc(s.status), shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                      child: Text(s.title,
                          style: const TextStyle(fontSize: 12))),
                  _Chip(s.status, sc(s.status)),
                ]),
              )),
        ] else
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text('No subtasks yet',
                style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
          ),
        const SizedBox(height: 8),
        if (task.customFields.isNotEmpty) ...[
          const Text('Custom Fields',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.border),
            ),
            child: Column(
              children: task.customFields.asMap().entries.map((e) {
                final isLast = e.key == task.customFields.length - 1;
                final cf = e.value;
                return Column(children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 10),
                    child: Row(children: [
                      Expanded(
                          flex: 2,
                          child: Text(cf.fieldName,
                              style: const TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.textSecondary))),
                      Expanded(
                          flex: 3,
                          child: Text(
                            cf.value?.toString() ?? '—',
                            style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500),
                          )),
                    ]),
                  ),
                  if (!isLast)
                    const Divider(height: 1, color: AppTheme.border),
                ]);
              }).toList(),
            ),
          ),
          const SizedBox(height: 16),
        ],
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text('Recurrence',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          GestureDetector(
            onTap: onManageRecurring,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppTheme.purple.withOpacity(0.08),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.purple.withOpacity(0.3)),
              ),
              child: const Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.settings_outlined, size: 12, color: AppTheme.purple),
                SizedBox(width: 3),
                Text('Manage', style: TextStyle(fontSize: 11, color: AppTheme.purple)),
              ]),
            ),
          ),
        ]),
        const SizedBox(height: 8),
        if (task.recurrencePattern != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.purple.withOpacity(0.06),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.purple.withOpacity(0.2)),
            ),
            child: Row(children: [
              const Icon(Icons.repeat, size: 16, color: AppTheme.purple),
              const SizedBox(width: 8),
              Text(
                task.isRecurring
                    ? task.recurrencePattern!
                    : 'Disabled — ${task.recurrencePattern!}',
                style: TextStyle(
                    fontSize: 13,
                    color: task.isRecurring ? AppTheme.purple : AppTheme.textSecondary),
              ),
            ]),
          ),
        ] else
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text('Not recurring',
                style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
          ),
        const SizedBox(height: 16),
        const Text('Activity',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        _InfoRow('Created', AppTheme.fmtDate(task.createdAt)),
        _InfoRow('Updated', AppTheme.fmtDate(task.updatedAt)),
        _InfoRow('Est. Hours', '${task.estimatedHours.toStringAsFixed(1)}h'),
        _InfoRow('Actual Hours', '${task.actualHours.toStringAsFixed(1)}h'),
        const SizedBox(height: 12),
        if (task.status == 'blocked' && task.blockedBy != null && task.blockedBy!.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.red.withOpacity(0.08),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.red.withOpacity(0.3)),
            ),
            child: Row(children: [
              const Icon(Icons.block, size: 16, color: AppTheme.red),
              const SizedBox(width: 8),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Blocked',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.red)),
                  Text(task.blockedBy!,
                      style: const TextStyle(
                          fontSize: 11, color: AppTheme.textSecondary)),
                ]),
              ),
            ]),
          ),
          const SizedBox(height: 12),
        ],
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('Watchers (${task.watchers.length})',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          _WatchButton(task: task, svc: svc, onRefresh: onRefresh),
        ]),
        const SizedBox(height: 6),
        if (task.watchers.isNotEmpty)
          Wrap(
            spacing: 6, runSpacing: 4,
            children: task.watchers.map((w) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppTheme.blue.withOpacity(0.08),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.blue.withOpacity(0.2)),
              ),
              child: Text(w.name, style: const TextStyle(fontSize: 11, color: AppTheme.blue)),
            )).toList(),
          )
        else
          const Text('No watchers', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
      ]),
    );
  }
}

// ── Checklist Tab ─────────────────────────────────────────────────────────────

class _ChecklistTab extends StatefulWidget {
  final Task task;
  final TaskService svc;
  final VoidCallback onRefresh;
  final TextEditingController ctrl;
  const _ChecklistTab(
      {required this.task,
      required this.svc,
      required this.onRefresh,
      required this.ctrl});

  @override
  State<_ChecklistTab> createState() => _ChecklistTabState();
}

class _ChecklistTabState extends State<_ChecklistTab> {
  bool _adding = false;

  Future<void> _toggle(ChecklistItem item) async {
    try {
      await widget.svc
          .updateChecklistItem(widget.task.id, item.id, !item.completed);
      widget.onRefresh();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.red));
      }
    }
  }

  Future<void> _add() async {
    final text = widget.ctrl.text.trim();
    if (text.isEmpty) return;
    setState(() => _adding = true);
    try {
      await widget.svc.addChecklistItem(widget.task.id, text);
      widget.ctrl.clear();
      widget.onRefresh();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.red));
      }
    }
    if (mounted) setState(() => _adding = false);
  }

  Future<void> _delete(String itemId) async {
    try {
      await widget.svc.deleteChecklistItem(widget.task.id, itemId);
      widget.onRefresh();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.red));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.task.checklist;
    return Column(children: [
      Expanded(
        child: items.isEmpty
            ? Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.checklist_outlined,
                    size: 48, color: AppTheme.textMuted),
                const SizedBox(height: 12),
                const Text('No checklist items',
                    style: TextStyle(color: AppTheme.textSecondary)),
              ]))
            : ListView.separated(
                padding: EdgeInsets.all(AppTheme.hPad(context)),
                itemCount: items.length,
                separatorBuilder: (_, _) => const SizedBox(height: 6),
                itemBuilder: (_, i) {
                  final item = items[i];
                  return Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    child: ListTile(
                      dense: true,
                      leading: GestureDetector(
                        onTap: () => _toggle(item),
                        child: Icon(
                          item.completed
                              ? Icons.check_circle
                              : Icons.radio_button_unchecked,
                          color: item.completed
                              ? AppTheme.green
                              : AppTheme.textSecondary,
                          size: 20,
                        ),
                      ),
                      title: Text(
                        item.text,
                        style: TextStyle(
                          fontSize: 13,
                          decoration: item.completed
                              ? TextDecoration.lineThrough
                              : null,
                          color: item.completed
                              ? AppTheme.textSecondary
                              : AppTheme.textPrimary,
                        ),
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete_outline,
                            size: 16, color: AppTheme.textMuted),
                        onPressed: () => _delete(item.id),
                      ),
                    ),
                  );
                },
              ),
      ),
      Container(
        padding: EdgeInsets.only(
          left: 16, right: 16, top: 8,
          bottom: MediaQuery.of(context).viewInsets.bottom + 12,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppTheme.border)),
        ),
        child: Row(children: [
          Expanded(
            child: TextField(
              controller: widget.ctrl,
              decoration: const InputDecoration(
                hintText: 'Add checklist item…',
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
              onSubmitted: (_) => _add(),
            ),
          ),
          const SizedBox(width: 8),
          _adding
              ? const SizedBox(
                  width: 36, height: 36,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: AppTheme.primary))
              : IconButton(
                  icon: const Icon(Icons.add_circle,
                      color: AppTheme.primary, size: 28),
                  onPressed: _add,
                ),
        ]),
      ),
    ]);
  }
}

// ── Comments Tab ──────────────────────────────────────────────────────────────

class _CommentsTab extends StatefulWidget {
  final Task task;
  final TaskService svc;
  final VoidCallback onRefresh;
  final TextEditingController ctrl;
  const _CommentsTab(
      {required this.task,
      required this.svc,
      required this.onRefresh,
      required this.ctrl});

  @override
  State<_CommentsTab> createState() => _CommentsTabState();
}

class _CommentsTabState extends State<_CommentsTab> {
  bool _posting = false;

  Future<void> _post() async {
    final text = widget.ctrl.text.trim();
    if (text.isEmpty) return;
    final auth = context.read<AuthProvider>();
    if (auth.user == null) return;
    setState(() => _posting = true);
    try {
      await widget.svc.addComment(widget.task.id, text, auth.user!.id);
      widget.ctrl.clear();
      widget.onRefresh();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.red));
      }
    }
    if (mounted) setState(() => _posting = false);
  }

  @override
  Widget build(BuildContext context) {
    final comments = widget.task.comments;
    return Column(children: [
      Expanded(
        child: comments.isEmpty
            ? Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.chat_bubble_outline,
                    size: 48, color: AppTheme.textMuted),
                const SizedBox(height: 12),
                const Text('No comments yet',
                    style: TextStyle(color: AppTheme.textSecondary)),
              ]))
            : ListView.separated(
                padding: EdgeInsets.all(AppTheme.hPad(context)),
                itemCount: comments.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  final c = comments[i];
                  final name = c.user?.name ?? 'Unknown';
                  final initials = name.isNotEmpty ? name[0].toUpperCase() : '?';
                  return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          radius: 14,
                          backgroundColor:
                              AppTheme.primary.withOpacity(0.1),
                          child: Text(initials,
                              style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.primary)),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Theme.of(context).cardColor,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFE5E7EB)),
                            ),
                            child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(children: [
                                    Text(name,
                                        style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600)),
                                    const Spacer(),
                                    Text(AppTheme.fmtDate(c.createdAt),
                                        style: const TextStyle(
                                            fontSize: 10,
                                            color: AppTheme.textSecondary)),
                                  ]),
                                  const SizedBox(height: 4),
                                  Text(c.comment,
                                      style: const TextStyle(
                                          fontSize: 13, height: 1.4)),
                                ]),
                          ),
                        ),
                      ]);
                },
              ),
      ),
      Container(
        padding: EdgeInsets.only(
          left: 16, right: 16, top: 8,
          bottom: MediaQuery.of(context).viewInsets.bottom + 12,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppTheme.border)),
        ),
        child: Row(children: [
          Expanded(
            child: TextField(
              controller: widget.ctrl,
              maxLines: null,
              decoration: const InputDecoration(
                hintText: 'Write a comment…',
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
          ),
          const SizedBox(width: 8),
          _posting
              ? const SizedBox(
                  width: 36, height: 36,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: AppTheme.primary))
              : IconButton(
                  icon: const Icon(Icons.send, color: AppTheme.primary),
                  onPressed: _post,
                ),
        ]),
      ),
    ]);
  }
}

// ── Time Tracking Tab ─────────────────────────────────────────────────────────

class _TimeTab extends StatefulWidget {
  final Task task;
  final TaskService svc;
  final VoidCallback onRefresh;
  const _TimeTab(
      {required this.task, required this.svc, required this.onRefresh});

  @override
  State<_TimeTab> createState() => _TimeTabState();
}

class _TimeTabState extends State<_TimeTab> {
  bool _busy = false;

  Future<void> _start() async {
    final auth = context.read<AuthProvider>();
    if (auth.user == null) return;
    setState(() => _busy = true);
    try {
      await widget.svc.startTimer(widget.task.id, auth.user!.id);
      widget.onRefresh();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.red));
      }
    }
    if (mounted) setState(() => _busy = false);
  }

  Future<void> _stop() async {
    final auth = context.read<AuthProvider>();
    if (auth.user == null) return;
    setState(() => _busy = true);
    try {
      await widget.svc.stopTimer(widget.task.id, auth.user!.id);
      widget.onRefresh();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.red));
      }
    }
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    final entries = widget.task.timeEntries;
    final totalMin = widget.task.totalLoggedMinutes;
    final hasActive = widget.task.hasActiveTimer;

    return SingleChildScrollView(
      padding: EdgeInsets.all(AppTheme.hPad(context)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE5E7EB)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Total Logged',
                  style: TextStyle(
                      fontSize: 11, color: AppTheme.textSecondary)),
              Text(
                '${(totalMin / 60).toStringAsFixed(1)}h',
                style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primary),
              ),
              Text('Est: ${widget.task.estimatedHours.toStringAsFixed(1)}h',
                  style: const TextStyle(
                      fontSize: 11, color: AppTheme.textSecondary)),
            ]),
            const Spacer(),
            _busy
                ? const CircularProgressIndicator(color: AppTheme.primary)
                : ElevatedButton.icon(
                    onPressed: hasActive ? _stop : _start,
                    icon: Icon(hasActive ? Icons.stop : Icons.play_arrow,
                        size: 18),
                    label: Text(hasActive ? 'Stop' : 'Start'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          hasActive ? AppTheme.red : AppTheme.green,
                    ),
                  ),
          ]),
        ),
        if (hasActive) ...[
          const SizedBox(height: 8),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.green.withOpacity(0.08),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.green.withOpacity(0.3)),
            ),
            child: const Row(children: [
              Icon(Icons.fiber_manual_record,
                  size: 10, color: AppTheme.green),
              SizedBox(width: 6),
              Text('Timer is running',
                  style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.green,
                      fontWeight: FontWeight.w600)),
            ]),
          ),
        ],
        if (entries.isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text('Time Entries',
              style:
                  TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          ...entries.map((e) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                      color: e.isActive
                          ? AppTheme.green.withOpacity(0.4)
                          : const Color(0xFFE5E7EB)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(children: [
                  Icon(
                    e.isActive
                        ? Icons.timer_outlined
                        : Icons.timer_off_outlined,
                    size: 16,
                    color: e.isActive
                        ? AppTheme.green
                        : AppTheme.textSecondary,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${AppTheme.fmtDate(e.startTime)} ${AppTheme.fmtTime(e.startTime)}',
                            style: const TextStyle(fontSize: 12),
                          ),
                          if (e.description != null &&
                              e.description!.isNotEmpty)
                            Text(e.description!,
                                style: const TextStyle(
                                    fontSize: 11,
                                    color: AppTheme.textSecondary)),
                        ]),
                  ),
                  Text(
                    e.isActive
                        ? 'Running'
                        : '${e.duration}m',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: e.isActive
                          ? AppTheme.green
                          : AppTheme.textPrimary,
                    ),
                  ),
                ]),
              )),
        ],
      ]),
    );
  }
}

// ── Attachments Tab ───────────────────────────────────────────────────────────

class _AttachmentsTab extends StatefulWidget {
  final Task task;
  final TaskService svc;
  final VoidCallback onRefresh;
  const _AttachmentsTab({required this.task, required this.svc, required this.onRefresh});

  @override
  State<_AttachmentsTab> createState() => _AttachmentsTabState();
}

class _AttachmentsTabState extends State<_AttachmentsTab> {
  bool _uploading = false;

  Future<void> _upload() async {
    final result = await FilePicker.platform.pickFiles();
    if (result == null || result.files.single.path == null) return;
    setState(() => _uploading = true);
    try {
      await widget.svc.uploadAttachment(widget.task.id, result.files.single.path!);
      widget.onRefresh();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.red));
      }
    }
    if (mounted) setState(() => _uploading = false);
  }

  IconData _icon(String mime) {
    if (mime.contains('image')) return Icons.image_outlined;
    if (mime.contains('pdf')) return Icons.picture_as_pdf_outlined;
    if (mime.contains('sheet') || mime.contains('excel')) return Icons.table_chart_outlined;
    if (mime.contains('word') || mime.contains('document')) return Icons.description_outlined;
    if (mime.contains('zip') || mime.contains('rar')) return Icons.folder_zip_outlined;
    return Icons.insert_drive_file_outlined;
  }

  @override
  Widget build(BuildContext context) {
    final attachments = widget.task.attachments;
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        child: Row(mainAxisAlignment: MainAxisAlignment.end, children: [
          _uploading
              ? const SizedBox(width: 24, height: 24,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary))
              : ElevatedButton.icon(
                  onPressed: _upload,
                  icon: const Icon(Icons.upload_outlined, size: 16),
                  label: const Text('Upload', style: TextStyle(fontSize: 12)),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
        ]),
      ),
      Expanded(
        child: attachments.isEmpty
            ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.attach_file, size: 48, color: AppTheme.textMuted),
                const SizedBox(height: 12),
                const Text('No attachments', style: TextStyle(color: AppTheme.textSecondary)),
              ]))
            : ListView.separated(
                padding: EdgeInsets.all(AppTheme.hPad(context)),
                itemCount: attachments.length,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (_, i) {
                  final a = attachments[i];
                  return Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(children: [
                      Container(
                        width: 36, height: 36,
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(_icon(a.mimetype), color: AppTheme.primary, size: 18),
                      ),
                      const SizedBox(width: 10),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(a.originalName,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                        Text('${a.sizeLabel} · ${AppTheme.fmtDate(a.uploadedAt)}',
                            style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
                      ])),
                    ]),
                  );
                },
              ),
      ),
    ]);
  }
}

// ── Dependencies Tab ──────────────────────────────────────────────────────────

class _DependenciesTab extends StatelessWidget {
  final Task task;
  final TaskService svc;
  final VoidCallback onRefresh;
  final VoidCallback onManage;
  const _DependenciesTab({
    required this.task,
    required this.svc,
    required this.onRefresh,
    required this.onManage,
  });

  @override
  Widget build(BuildContext context) {
    final deps = task.dependencies;
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('${deps.length} dependenc${deps.length == 1 ? 'y' : 'ies'}',
              style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
          ElevatedButton.icon(
            onPressed: onManage,
            icon: const Icon(Icons.add, size: 14),
            label: const Text('Manage', style: TextStyle(fontSize: 12)),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
          ),
        ]),
      ),
      Expanded(
        child: deps.isEmpty
            ? Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.account_tree_outlined,
                    size: 48, color: AppTheme.textMuted),
                const SizedBox(height: 12),
                const Text('No dependencies',
                    style: TextStyle(color: AppTheme.textSecondary)),
                const SizedBox(height: 8),
                TextButton.icon(
                  onPressed: onManage,
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Add Dependency'),
                ),
              ]))
            : ListView.separated(
                padding: EdgeInsets.all(AppTheme.hPad(context)),
                itemCount: deps.length,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (_, i) {
                  final d = deps[i];
                  return Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(children: [
                      const Icon(Icons.link,
                          size: 16, color: AppTheme.textSecondary),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                d.taskTitle.isNotEmpty ? d.taskTitle : d.taskId,
                                style: const TextStyle(
                                    fontSize: 12, fontWeight: FontWeight.w500),
                              ),
                              Text(d.type,
                                  style: const TextStyle(
                                      fontSize: 10,
                                      color: AppTheme.textSecondary)),
                            ]),
                      ),
                    ]),
                  );
                },
              ),
      ),
    ]);
  }
}

// ── Watch Button ─────────────────────────────────────────────────────────────

class _WatchButton extends StatefulWidget {
  final Task task;
  final TaskService svc;
  final VoidCallback onRefresh;
  const _WatchButton({required this.task, required this.svc, required this.onRefresh});
  @override
  State<_WatchButton> createState() => _WatchButtonState();
}

class _WatchButtonState extends State<_WatchButton> {
  bool _busy = false;
  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    final userId = auth.user?.id ?? '';
    final watching = widget.task.watchers.any((w) => w.id == userId);
    return GestureDetector(
      onTap: _busy ? null : () async {
        setState(() => _busy = true);
        try {
          if (watching) {
            await widget.svc.removeWatcher(widget.task.id, userId);
          } else {
            await widget.svc.addWatcher(widget.task.id, userId);
          }
          widget.onRefresh();
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.red));
          }
        }
        if (mounted) setState(() => _busy = false);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: (watching ? AppTheme.blue : AppTheme.primary).withOpacity(0.08),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: (watching ? AppTheme.blue : AppTheme.primary).withOpacity(0.3)),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(watching ? Icons.visibility : Icons.visibility_outlined,
              size: 12, color: watching ? AppTheme.blue : AppTheme.primary),
          const SizedBox(width: 3),
          Text(watching ? 'Unwatch' : 'Watch',
              style: TextStyle(fontSize: 11, color: watching ? AppTheme.blue : AppTheme.primary)),
        ]),
      ),
    );
  }
}

// ── Shared Widgets ────────────────────────────────────────────────────────────

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

// Alias so existing _Chip(label, color) calls still compile
class _Chip extends StatelessWidget {
  final String label;
  final Color color;
  const _Chip(this.label, this.color);
  @override
  Widget build(BuildContext context) =>
      _WebBadge(label, color, color.withOpacity(0.12));
}

class _InfoItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? color;
  const _InfoItem(this.icon, this.label, this.value, {this.color});

  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 13, color: AppTheme.textMuted),
        const SizedBox(width: 4),
        Text('$label: ',
            style: const TextStyle(
                fontSize: 11, color: AppTheme.textSecondary)),
        Text(value,
            style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: color ?? AppTheme.textPrimary)),
      ]);
}

class _InfoRow extends StatelessWidget {
  final String label, value;
  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(children: [
          Expanded(
            flex: 2,
            child: Text(label,
                style: const TextStyle(
                    fontSize: 12, color: AppTheme.textSecondary))),
          Expanded(
            flex: 3,
            child: Text(value,
                style: const TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w500))),
        ]),
      );
}

// ── Add Inline Button ────────────────────────────────────────────────────────

class _AddInlineButton extends StatefulWidget {
  final String label;
  final Future<void> Function(String) onSubmit;
  const _AddInlineButton({required this.label, required this.onSubmit});

  @override
  State<_AddInlineButton> createState() => _AddInlineButtonState();
}

class _AddInlineButtonState extends State<_AddInlineButton> {
  bool _expanded = false;
  bool _saving = false;
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    setState(() => _saving = true);
    await widget.onSubmit(text);
    _ctrl.clear();
    if (mounted) setState(() { _saving = false; _expanded = false; });
  }

  @override
  Widget build(BuildContext context) {
    if (!_expanded) {
      return GestureDetector(
        onTap: () => setState(() => _expanded = true),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: AppTheme.primary.withOpacity(0.08),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.add, size: 12, color: AppTheme.primary),
            const SizedBox(width: 3),
            Text(widget.label,
                style: const TextStyle(fontSize: 11, color: AppTheme.primary)),
          ]),
        ),
      );
    }
    return Row(children: [
      Expanded(
        child: TextField(
          controller: _ctrl,
          autofocus: true,
          decoration: InputDecoration(
            hintText: widget.label,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            isDense: true,
          ),
          style: const TextStyle(fontSize: 12),
          onSubmitted: (_) => _submit(),
        ),
      ),
      const SizedBox(width: 6),
      _saving
          ? const SizedBox(
              width: 20, height: 20,
              child: CircularProgressIndicator(
                  strokeWidth: 2, color: AppTheme.primary))
          : IconButton(
              icon: const Icon(Icons.check_circle,
                  color: AppTheme.green, size: 22),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              onPressed: _submit,
            ),
      IconButton(
        icon: const Icon(Icons.cancel_outlined,
            color: AppTheme.textSecondary, size: 22),
        padding: EdgeInsets.zero,
        constraints: const BoxConstraints(),
        onPressed: () {
          _ctrl.clear();
          setState(() => _expanded = false);
        },
      ),
    ]);
  }
}

Color _hexColor(String hex) {
  try {
    final h = hex.replaceAll('#', '');
    return Color(int.parse('FF$h', radix: 16));
  } catch (_) {
    return AppTheme.blue;
  }
}
