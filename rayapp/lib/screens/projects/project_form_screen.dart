import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../models/employee.dart';
import '../../services/project_service.dart';
import '../../services/employee_service.dart';
import '../../services/department_service.dart';

class ProjectFormScreen extends StatefulWidget {
  final Project? project;
  const ProjectFormScreen({super.key, this.project});

  @override
  State<ProjectFormScreen> createState() => _ProjectFormScreenState();
}

class _ProjectFormScreenState extends State<ProjectFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _description = TextEditingController();
  final _client = TextEditingController();
  final _budget = TextEditingController();
  final _tags = TextEditingController();

  String _status = 'planning';
  String _priority = 'medium';
  String _currency = 'USD';
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now().add(const Duration(days: 30));
  bool _saving = false;

  List<Employee> _allEmployees = [];
  List<String> _allDepts = [];
  List<String> _selectedManagers = [];
  List<String> _selectedTeam = [];
  List<String> _selectedDepts = [];
  List<String> _requiredSkills = [];

  bool get _isEdit => widget.project != null;

  @override
  void initState() {
    super.initState();
    final p = widget.project;
    if (p != null) {
      _name.text = p.name;
      _description.text = p.description;
      _client.text = p.client ?? '';
      _budget.text = p.budget > 0 ? p.budget.toStringAsFixed(0) : '';
      _tags.text = p.tags.join(', ');
      _status = p.status;
      _priority = p.priority;
      _currency = p.currency;
      _startDate = p.startDate;
      _endDate = p.endDate;
      _selectedManagers = p.managers.map((m) => m.id).toList();
      _selectedTeam = p.team.map((m) => m.id).toList();
      _requiredSkills = List.from(p.requiredSkills);
    }
    _loadPickers();
  }

  Future<void> _loadPickers() async {
    final results = await Future.wait([
      EmployeeService().getAll().catchError((_) => <Employee>[]),
      DepartmentService().getNames().catchError((_) => <String>[]),
    ]);
    if (mounted) {
      setState(() {
      _allEmployees = results[0] as List<Employee>;
      _allDepts = results[1] as List<String>;
    });
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    _client.dispose();
    _budget.dispose();
    _tags.dispose();
    super.dispose();
  }

  Future<void> _pickDate(bool isStart) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isStart ? _startDate : _endDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(primary: AppTheme.primary),
        ),
        child: child!,
      ),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _startDate = picked;
      } else {
        _endDate = picked;
      }
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final body = {
        'name': _name.text.trim(),
        'description': _description.text.trim(),
        'status': _status,
        'priority': _priority,
        'currency': _currency,
        'startDate': _startDate.toIso8601String(),
        'endDate': _endDate.toIso8601String(),
        if (_client.text.trim().isNotEmpty) 'client': _client.text.trim(),
        if (_budget.text.trim().isNotEmpty) 'budget': double.tryParse(_budget.text.trim()) ?? 0,
        if (_tags.text.trim().isNotEmpty)
          'tags': _tags.text.split(',').map((t) => t.trim()).where((t) => t.isNotEmpty).toList(),
        if (_requiredSkills.isNotEmpty) 'requiredSkills': _requiredSkills,
        if (_selectedManagers.isNotEmpty) 'managers': _selectedManagers,
        if (_selectedTeam.isNotEmpty) 'team': _selectedTeam,
        if (_selectedDepts.isNotEmpty) 'departments': _selectedDepts,
      };
      if (_isEdit) {
        await ProjectService().update(widget.project!.id, body);
      } else {
        await ProjectService().create(body);
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
    final wide = MediaQuery.of(context).size.width >= 600;
    final pad = AppTheme.hPad(context);
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(title: Text(_isEdit ? 'Edit Project' : 'New Project')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: EdgeInsets.all(pad),
          children: [
            if (wide) ...[
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(child: _field(_name, 'Project Name', required: true)),
                const SizedBox(width: 12),
                Expanded(child: _field(_client, 'Client')),
              ]),
              const SizedBox(height: 12),
              _field(_description, 'Description', maxLines: 3),
            ] else ...[
              _field(_name, 'Project Name', required: true),
              const SizedBox(height: 12),
              _field(_description, 'Description', maxLines: 3),
              const SizedBox(height: 12),
              _field(_client, 'Client'),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _dropdown('Status', _status, ['planning', 'active', 'on-hold', 'completed'], (v) => setState(() => _status = v!))),
                const SizedBox(width: 12),
                Expanded(child: _dropdown('Priority', _priority, ['low', 'medium', 'high', 'critical'], (v) => setState(() => _priority = v!))),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _dateTile('Start Date', _startDate, () => _pickDate(true))),
                const SizedBox(width: 12),
                Expanded(child: _dateTile('End Date', _endDate, () => _pickDate(false))),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _field(_budget, 'Budget', keyboardType: TextInputType.number)),
                const SizedBox(width: 12),
                Expanded(child: _dropdown('Currency', _currency, ['USD', 'INR', 'EUR', 'GBP'], (v) => setState(() => _currency = v!))),
              ],
            ),
            const SizedBox(height: 12),
            _field(_tags, 'Tags (comma-separated)'),
            const SizedBox(height: 12),
            _SkillsPicker(
              skills: _requiredSkills,
              onChanged: (s) => setState(() => _requiredSkills = s),
            ),
            const SizedBox(height: 12),
            if (wide)
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(child: _MultiPicker(
                  label: 'Managers',
                  icon: Icons.manage_accounts_outlined,
                  selectedIds: _selectedManagers,
                  employees: _allEmployees,
                  onChanged: (ids) => setState(() => _selectedManagers = ids),
                )),
                const SizedBox(width: 12),
                Expanded(child: _MultiPicker(
                  label: 'Team Members',
                  icon: Icons.group_outlined,
                  selectedIds: _selectedTeam,
                  employees: _allEmployees,
                  onChanged: (ids) => setState(() => _selectedTeam = ids),
                )),
              ])
            else ...[
              _MultiPicker(
                label: 'Managers',
                icon: Icons.manage_accounts_outlined,
                selectedIds: _selectedManagers,
                employees: _allEmployees,
                onChanged: (ids) => setState(() => _selectedManagers = ids),
              ),
              const SizedBox(height: 12),
              _MultiPicker(
                label: 'Team Members',
                icon: Icons.group_outlined,
                selectedIds: _selectedTeam,
                employees: _allEmployees,
                onChanged: (ids) => setState(() => _selectedTeam = ids),
              ),
            ],
            const SizedBox(height: 12),
            _DeptPicker(
              selected: _selectedDepts,
              all: _allDepts,
              onChanged: (d) => setState(() => _selectedDepts = d),
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 48,
              child: ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(_isEdit ? 'Save Changes' : 'Create Project'),
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

  Widget _dropdown(String label, String value, List<String> options, ValueChanged<String?> onChanged) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      decoration: InputDecoration(labelText: label),
      items: options.map((o) => DropdownMenuItem(value: o, child: Text(o, style: const TextStyle(fontSize: 13)))).toList(),
      onChanged: onChanged,
    );
  }

  Widget _dateTile(String label, DateTime date, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
            const SizedBox(height: 2),
            Text(AppTheme.fmtDate(date), style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary)),
          ],
        ),
      ),
    );
  }
}

