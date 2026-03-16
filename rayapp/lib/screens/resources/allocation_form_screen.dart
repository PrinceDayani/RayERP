import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/employee.dart';
import '../../models/project.dart';
import '../../services/resource_service.dart';
import '../../services/employee_service.dart';
import '../../services/project_service.dart';

class AllocationFormScreen extends StatefulWidget {
  final ResourceAllocation? existing;
  const AllocationFormScreen({super.key, this.existing});

  @override
  State<AllocationFormScreen> createState() => _AllocationFormScreenState();
}

class _AllocationFormScreenState extends State<AllocationFormScreen> {
  final _svc = ResourceService();
  final _empSvc = EmployeeService();
  final _projSvc = ProjectService();
  final _formKey = GlobalKey<FormState>();

  List<Employee> _employees = [];
  List<Project> _projects = [];
  bool _loadingData = true;
  bool _saving = false;

  Employee? _selectedEmployee;
  Project? _selectedProject;
  final _roleCtrl = TextEditingController();
  final _hoursCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now().add(const Duration(days: 30));
  String _status = 'planned';
  String _priority = 'medium';

  // Validation result from server
  Map<String, dynamic>? _validation;
  bool _validating = false;

  @override
  void initState() {
    super.initState();
    _loadData();
    if (widget.existing != null) _prefill(widget.existing!);
  }

  @override
  void dispose() {
    _roleCtrl.dispose();
    _hoursCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  void _prefill(ResourceAllocation a) {
    _roleCtrl.text = a.role;
    _hoursCtrl.text = a.allocatedHours.toStringAsFixed(0);
    _notesCtrl.text = a.notes ?? '';
    _startDate = a.startDate;
    _endDate = a.endDate;
    _status = a.status;
    _priority = a.priority;
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([_empSvc.getAll(), _projSvc.getAll()]);
      if (!mounted) return;
      final emps = (results[0] as List<Employee>).where((e) => e.status == 'active').toList();
      final projs = (results[1] as List<Project>).where((p) => ['active', 'planning'].contains(p.status)).toList();
      setState(() {
        _employees = emps;
        _projects = projs;
        _loadingData = false;
        if (widget.existing != null) {
          try {
            _selectedEmployee = emps.firstWhere((e) => e.id == widget.existing!.employeeId);
          } catch (_) {}
          try {
            _selectedProject = projs.firstWhere((p) => p.id == widget.existing!.projectId);
          } catch (_) {}
        }
      });
    } catch (e) {
      if (mounted) setState(() => _loadingData = false);
    }
  }

  Future<void> _validate() async {
    if (_selectedEmployee == null || _hoursCtrl.text.isEmpty) return;
    final hours = double.tryParse(_hoursCtrl.text);
    if (hours == null) return;
    setState(() => _validating = true);
    try {
      final result = await _svc.validateAllocation(
        employeeId: _selectedEmployee!.id,
        allocatedHours: hours,
        startDate: _startDate.toIso8601String(),
        endDate: _endDate.toIso8601String(),
        excludeId: widget.existing?.id,
      );
      if (mounted) setState(() { _validation = result; _validating = false; });
    } catch (_) {
      if (mounted) setState(() => _validating = false);
    }
  }

