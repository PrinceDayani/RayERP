import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../services/task_service.dart';

class ProjectTimelineScreen extends StatefulWidget {
  final Project project;
  const ProjectTimelineScreen({super.key, required this.project});
  @override
  State<ProjectTimelineScreen> createState() => _ProjectTimelineScreenState();
}

class _ProjectTimelineScreenState extends State<ProjectTimelineScreen> {
  List<ProjectTask> _tasks = [];
  bool _loading = true;
  String _filter = 'all';

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try { _tasks = await TaskService().getByProject(widget.project.id); } catch (_) {}
    setState(() => _loading = false);
  }

  List<ProjectTask> get _filtered =>
      _filter == 'all' ? _tasks : _tasks.where((t) => t.status == _filter).toList();

  void _exportCsv() {
    final lines = ['Title,Status,Priority,Due Date,Assignee'];
    for (final t in _filtered) {
      lines.add('"${t.title}","${t.status}","${t.priority}","${AppTheme.fmtDate(t.dueDate)}","${t.assigneeName}"');
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('CSV ready (${lines.length - 1} rows) — integrate with file_saver to save')));
  }

  Color _sc(String s) => switch (s) {
    'completed' => AppTheme.green, 'in-progress' => AppTheme.blue,
    'review' => AppTheme.amber, _ => AppTheme.textSecondary,
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Text('Timeline · ${widget.project.name}'),
        actions: [
          IconButton(icon: const Icon(Icons.download_outlined), tooltip: 'Export CSV', onPressed: _exportCsv),
          IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : Column(children: [
              // Filter chips
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
                child: Row(children: ['all', 'todo', 'in-progress', 'review', 'completed'].map((s) {
                  final sel = _filter == s;
                  return GestureDetector(
                    onTap: () => setState(() => _filter = s),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: sel ? AppTheme.primary : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: sel ? AppTheme.primary : AppTheme.border),
                      ),
                      child: Text(s == 'all' ? 'All' : s,
                          style: TextStyle(fontSize: 12, color: sel ? Colors.white : AppTheme.textSecondary)),
                    ),
                  );
                }).toList()),
              ),
              // Stats row
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                child: Row(children: [
                  _StatChip('Total', '${_tasks.length}', AppTheme.primary),
                  const SizedBox(width: 8),
                  _StatChip('Done', '${_tasks.where((t) => t.status == 'completed').length}', AppTheme.green),
                  const SizedBox(width: 8),
                  _StatChip('Active', '${_tasks.where((t) => t.status == 'in-progress').length}', AppTheme.blue),
                  const SizedBox(width: 8),
                  _StatChip('Overdue', '${_tasks.where((t) => t.dueDate.isBefore(DateTime.now()) && t.status != 'completed').length}', AppTheme.red),
                ]),
              ),
              // Gantt
              Expanded(child: _filtered.isEmpty
                  ? Center(child: Text('No tasks', style: TextStyle(color: AppTheme.textSecondary)))
                  : _GanttView(tasks: _filtered, project: widget.project, statusColor: _sc)),
            ]),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label, value; final Color color;
  const _StatChip(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(20)),
    child: Text('$label: $value', style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
  );
}

class _GanttView extends StatelessWidget {
  final List<ProjectTask> tasks;
  final Project project;
  final Color Function(String) statusColor;
  const _GanttView({required this.tasks, required this.project, required this.statusColor});

  @override
  Widget build(BuildContext context) {
    final start = project.startDate;
    final end = project.endDate;
    final totalDays = end.difference(start).inDays.clamp(1, 99999).toDouble();
    final now = DateTime.now();
    final todayOffset = now.difference(start).inDays.clamp(0, totalDays.toInt()).toDouble();

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Date axis
        Row(children: [
          const SizedBox(width: 130),
          Expanded(child: LayoutBuilder(builder: (_, c) {
            final w = c.maxWidth;
            return Stack(children: [
              Container(height: 20),
              Positioned(left: 0, child: Text(AppTheme.fmtDate(start), style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary))),
              Positioned(right: 0, child: Text(AppTheme.fmtDate(end), style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary))),
              if (todayOffset >= 0 && todayOffset <= totalDays)
                Positioned(
                  left: (todayOffset / totalDays * w).clamp(0, w - 30),
                  child: const Text('Today', style: TextStyle(fontSize: 9, color: AppTheme.red, fontWeight: FontWeight.w600)),
                ),
            ]);
          })),
        ]),
        const SizedBox(height: 4),
        ...tasks.map((t) {
          final taskEnd = t.dueDate.isAfter(end) ? end : t.dueDate.isBefore(start) ? start : t.dueDate;
          final barEnd = taskEnd.difference(start).inDays.clamp(0, totalDays.toInt()).toDouble();
          final isOverdue = t.dueDate.isBefore(now) && t.status != 'completed';
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(children: [
              SizedBox(width: 130, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(t.title, maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: AppTheme.textPrimary)),
                if (t.assigneeName.isNotEmpty)
                  Text(t.assigneeName, style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary)),
              ])),
              Expanded(child: LayoutBuilder(builder: (_, c) {
                final w = c.maxWidth;
                final barW = (barEnd / totalDays * w).clamp(8.0, w);
                final todayX = todayOffset / totalDays * w;
                return SizedBox(height: 30, child: Stack(children: [
                  Positioned.fill(child: Container(
                      decoration: BoxDecoration(color: AppTheme.border.withOpacity(0.4), borderRadius: BorderRadius.circular(4)))),
                  Positioned(left: 0, width: barW, top: 4, bottom: 4,
                    child: Container(
                      decoration: BoxDecoration(
                        color: isOverdue ? AppTheme.red : statusColor(t.status),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      alignment: Alignment.centerLeft,
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Text(t.status, style: const TextStyle(fontSize: 8, color: Colors.white, fontWeight: FontWeight.w600),
                          overflow: TextOverflow.clip, maxLines: 1),
                    )),
                  if (todayOffset >= 0 && todayOffset <= totalDays)
                    Positioned(left: todayX, top: 0, bottom: 0,
                        child: Container(width: 1.5, color: AppTheme.red)),
                ]));
              })),
            ]),
          );
        }),
        const SizedBox(height: 8),
        // Legend
        Wrap(spacing: 12, runSpacing: 6, children: [
          _Legend('Todo', AppTheme.textSecondary),
          _Legend('In Progress', AppTheme.blue),
          _Legend('Review', AppTheme.amber),
          _Legend('Done', AppTheme.green),
          _Legend('Overdue', AppTheme.red),
          Row(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 2, height: 12, color: AppTheme.red),
            const SizedBox(width: 4),
            const Text('Today', style: TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
          ]),
        ]),
      ]),
    );
  }
}

class _Legend extends StatelessWidget {
  final String label; final Color color;
  const _Legend(this.label, this.color);
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
    Container(width: 12, height: 8, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
    const SizedBox(width: 4),
    Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
  ]);
}