// ── Multi-select employee picker ─────────────────────────────────────────────

class _MultiPicker extends StatelessWidget {
  final String label;
  final IconData icon;
  final List<String> selectedIds;
  final List<Employee> employees;
  final ValueChanged<List<String>> onChanged;
  const _MultiPicker({required this.label, required this.icon, required this.selectedIds,
      required this.employees, required this.onChanged});

  void _open(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => _EmployeePickerSheet(
        title: label,
        employees: employees,
        selected: List.from(selectedIds),
        onDone: onChanged,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final names = selectedIds.map((id) {
      final e = employees.where((e) => e.id == id).firstOrNull;
      return e != null ? '${e.firstName} ${e.lastName}'.trim() : id;
    }).toList();
    return GestureDetector(
      onTap: () => _open(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppTheme.border)),
        child: Row(
          children: [
            Icon(icon, size: 18, color: AppTheme.textSecondary),
            const SizedBox(width: 8),
            Expanded(
              child: names.isEmpty
                  ? Text('Select $label', style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary))
                  : Wrap(
                      spacing: 6, runSpacing: 4,
                      children: names.map((n) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                        child: Text(n, style: const TextStyle(fontSize: 11, color: AppTheme.primary)),
                      )).toList(),
                    ),
            ),
            const Icon(Icons.chevron_right, size: 18, color: AppTheme.textSecondary),
          ],
        ),
      ),
    );
  }
}

