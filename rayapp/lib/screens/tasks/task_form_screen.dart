import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/task.dart';
import '../../models/employee.dart';
import '../../services/task_service.dart';
import '../../services/employee_service.dart';
import '../../services/project_service.dart';
import '../../services/auth_provider.dart';
import '../../models/project.dart';

class TaskFormScreen extends StatefulWidget {
  final Task? task;
  final String? projectId;
  final String? currentUserId;

  const TaskFormScreen({
    super.key,
    this.task,
    this.projectId,
    this.currentUserId,
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

  String _status = 'todo';
  String _priority = 'medium';
  DateTime? _dueDate;
  String? _projectId;
  String? _assignedToId;
  String? _assignedById;

  List<Employee> _employees = [];
  List<Project> _projects = [];
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
      _status = t.status;
      _priority = t.priority;
      _dueDate = t.dueDate;
      _assignedToId = t.assignedTo?.id;
      _assignedById = t.assignedBy?.id;
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
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([
        _empSvc.getAll(),
        if (_projectId == null) _projSvc.getAll() else Future.value(<Project>[]),
      ]);
      _employees = results[0] as List<Employee>;
      if (_projectId == null) _projects = results[1] as List<Project>;
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

    final auth = context.read<AuthProvider>();
    final assignedBy = _assignedById ?? auth.user?.id ?? '';

    setState(() => _saving = true);
    try {
      final body = <String, dynamic>{
        'title': _titleCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'status': _status,
        'priority': _priority,
        'project': _projectId,
        'assignedTo': _assignedToId,
        'assignedBy': assignedBy,
        if (_dueDate != null) 'dueDate': _dueDate!.toIso8601String(),
        if (_estCtrl.text.isNotEmpty)
          'estimatedHours': double.tryParse(_estCtrl.text) ?? 0,
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
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
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
                        value: _projectId,
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
                      value: _assignedToId,
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
                  Row(children: [
                    Expanded(
                      child: _field(
                        child: DropdownButtonFormField<String>(
                          value: _status,
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
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _field(
                        child: DropdownButtonFormField<String>(
                          value: _priority,
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
                      ),
                    ),
                  ]),
                  Row(children: [
                    Expanded(
                      child: _field(
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
                              color: Colors.white,
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
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _field(
                        child: TextFormField(
                          controller: _estCtrl,
                          decoration: const InputDecoration(
                              labelText: 'Est. Hours'),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ),
                  ]),
                ],
              ),
            ),
    );
  }

  Widget _field({required Widget child}) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: child,
      );
}
