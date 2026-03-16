import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/department.dart';
import '../../models/employee.dart';
import '../../services/department_service.dart';
import '../../services/employee_service.dart';

class DepartmentFormScreen extends StatefulWidget {
  final Department? department;
  const DepartmentFormScreen({super.key, this.department});

  @override
  State<DepartmentFormScreen> createState() => _DepartmentFormScreenState();
}

class _DepartmentFormScreenState extends State<DepartmentFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _description = TextEditingController();
  final _location = TextEditingController();
  final _budget = TextEditingController();

  String _status = 'active';
  String? _managerId;
  List<Employee> _employees = [];
  bool _saving = false;

  bool get _isEdit => widget.department != null;

  @override
  void initState() {
    super.initState();
    final d = widget.department;
    if (d != null) {
      _name.text = d.name;
      _description.text = d.description;
      _location.text = d.location;
      _budget.text = d.budget > 0 ? d.budget.toStringAsFixed(0) : '';
      _status = d.status;
      _managerId = d.manager?.id;
    }
    _loadEmployees();
  }

  Future<void> _loadEmployees() async {
    try {
      final list = await EmployeeService().getAll();
      if (mounted) setState(() => _employees = list);
    } catch (_) {}
  }

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    _location.dispose();
    _budget.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final body = {
        'name': _name.text.trim(),
        'description': _description.text.trim(),
        'location': _location.text.trim(),
        'status': _status,
        if (_budget.text.trim().isNotEmpty) 'budget': double.tryParse(_budget.text.trim()) ?? 0,
        if (_managerId != null) 'manager': _managerId,
      };
      if (_isEdit) {
        await DepartmentService().update(widget.department!.id, body);
      } else {
        await DepartmentService().create(body);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(title: Text(_isEdit ? 'Edit Department' : 'New Department')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _field(_name, 'Department Name', required: true),
            const SizedBox(height: 12),
            _field(_description, 'Description', maxLines: 3),
            const SizedBox(height: 12),
            _field(_location, 'Location'),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _field(_budget, 'Budget', keyboardType: TextInputType.number)),
              const SizedBox(width: 12),
              Expanded(child: DropdownButtonFormField<String>(
                initialValue: _status,
                decoration: const InputDecoration(labelText: 'Status'),
                items: ['active', 'inactive'].map((s) =>
                    DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 13)))).toList(),
                onChanged: (v) => setState(() => _status = v!),
              )),
            ]),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _managerId,
              decoration: const InputDecoration(labelText: 'Manager (optional)'),
              items: [
                const DropdownMenuItem(value: null, child: Text('No manager', style: TextStyle(fontSize: 13))),
                ..._employees.map((e) => DropdownMenuItem(
                    value: e.id,
                    child: Text(e.fullName, style: const TextStyle(fontSize: 13)))),
              ],
              onChanged: (v) => setState(() => _managerId = v),
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 48,
              child: ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(width: 20, height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(_isEdit ? 'Save Changes' : 'Create Department'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _field(TextEditingController ctrl, String label,
      {bool required = false, int maxLines = 1, TextInputType? keyboardType}) {
    return TextFormField(
      controller: ctrl,
      maxLines: maxLines,
      keyboardType: keyboardType,
      decoration: InputDecoration(labelText: label),
      validator: required ? (v) => (v == null || v.trim().isEmpty) ? '$label is required' : null : null,
    );
  }
}