class _EmployeePickerSheet extends StatefulWidget {
  final String title;
  final List<Employee> employees;
  final List<String> selected;
  final ValueChanged<List<String>> onDone;
  const _EmployeePickerSheet({required this.title, required this.employees,
      required this.selected, required this.onDone});

  @override
  State<_EmployeePickerSheet> createState() => _EmployeePickerSheetState();
}

class _EmployeePickerSheetState extends State<_EmployeePickerSheet> {
  late List<String> _sel;
  String _q = '';

  @override
  void initState() {
    super.initState();
    _sel = List.from(widget.selected);
  }

  @override
  Widget build(BuildContext context) {
    final filtered = widget.employees.where((e) {
      final name = '${e.firstName} ${e.lastName}'.toLowerCase();
      return _q.isEmpty || name.contains(_q.toLowerCase());
    }).toList();

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.6,
      maxChildSize: 0.9,
      builder: (_, ctrl) => Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                Expanded(child: Text(widget.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600))),
                TextButton(
                  onPressed: () { widget.onDone(_sel); Navigator.pop(context); },
                  child: const Text('Done', style: TextStyle(color: AppTheme.primary)),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              onChanged: (v) => setState(() => _q = v),
              decoration: InputDecoration(
                hintText: 'Search…',
                prefixIcon: const Icon(Icons.search, size: 18),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.border)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.border)),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.builder(
              controller: ctrl,
              itemCount: filtered.length,
              itemBuilder: (_, i) {
                final e = filtered[i];
                final selected = _sel.contains(e.id);
                return CheckboxListTile(
                  value: selected,
                  activeColor: AppTheme.primary,
                  title: Text('${e.firstName} ${e.lastName}', style: const TextStyle(fontSize: 13)),
                  subtitle: Text(e.position!, style: const TextStyle(fontSize: 11)),
                  onChanged: (_) => setState(() {
                    if (selected) {
                      _sel.remove(e.id);
                    } else {
                      _sel.add(e.id);
                    }
                  }),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ── Dept picker ───────────────────────────────────────────────────────────────

class _DeptPicker extends StatelessWidget {
  final List<String> selected, all;
  final ValueChanged<List<String>> onChanged;
  const _DeptPicker({required this.selected, required this.all, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Departments', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8, runSpacing: 8,
          children: all.map((d) {
            final sel = selected.contains(d);
            return GestureDetector(
              onTap: () {
                final next = List<String>.from(selected);
                if (sel) {
                  next.remove(d);
                } else {
                  next.add(d);
                }
                onChanged(next);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: sel ? AppTheme.primary : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: sel ? AppTheme.primary : AppTheme.border),
                ),
                child: Text(d, style: TextStyle(fontSize: 12, color: sel ? Colors.white : AppTheme.textSecondary, fontWeight: FontWeight.w500)),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

// ── Required Skills Picker ────────────────────────────────────────────────────

class _SkillsPicker extends StatefulWidget {
  final List<String> skills;
  final ValueChanged<List<String>> onChanged;
  const _SkillsPicker({required this.skills, required this.onChanged});
  @override
  State<_SkillsPicker> createState() => _SkillsPickerState();
}

class _SkillsPickerState extends State<_SkillsPicker> {
  final _ctrl = TextEditingController();

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  void _add() {
    final v = _ctrl.text.trim();
    if (v.isEmpty || widget.skills.contains(v)) return;
    widget.onChanged([...widget.skills, v]);
    _ctrl.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Required Skills', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
      const SizedBox(height: 6),
      Row(children: [
        Expanded(child: TextField(
          controller: _ctrl,
          decoration: InputDecoration(
            hintText: 'Add skill…',
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.border)),
          ),
          onSubmitted: (_) => _add(),
        )),
        const SizedBox(width: 8),
        IconButton(
          onPressed: _add,
          icon: const Icon(Icons.add_circle_outline, color: AppTheme.primary),
        ),
      ]),
      if (widget.skills.isNotEmpty) ...[
        const SizedBox(height: 8),
        Wrap(spacing: 6, runSpacing: 6, children: widget.skills.map((s) => Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: AppTheme.primary.withOpacity(0.08),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.primary.withOpacity(0.25)),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Text(s, style: const TextStyle(fontSize: 12, color: AppTheme.primary)),
            const SizedBox(width: 4),
            GestureDetector(
              onTap: () => widget.onChanged(widget.skills.where((x) => x != s).toList()),
              child: const Icon(Icons.close, size: 13, color: AppTheme.primary),
            ),
          ]),
        )).toList()),
      ],
    ]);
  }
}
