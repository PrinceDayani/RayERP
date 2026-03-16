import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/task.dart';
import '../../models/employee.dart';
import '../../services/task_service.dart';
import '../../services/employee_service.dart';
import '../../services/project_service.dart';
import '../../models/project.dart';

class TaskFormScreen extends StatefulWidget {
  final Task? task;
  final String? projectId;

  const TaskFormScreen({
    super.key,
    this.task,
    this.projectId,
  });

  @override
  State<TaskFormScreen> createState() => _TaskFormScreenState();
}

class _TaskFormScreenState extends State<TaskFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _svc = TaskService();
  final _empSvc = EmployeeService();
  final _projSvc = ProjectService();

  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _estCtrl = TextEditingController();
  final _blockedByCtrl = TextEditingController();

  String _taskType = 'project';
  String _assignmentType = 'assigned';
  String _status = 'todo';
  String _priority = 'medium';
  DateTime? _dueDate;
  String? _projectId;
  String? _assignedToId;
  String? _assignedById;
  String? _parentTaskId;

  List<Employee> _employees = [];
  List<Project> _projects = [];
  List<Task> _allTasks = [];
  bool _loading = true;
  bool _saving = false;

  bool get _isEdit => widget.task != null;

  @override
  void initState() {
    super.initState();
    _projectId = widget.projectId ?? widget.task?.projectId;
    if (_isEdit) {
      final t = widget.task!;
      _titleCtrl.text = t.title;
      _descCtrl.text = t.description;
      _taskType = t.taskType;
      _assignmentType = t.assignmentType;
      _status = t.status;
      _priority = t.priority;
      _dueDate = t.dueDate;
      _assignedToId = t.assignedTo?.id;
      _assignedById = t.assignedBy?.id;
      _parentTaskId = t.parentTaskId;
      _blockedByCtrl.text = t.blockedBy ?? '';
      _estCtrl.text = t.estimatedHours > 0
          ? t.estimatedHours.toStringAsFixed(1)
          : '';
    }
    _loadData();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _estCtrl.dispose();
    _blockedByCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([
        _empSvc.getAll(),
        if (_projectId == null) _projSvc.getAll() else Future.value(<Project>[]),
        _svc.getAll(),
      ]);
      _employees = results[0] as List<Employee>;
      if (_projectId == null) _projects = results[1] as List<Project>;
      _allTasks = results[2] as List<Task>;
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_projectId == null) {
      _err('Please select a project');
      return;
    }
    if (_assignedToId == null) {
      _err('Please select an assignee');
      return;
    }

    final assignedBy = _assignedById;
    if (assignedBy == null) {
      _err('Please select who is assigning this task');
      return;
    }

    setState(() => _saving = true);
    try {
      final body = <String, dynamic>{
        'title': _titleCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'taskType': _taskType,
        'assignmentType': _assignmentType,
        'status': _status,
        'priority': _priority,
        'project': _projectId,
        'assignedTo': _assignedToId,
        'assignedBy': assignedBy,
        if (_dueDate != null) 'dueDate': _dueDate!.toIso8601String(),
        if (_estCtrl.text.isNotEmpty)
          'estimatedHours': double.tryParse(_estCtrl.text) ?? 0,
        if (_parentTaskId != null) 'parentTask': _parentTaskId,
        if (_blockedByCtrl.text.isNotEmpty) 'blockedBy': _blockedByCtrl.text.trim(),
      };

      if (_isEdit) {
        await _svc.update(widget.task!.id, body);
      } else {
        await _svc.create(body);
      }

      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) _err(e.toString());
    }
    if (mounted) setState(() => _saving = false);
  }

  void _err(String msg) => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), backgroundColor: AppTheme.red),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Text(_isEdit ? 'Edit Task' : 'New Task'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    width: 18, height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Text('Save',
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary))
          : Form(
              key: _formKey,
              child: AppTheme.constrain(
                ListView(
                  padding: EdgeInsets.all(AppTheme.hPad(context)),
                  children: [
                    _field(
                      child: DropdownButtonFormField<String>(
                        value: _taskType,
                        decoration:
                            const InputDecoration(labelText: 'Task Type'),
                        items: ['individual', 'project']
                            .map((t) => DropdownMenuItem(
                                value: t,
                                child: Text(t == 'individual' ? 'Individual Task' : 'Project Task',
                                    style: const TextStyle(fontSize: 13))))
                            .toList(),
                        onChanged: (v) => setState(() => _taskType = v ?? _taskType),
                      ),
                    ),
                    _field(
                      child: DropdownButtonFormField<String>(
                        value: _assignmentType,
                        decoration:
                            const InputDecoration(labelText: 'Assignment Type'),
                        items: ['assigned', 'self-assigned']
                            .map((t) => DropdownMenuItem(
                                value: t,
                                child: Text(t == 'assigned' ? 'Assigned by Manager' : 'Self-Assigned',
                                    style: const TextStyle(fontSize: 13))))
                            .toList(),
                        onChanged: (v) => setState(() => _assignmentType = v ?? _assignmentType),
                      ),
                    ),
                    _field(
                      child: TextFormField(
                        controller: _titleCtrl,
                        decoration: const InputDecoration(labelText: 'Title *'),
                        validator: (v) =>
                            v == null || v.trim().isEmpty ? 'Required' : null,
                      ),
                    ),
                    _field(
                      child: TextFormField(
                        controller: _descCtrl,
                        decoration:
                            const InputDecoration(labelText: 'Description *'),
                        maxLines: 3,
                        validator: (v) =>
                            v == null || v.trim().isEmpty ? 'Required' : null,
                      ),
                    ),
                    if (_projectId == null)
                      _field(
                        child: DropdownButtonFormField<String>(
                          initialValue: _projectId,
                          decoration:
                              const InputDecoration(labelText: 'Project *'),
                          items: _projects
                              .map((p) => DropdownMenuItem(
                                  value: p.id,
                                  child: Text(p.name,
                                      style: const TextStyle(fontSize: 13))))
                              .toList(),
                          onChanged: (v) => setState(() => _projectId = v),
                          validator: (v) => v == null ? 'Required' : null,
                        ),
                      ),
                    _field(
                      child: DropdownButtonFormField<String>(
                        initialValue: _assignedToId,
                        decoration:
                            const InputDecoration(labelText: 'Assign To *'),
                        items: _employees
                            .map((e) => DropdownMenuItem(
                                value: e.id,
                                child: Text(e.fullName,
                                    style: const TextStyle(fontSize: 13))))
                            .toList(),
                        onChanged: (v) => setState(() => _assignedToId = v),
                        validator: (v) => v == null ? 'Required' : null,
                      ),
                    ),
                    _field(
                      child: DropdownButtonFormField<String>(
                        initialValue: _assignedById,
                        decoration:
                            const InputDecoration(labelText: 'Assigned By *'),
                        items: _employees
                            .map((e) => DropdownMenuItem(
                                value: e.id,
                                child: Text(e.fullName,
                                    style: const TextStyle(fontSize: 13))))
                            .toList(),
                        onChanged: (v) => setState(() => _assignedById = v),
                        validator: (v) => v == null ? 'Required' : null,
                      ),
                    ),
                    LayoutBuilder(builder: (context, constraints) {
                      final narrow = constraints.maxWidth < 400;
                      final statusField = _field(
                        child: DropdownButtonFormField<String>(
                          initialValue: _status,
                          decoration:
                              const InputDecoration(labelText: 'Status'),
                          items: ['todo', 'in-progress', 'review', 'completed', 'blocked']
                              .map((s) => DropdownMenuItem(
                                  value: s,
                                  child: Text(s,
                                      style:
                                          const TextStyle(fontSize: 13))))
                              .toList(),
                          onChanged: (v) =>
                              setState(() => _status = v ?? _status),
                        ),
                      );
                      final priorityField = _field(
                        child: DropdownButtonFormField<String>(
                          initialValue: _priority,
                          decoration:
                              const InputDecoration(labelText: 'Priority'),
                          items: ['low', 'medium', 'high', 'critical']
                              .map((p) => DropdownMenuItem(
                                  value: p,
                                  child: Text(p,
                                      style:
                                          const TextStyle(fontSize: 13))))
                              .toList(),
                          onChanged: (v) =>
                              setState(() => _priority = v ?? _priority),
                        ),
                      );
                      if (narrow) {
                        return Column(children: [statusField, priorityField]);
                      }
                      return Row(children: [
                        Expanded(child: statusField),
                        const SizedBox(width: 12),
                        Expanded(child: priorityField),
                      ]);
                    }),
                    LayoutBuilder(builder: (context, constraints) {
                      final narrow = constraints.maxWidth < 400;
                      final dateField = _field(
                        child: GestureDetector(
                          onTap: () async {
                            final d = await showDatePicker(
                              context: context,
                              initialDate: _dueDate ?? DateTime.now(),
                              firstDate: DateTime(2020),
                              lastDate: DateTime(2035),
                              builder: (c, child) => Theme(
                                data: Theme.of(c).copyWith(
                                    colorScheme: const ColorScheme.light(
                                        primary: AppTheme.primary)),
                                child: child!,
                              ),
                            );
                            if (d != null) setState(() => _dueDate = d);
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 14),
                            decoration: BoxDecoration(
                              color: Theme.of(context).cardColor,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppTheme.border),
                            ),
                            child: Row(children: [
                              const Icon(Icons.calendar_today_outlined,
                                  size: 16,
                                  color: AppTheme.textSecondary),
                              const SizedBox(width: 8),
                              Text(
                                _dueDate != null
                                    ? AppTheme.fmtDate(_dueDate!)
                                    : 'Due Date',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: _dueDate != null
                                      ? AppTheme.textPrimary
                                      : AppTheme.textSecondary,
                                ),
                              ),
                            ]),
                          ),
                        ),
                      );
                      final hoursField = _field(
                        child: TextFormField(
                          controller: _estCtrl,
                          decoration: const InputDecoration(
                              labelText: 'Est. Hours'),
                          keyboardType: TextInputType.number,
                        ),
                      );
                      if (narrow) {
                        return Column(children: [dateField, hoursField]);
                      }
                      return Row(children: [
                        Expanded(child: dateField),
                        const SizedBox(width: 12),
                        Expanded(child: hoursField),
                      ]);
                    }),
                    _field(
                      child: DropdownButtonFormField<String?>(
                        value: _parentTaskId,
                        decoration:
                            const InputDecoration(labelText: 'Parent Task (Optional)'),
                        items: [
                          const DropdownMenuItem<String?>(
                            value: null,
                            child: Text('None', style: TextStyle(fontSize: 13)),
                          ),
                          ..._allTasks
                              .where((t) => t.id != widget.task?.id)
                              .map((t) => DropdownMenuItem(
                                  value: t.id,
                                  child: Text(t.title,
                                      style: const TextStyle(fontSize: 13),
                                      overflow: TextOverflow.ellipsis)))
                              .toList(),
                        ],
                        onChanged: (v) => setState(() => _parentTaskId = v),
                      ),
                    ),
                    if (_status == 'blocked')
                      _field(
                        child: TextFormField(
                          controller: _blockedByCtrl,
                          decoration: const InputDecoration(
                              labelText: 'Blocked By (Reason)'),
                          maxLines: 2,
                        ),
                      ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _field({required Widget child}) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: child,
      );
}
