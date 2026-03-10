import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/task.dart';
import '../../services/task_service.dart';
import 'task_detail_screen.dart';

class TaskKanbanScreen extends StatefulWidget {
  final String? projectId;
  final String? projectName;
  const TaskKanbanScreen({super.key, this.projectId, this.projectName});

  @override
  State<TaskKanbanScreen> createState() => _TaskKanbanScreenState();
}

class _TaskKanbanScreenState extends State<TaskKanbanScreen> {
  final _svc = TaskService();
  Map<String, List<Task>> _columns = {
    'todo': [],
    'in-progress': [],
    'review': [],
    'completed': [],
    'blocked': [],
  };
  bool _loading = true;

  static const _colLabels = {
    'todo': 'Todo',
    'in-progress': 'In Progress',
    'review': 'Review',
    'completed': 'Done',
    'blocked': 'Blocked',
  };

  static const _colColors = {
    'todo': AppTheme.textSecondary,
    'in-progress': AppTheme.blue,
    'review': AppTheme.amber,
    'completed': AppTheme.green,
    'blocked': AppTheme.red,
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final tasks = await _svc.getAll(projectId: widget.projectId);
      final cols = <String, List<Task>>{
        'todo': [],
        'in-progress': [],
        'review': [],
        'completed': [],
        'blocked': [],
      };
      for (final t in tasks) {
        if (!t.isTemplate) {
          cols[t.status]?.add(t);
        }
      }
      setState(() => _columns = cols);
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.red));
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _moveTask(Task task, String newStatus) async {
    if (task.status == newStatus) return;
    try {
      await _svc.updateStatus(task.id, newStatus);
      setState(() {
        _columns[task.status]?.removeWhere((t) => t.id == task.id);
        final updated = Task(
          id: task.id, title: task.title, description: task.description,
          status: newStatus, priority: task.priority,
          projectId: task.projectId, projectName: task.projectName,
          assignedTo: task.assignedTo, assignedBy: task.assignedBy,
          dueDate: task.dueDate, estimatedHours: task.estimatedHours,
          actualHours: task.actualHours, column: newStatus, order: task.order,
          tags: task.tags, comments: task.comments, checklist: task.checklist,
          timeEntries: task.timeEntries, attachments: task.attachments,
          customFields: task.customFields, dependencies: task.dependencies,
          subtasks: task.subtasks, isRecurring: task.isRecurring,
          isTemplate: task.isTemplate, watchers: task.watchers,
          createdAt: task.createdAt, updatedAt: DateTime.now(),
        );
        _columns[newStatus]?.insert(0, updated);
      });
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.red));
    }
  }

  Color _pc(String p) => AppTheme.taskPriorityColor(p);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Text(widget.projectName != null
            ? '${widget.projectName} — Kanban'
            : 'Task Kanban'),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary))
          : RefreshIndicator(
              onRefresh: _load,
              color: AppTheme.primary,
              child: AppTheme.constrain(
                LayoutBuilder(builder: (context, constraints) {
                  final colW = constraints.maxWidth >= 600
                      ? 280.0
                      : (constraints.maxWidth * 0.78).clamp(200.0, 280.0);
                  return ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.all(12),
                    children: _columns.keys.map((status) {
                      final tasks = _columns[status]!;
                      final color = _colColors[status]!;
                      return _KanbanColumn(
                        status: status,
                        label: _colLabels[status]!,
                        color: color,
                        tasks: tasks,
                        colWidth: colW,
                        allStatuses: _columns.keys.toList(),
                        onMove: _moveTask,
                        onTap: (t) => Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (_) => TaskDetailScreen(taskId: t.id)),
                        ).then((_) => _load()),
                        priorityColor: _pc,
                      );
                    }).toList(),
                  );
                }),
              ),
            ),
    );
  }
}

class _KanbanColumn extends StatelessWidget {
  final String status, label;
  final Color color;
  final List<Task> tasks;
  final double colWidth;
  final List<String> allStatuses;
  final Future<void> Function(Task, String) onMove;
  final void Function(Task) onTap;
  final Color Function(String) priorityColor;

  const _KanbanColumn({
    required this.status,
    required this.label,
    required this.color,
    required this.tasks,
    required this.colWidth,
    required this.allStatuses,
    required this.onMove,
    required this.onTap,
    required this.priorityColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: colWidth,
      margin: const EdgeInsets.only(right: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: color.withOpacity(0.25)),
          ),
          child: Row(children: [
            Container(
                width: 8, height: 8,
                decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
            const SizedBox(width: 8),
            Text(label,
                style: TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w700, color: color)),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20)),
              child: Text('${tasks.length}',
                  style: TextStyle(
                      fontSize: 11, fontWeight: FontWeight.bold, color: color)),
            ),
          ]),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: tasks.isEmpty
              ? Container(
                  decoration: BoxDecoration(
                    color: AppTheme.border.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                        color: AppTheme.border, style: BorderStyle.solid),
                  ),
                  child: const Center(
                    child: Text('No tasks',
                        style: TextStyle(
                            fontSize: 12, color: AppTheme.textMuted)),
                  ),
                )
              : ListView.separated(
                  itemCount: tasks.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final t = tasks[i];
                    final pc = priorityColor(t.priority);
                    final isOverdue = t.dueDate != null &&
                        t.dueDate!.isBefore(DateTime.now()) &&
                        t.status != 'completed';
                    return GestureDetector(
                      onTap: () => onTap(t),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: isOverdue
                                ? const Color(0xFFFCA5A5)
                                : const Color(0xFFE5E7EB),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.04),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(children: [
                                Expanded(
                                  child: Text(t.title,
                                      style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis),
                                ),
                                Container(
                                  width: 8, height: 8,
                                  decoration: BoxDecoration(
                                    color: AppTheme.taskPriorityColor(t.priority),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ]),
                              if (t.dueDate != null) ...[
                                const SizedBox(height: 6),
                                Row(children: [
                                  Icon(Icons.calendar_today_outlined,
                                      size: 10,
                                      color: isOverdue
                                          ? AppTheme.red
                                          : AppTheme.textMuted),
                                  const SizedBox(width: 3),
                                  Text(AppTheme.fmtDate(t.dueDate!),
                                      style: TextStyle(
                                          fontSize: 10,
                                          color: isOverdue
                                              ? AppTheme.red
                                              : AppTheme.textMuted)),
                                ]),
                              ],
                              if (t.assignedTo != null) ...[
                                const SizedBox(height: 4),
                                Text(t.assignedTo!.name,
                                    style: const TextStyle(
                                        fontSize: 10,
                                        color: AppTheme.textSecondary)),
                              ],
                              const SizedBox(height: 6),
                              PopupMenuButton<String>(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: AppTheme.bg,
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: AppTheme.border),
                                  ),
                                  child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.swap_horiz,
                                            size: 12,
                                            color: AppTheme.textSecondary),
                                        const SizedBox(width: 4),
                                        const Text('Move',
                                            style: TextStyle(
                                                fontSize: 10,
                                                color: AppTheme.textSecondary)),
                                      ]),
                                ),
                                onSelected: (s) => onMove(t, s),
                                itemBuilder: (_) => allStatuses
                                    .where((s) => s != status)
                                    .map((s) => PopupMenuItem(
                                          value: s,
                                          child: Text(s,
                                              style: const TextStyle(
                                                  fontSize: 13)),
                                        ))
                                    .toList(),
                              ),
                            ]),
                      ),
                    );
                  },
                ),
        ),
      ]),
    );
  }
}
