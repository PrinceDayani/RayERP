import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/task.dart';
import '../../services/task_service.dart';

class TaskDependenciesScreen extends StatefulWidget {
  final Task task;
  const TaskDependenciesScreen({super.key, required this.task});

  @override
  State<TaskDependenciesScreen> createState() => _TaskDependenciesScreenState();
}

class _TaskDependenciesScreenState extends State<TaskDependenciesScreen> {
  final _svc = TaskService();
  List<Task> _allTasks = [];
  bool _loading = true;
  String? _selectedTaskId;
  String _depType = 'finish-to-start';
  bool _saving = false;

  static const _depTypes = [
    'finish-to-start',
    'start-to-start',
    'finish-to-finish',
    'start-to-finish',
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final tasks = await _svc.getAll(projectId: widget.task.projectId);
      _allTasks = tasks
          .where((t) => t.id != widget.task.id && !t.isTemplate)
          .toList();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _add() async {
    if (_selectedTaskId == null) return;
    setState(() => _saving = true);
    try {
      await _svc.addDependency(widget.task.id, _selectedTaskId!, _depType);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Dependency added'),
              backgroundColor: AppTheme.green),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.red));
      }
    }
    if (mounted) setState(() => _saving = false);
  }

  Future<void> _remove(String depId) async {
    try {
      await _svc.removeDependency(widget.task.id, depId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Dependency removed'),
              backgroundColor: AppTheme.green),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.red));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final existing = widget.task.dependencies;
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(title: const Text('Task Dependencies')),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary))
          : AppTheme.constrain(ListView(
              padding: EdgeInsets.all(AppTheme.hPad(context)),
              children: [
                if (existing.isNotEmpty) ...[
                  const Text('Current Dependencies',
                      style: TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  ...existing.map((d) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
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
                          const Icon(Icons.link,
                              size: 16, color: AppTheme.textSecondary),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    d.taskTitle.isNotEmpty
                                        ? d.taskTitle
                                        : d.taskId,
                                    style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500),
                                  ),
                                  Text(d.type,
                                      style: const TextStyle(
                                          fontSize: 10,
                                          color: AppTheme.textSecondary)),
                                ]),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline,
                                size: 18, color: AppTheme.red),
                            onPressed: () => _remove(d.id),
                          ),
                        ]),
                      )),
                  const SizedBox(height: 16),
                ],
                const Text('Add Dependency',
                    style: TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: _selectedTaskId,
                  decoration:
                      const InputDecoration(labelText: 'Depends on Task'),
                  items: _allTasks
                      .map((t) => DropdownMenuItem(
                            value: t.id,
                            child: Text(t.title,
                                style: const TextStyle(fontSize: 13),
                                overflow: TextOverflow.ellipsis),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() => _selectedTaskId = v),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _depType,
                  decoration:
                      const InputDecoration(labelText: 'Dependency Type'),
                  items: _depTypes
                      .map((t) => DropdownMenuItem(
                            value: t,
                            child: Text(t,
                                style: const TextStyle(fontSize: 13)),
                          ))
                      .toList(),
                  onChanged: (v) =>
                      setState(() => _depType = v ?? _depType),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    onPressed: (_selectedTaskId == null || _saving)
                        ? null
                        : _add,
                    child: _saving
                        ? const SizedBox(
                            width: 20, height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                        : const Text('Add Dependency'),
                  ),
                ),
              ],
            )),
    );
  }
}
