import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../config/app_theme.dart';
import '../../models/task.dart';
import '../../services/task_service.dart';
import 'task_detail_screen.dart';

class TaskCalendarScreen extends StatefulWidget {
  final String? projectId;
  const TaskCalendarScreen({super.key, this.projectId});

  @override
  State<TaskCalendarScreen> createState() => _TaskCalendarScreenState();
}

class _TaskCalendarScreenState extends State<TaskCalendarScreen> {
  final _svc = TaskService();
  DateTime _focused = DateTime.now();
  DateTime? _selected;
  Map<DateTime, List<Task>> _events = {};
  List<Task> _allTasks = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _selected = DateTime.now();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final tasks = await _svc.getAll(projectId: widget.projectId);
      _allTasks = tasks.where((t) => t.dueDate != null).toList();
      _buildEvents();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  void _buildEvents() {
    _events = {};
    for (final t in _allTasks) {
      if (t.dueDate == null) continue;
      final day = DateTime(t.dueDate!.year, t.dueDate!.month, t.dueDate!.day);
      _events[day] = [...(_events[day] ?? []), t];
    }
  }

  List<Task> _getEventsForDay(DateTime day) {
    final key = DateTime(day.year, day.month, day.day);
    return _events[key] ?? [];
  }

  Color _sc(String s) => switch (s) {
        'completed' => AppTheme.green,
        'in-progress' => AppTheme.blue,
        'review' => AppTheme.amber,
        'blocked' => AppTheme.red,
        _ => AppTheme.textSecondary,
      };

  @override
  Widget build(BuildContext context) {
    final selectedTasks =
        _selected != null ? _getEventsForDay(_selected!) : <Task>[];

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(title: const Text('Task Calendar')),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary))
          : Column(children: [
              Container(
                color: Colors.white,
                child: AppTheme.constrain(TableCalendar<Task>(
                  firstDay: DateTime(2020),
                  lastDay: DateTime(2035),
                  focusedDay: _focused,
                  selectedDayPredicate: (d) => isSameDay(_selected, d),
                  eventLoader: _getEventsForDay,
                  calendarStyle: CalendarStyle(
                    selectedDecoration: const BoxDecoration(
                        color: AppTheme.primary, shape: BoxShape.circle),
                    todayDecoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.3),
                        shape: BoxShape.circle),
                    markerDecoration: const BoxDecoration(
                        color: AppTheme.primary, shape: BoxShape.circle),
                    markersMaxCount: 3,
                  ),
                  headerStyle: const HeaderStyle(
                    formatButtonVisible: false,
                    titleCentered: true,
                  ),
                  onDaySelected: (selected, focused) {
                    setState(() {
                      _selected = selected;
                      _focused = focused;
                    });
                  },
                  onPageChanged: (focused) {
                    setState(() => _focused = focused);
                  },
                )),
              ),
              const Divider(height: 1),
              Expanded(
                child: selectedTasks.isEmpty
                    ? Center(
                        child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                          Icon(Icons.event_available,
                              size: 48, color: AppTheme.textMuted),
                          const SizedBox(height: 12),
                          Text(
                            _selected != null
                                ? 'No tasks due on ${AppTheme.fmtDate(_selected!)}'
                                : 'Select a day',
                            style: const TextStyle(
                                color: AppTheme.textSecondary),
                          ),
                        ]))
                    : AppTheme.constrain(ListView.separated(
                        padding: EdgeInsets.all(AppTheme.hPad(context)),
                        itemCount: selectedTasks.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: 8),
                        itemBuilder: (_, i) {
                          final t = selectedTasks[i];
                          final sc = _sc(t.status);
                          return GestureDetector(
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) =>
                                      TaskDetailScreen(taskId: t.id)),
                            ).then((_) => _load()),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
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
                                  width: 4,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: sc,
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(t.title,
                                            style: const TextStyle(
                                                fontSize: 13,
                                                fontWeight:
                                                    FontWeight.w600)),
                                        if (t.projectName.isNotEmpty)
                                          Text(t.projectName,
                                              style: const TextStyle(
                                                  fontSize: 11,
                                                  color: AppTheme
                                                      .textSecondary)),
                                      ]),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: sc.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(t.status,
                                      style: TextStyle(
                                          fontSize: 10, color: sc)),
                                ),
                              ]),
                            ),
                          );
                        },
                      )),
              ),
            ]),
    );
  }
}