  Future<void> _pickDate(bool isStart) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isStart ? _startDate : _endDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _startDate = picked;
        if (_endDate.isBefore(_startDate)) _endDate = _startDate.add(const Duration(days: 1));
      } else {
        _endDate = picked;
      }
    });
    _validate();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedEmployee == null) {
      _showError('Please select an employee');
      return;
    }
    if (_selectedProject == null) {
      _showError('Please select a project');
      return;
    }
    setState(() => _saving = true);
    try {
      final body = {
        'employee': _selectedEmployee!.id,
        'project': _selectedProject!.id,
        'role': _roleCtrl.text.trim(),
        'allocatedHours': double.parse(_hoursCtrl.text),
        'startDate': _startDate.toIso8601String(),
        'endDate': _endDate.toIso8601String(),
        'status': _status,
        'priority': _priority,
        if (_notesCtrl.text.trim().isNotEmpty) 'notes': _notesCtrl.text.trim(),
      };
      if (widget.existing != null) {
        await _svc.updateAllocation(widget.existing!.id, body);
      } else {
        await _svc.createAllocation(body);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        _showError(e.toString().replaceAll('Exception: ', ''));
      }
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppTheme.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.existing != null;
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Edit Allocation' : 'New Allocation'),
        actions: [
          if (_saving)
            const Padding(padding: EdgeInsets.all(16), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)))
          else
            TextButton(onPressed: _save, child: const Text('Save', style: TextStyle(fontWeight: FontWeight.w700))),
        ],
      ),
      body: _loadingData
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _section('Assignment'),
                  _employeeDropdown(),
                  const SizedBox(height: 12),
                  _projectDropdown(),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _roleCtrl,
                    decoration: const InputDecoration(labelText: 'Role / Position *'),
                    validator: (v) => (v?.trim().isEmpty ?? true) ? 'Required' : null,
                  ),
                  const SizedBox(height: 20),
                  _section('Schedule'),
                  Row(children: [
                    Expanded(child: _dateTile('Start Date', _startDate, () => _pickDate(true))),
                    const SizedBox(width: 12),
                    Expanded(child: _dateTile('End Date', _endDate, () => _pickDate(false))),
                  ]),
                  const SizedBox(height: 20),
                  _section('Hours & Utilization'),
                  TextFormField(
                    controller: _hoursCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Allocated Hours / Week *',
                      suffixText: 'h/wk',
                      helperText: 'Standard capacity is 40h/wk',
                    ),
                    validator: (v) {
                      if (v?.trim().isEmpty ?? true) return 'Required';
                      final n = double.tryParse(v!);
                      if (n == null || n <= 0) return 'Enter a valid number';
                      if (n > 60) return 'Max 60h/wk';
                      return null;
                    },
                    onChanged: (_) => _validate(),
                  ),
                  if (_validating)
                    const Padding(
                      padding: EdgeInsets.only(top: 8),
                      child: Row(children: [
                        SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
                        SizedBox(width: 8),
                        Text('Checking availability…', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                      ]),
                    ),
                  if (_validation != null) _validationBanner(),
                  const SizedBox(height: 20),
                  _section('Details'),
                  Row(children: [
                    Expanded(child: _dropdownField('Status', _status, ['planned', 'active', 'completed', 'on_hold'], (v) => setState(() => _status = v!))),
                    const SizedBox(width: 12),
                    Expanded(child: _dropdownField('Priority', _priority, ['low', 'medium', 'high', 'critical'], (v) => setState(() => _priority = v!))),
                  ]),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _notesCtrl,
                    maxLines: 3,
                    decoration: const InputDecoration(labelText: 'Notes (optional)'),
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: _saving ? null : _save,
                    child: Text(isEdit ? 'Update Allocation' : 'Create Allocation'),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _section(String title) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Text(title.toUpperCase(),
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8)),
      );

  Widget _employeeDropdown() {
    return DropdownButtonFormField<Employee>(
      initialValue: _selectedEmployee,
      decoration: const InputDecoration(labelText: 'Employee *'),
      isExpanded: true,
      items: _employees.map((e) => DropdownMenuItem(
        value: e,
        child: Text('${e.fullName} · ${e.position}', style: const TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis),
      )).toList(),
      onChanged: (v) {
        setState(() => _selectedEmployee = v);
        _validate();
      },
      validator: (v) => v == null ? 'Required' : null,
    );
  }

  Widget _projectDropdown() {
    return DropdownButtonFormField<Project>(
      initialValue: _selectedProject,
      decoration: const InputDecoration(labelText: 'Project *'),
      isExpanded: true,
      items: _projects.map((p) => DropdownMenuItem(
        value: p,
        child: Text(p.name, style: const TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis),
      )).toList(),
      onChanged: (v) => setState(() => _selectedProject = v),
      validator: (v) => v == null ? 'Required' : null,
    );
  }

  Widget _dateTile(String label, DateTime date, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          border: Border.all(color: AppTheme.border),
          borderRadius: BorderRadius.circular(8),
          color: Theme.of(context).inputDecorationTheme.fillColor,
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
          const SizedBox(height: 4),
          Row(children: [
            const Icon(Icons.calendar_today_outlined, size: 14, color: AppTheme.primary),
            const SizedBox(width: 6),
            Text(AppTheme.fmtDate(date), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          ]),
        ]),
      ),
    );
  }

  Widget _dropdownField(String label, String value, List<String> options, ValueChanged<String?> onChanged) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      decoration: InputDecoration(labelText: label),
      items: options.map((o) => DropdownMenuItem(
        value: o,
        child: Text(o[0].toUpperCase() + o.substring(1).replaceAll('_', ' '), style: const TextStyle(fontSize: 13)),
      )).toList(),
      onChanged: onChanged,
    );
  }

  Widget _validationBanner() {
    final isValid = _validation!['isValid'] == true;
    final totalHours = (_validation!['totalHours'] ?? 0).toDouble();
    final available = (_validation!['availableHours'] ?? 0).toDouble();
    final warnings = (_validation!['warnings'] as List? ?? []);
    final color = isValid ? AppTheme.green : AppTheme.red;
    final bg = isValid ? AppTheme.greenBg : AppTheme.redBg;
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8), border: Border.all(color: color.withOpacity(0.3))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(isValid ? Icons.check_circle_outline : Icons.warning_amber_outlined, size: 16, color: color),
          const SizedBox(width: 6),
          Text(isValid ? 'Allocation is valid' : 'Over-allocation detected',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: color)),
        ]),
        const SizedBox(height: 6),
        Text('Total after this: ${totalHours.toStringAsFixed(0)}h/wk  ·  Available: ${available.toStringAsFixed(0)}h/wk',
            style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        for (final w in warnings)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text('⚠ $w', style: const TextStyle(fontSize: 11, color: AppTheme.amber)),
          ),
      ]),
    );
  }
}
