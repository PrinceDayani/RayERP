import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/employee.dart';
import '../../services/employee_service.dart';
import '../../services/department_service.dart';

class EmployeeFormScreen extends StatefulWidget {
  final Employee? employee;
  const EmployeeFormScreen({super.key, this.employee});
  @override
  State<EmployeeFormScreen> createState() => _EmployeeFormScreenState();
}

class _EmployeeFormScreenState extends State<EmployeeFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _svc = EmployeeService();
  final _deptSvc = DepartmentService();
  bool _loading = false;
  List<String> _departments = [];
  String? _selectedDept;
  List<String> _selectedDepts = [];
  late final TextEditingController _skills;
  late final TextEditingController _firstName, _lastName, _email, _phone,
      _position, _jobTitle, _department, _salary, _bio,
      _street, _city, _state, _country, _ecName, _ecRel, _ecPhone;
  String _status = 'active';
  DateTime? _hireDate;

  bool get _isEdit => widget.employee != null;

  @override
  void initState() {
    super.initState();
    final e = widget.employee;
    _firstName = TextEditingController(text: e?.firstName ?? '');
    _lastName  = TextEditingController(text: e?.lastName ?? '');
    _email     = TextEditingController(text: e?.email ?? '');
    _phone     = TextEditingController(text: e?.phone ?? '');
    _position  = TextEditingController(text: e?.position ?? '');
    _jobTitle  = TextEditingController(text: e?.jobTitle ?? '');
    _department= TextEditingController(text: e?.department ?? '');
    _salary    = TextEditingController(text: e?.salary?.toStringAsFixed(0) ?? '');
    _bio       = TextEditingController(text: e?.bio ?? '');
    _street    = TextEditingController(text: e?.address?.street ?? '');
    _city      = TextEditingController(text: e?.address?.city ?? '');
    _state     = TextEditingController(text: e?.address?.state ?? '');
    _country   = TextEditingController(text: e?.address?.country ?? '');
    _ecName    = TextEditingController(text: e?.emergencyContact?.name ?? '');
    _ecRel     = TextEditingController(text: e?.emergencyContact?.relationship ?? '');
    _ecPhone   = TextEditingController(text: e?.emergencyContact?.phone ?? '');
    _skills    = TextEditingController(text: e?.skills.join(', ') ?? '');
    _status    = e?.status ?? 'active';
    _hireDate  = e?.hireDate;
    _selectedDept = e?.department;
    _selectedDepts = List<String>.from(e?.departments ?? []);
    if (_selectedDepts.isEmpty && (e?.department ?? '').isNotEmpty) {
      _selectedDepts = [e!.department!];
    }
    _deptSvc.getNames().then((d) {
      if (mounted) setState(() => _departments = d);
    }).catchError((_) {});
  }

  @override
  void dispose() {
    for (final c in [_firstName,_lastName,_email,_phone,_position,_jobTitle,
        _department,_salary,_bio,_street,_city,_state,_country,_ecName,_ecRel,_ecPhone,_skills]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickDate() async {
    final p = await showDatePicker(
      context: context, initialDate: _hireDate ?? DateTime.now(),
      firstDate: DateTime(2000), lastDate: DateTime.now(),
      builder: (c, child) => Theme(
        data: Theme.of(c).copyWith(colorScheme: const ColorScheme.light(primary: AppTheme.primary)),
        child: child!,
      ),
    );
    if (p != null) setState(() => _hireDate = p);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_hireDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a hire date')));
      return;
    }
    setState(() => _loading = true);
    try {
      final body = <String, dynamic>{
        'firstName': _firstName.text.trim(), 'lastName': _lastName.text.trim(),
        'email': _email.text.trim(), 'phone': _phone.text.trim(),
        'position': _position.text.trim(), 'status': _status,
        'salary': double.tryParse(_salary.text.trim()) ?? 0,
        'hireDate': _hireDate!.toIso8601String().split('T')[0],
        if (_jobTitle.text.trim().isNotEmpty) 'jobTitle': _jobTitle.text.trim(),
        if (_selectedDepts.isNotEmpty) 'departments': _selectedDepts,
        if (_selectedDepts.isNotEmpty) 'department': _selectedDepts.first,
        if (_skills.text.trim().isNotEmpty)
          'skills': _skills.text.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList(),
        if (_bio.text.trim().isNotEmpty) 'bio': _bio.text.trim(),
        if (_street.text.trim().isNotEmpty || _city.text.trim().isNotEmpty || _country.text.trim().isNotEmpty)
          'address': {'street': _street.text.trim(), 'city': _city.text.trim(), 'state': _state.text.trim(), 'country': _country.text.trim()},
        if (_ecName.text.trim().isNotEmpty || _ecPhone.text.trim().isNotEmpty)
          'emergencyContact': {'name': _ecName.text.trim(), 'relationship': _ecRel.text.trim(), 'phone': _ecPhone.text.trim()},
      };
      _isEdit ? await _svc.update(widget.employee!.id, body) : await _svc.create(body);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(title: Text(_isEdit ? 'Edit Employee' : 'Add Employee')),
      body: Form(
        key: _formKey,
        child: Column(children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                _section(1, 'Basic Info', [
                  _row2(_f(_firstName, 'First Name', req: true), _f(_lastName, 'Last Name', req: true)),
                  _f(_email, 'Email', kb: TextInputType.emailAddress, req: true),
                  _f(_phone, 'Phone', kb: TextInputType.phone, req: true),
                  _f(_position, 'Position', req: true),
                  _row2(_f(_jobTitle, 'Job Title'), _deptDropdown()),
                  _multiDeptChips(),
                  _f(_skills, 'Skills (comma-separated)'),
                  _statusDropdown(),
                ]),
                const SizedBox(height: 12),
                _section(2, 'Employment', [
                  _f(_salary, 'Salary', kb: TextInputType.number, req: true),
                  _datePicker(),
                  _f(_bio, 'Bio', lines: 2),
                ]),
                const SizedBox(height: 12),
                _section(3, 'Address', [
                  _f(_street, 'Street'),
                  _row2(_f(_city, 'City'), _f(_state, 'State')),
                  _f(_country, 'Country'),
                ]),
                const SizedBox(height: 12),
                _section(4, 'Emergency Contact', [
                  _f(_ecName, 'Name'),
                  _row2(_f(_ecRel, 'Relationship'), _f(_ecPhone, 'Phone', kb: TextInputType.phone)),
                ]),
                const SizedBox(height: 16),
              ]),
            ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: Color(0xFFE5E7EB)))),
            child: SizedBox(
              height: 48,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(_isEdit ? 'Save Changes' : 'Add Employee', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _section(int num, String title, List<Widget> children) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
            child: Row(children: [
              Container(
                width: 22, height: 22,
                decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(6)),
                child: Center(child: Text('$num', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold))),
              ),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
            ]),
          ),
          const Divider(height: 1, color: Color(0xFFE5E7EB)),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Column(children: children),
          ),
        ]),
      );

  Widget _row2(Widget a, Widget b) => Row(children: [
        Expanded(child: Padding(padding: const EdgeInsets.only(right: 6), child: a)),
        Expanded(child: Padding(padding: const EdgeInsets.only(left: 6), child: b)),
      ]);

  Widget _f(TextEditingController ctrl, String label, {TextInputType? kb, bool req = false, int lines = 1}) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextFormField(
          controller: ctrl, keyboardType: kb, maxLines: lines,
          decoration: InputDecoration(labelText: req ? '$label *' : label),
          validator: req ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null : null,
        ),
      );

  Widget _multiDeptChips() {
    if (_departments.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Departments', style: TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
        const SizedBox(height: 6),
        Wrap(
          spacing: 6, runSpacing: 6,
          children: _departments.map((d) {
            final sel = _selectedDepts.contains(d);
            return GestureDetector(
              onTap: () => setState(() => sel ? _selectedDepts.remove(d) : _selectedDepts.add(d)),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: sel ? AppTheme.primary.withOpacity(0.1) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: sel ? AppTheme.primary : const Color(0xFFE5E7EB)),
                ),
                child: Text(d, style: TextStyle(fontSize: 12, color: sel ? AppTheme.primary : const Color(0xFF6B7280), fontWeight: sel ? FontWeight.w600 : FontWeight.normal)),
              ),
            );
          }).toList(),
        ),
      ]),
    );
  }

  Widget _deptDropdown() => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: _departments.isEmpty
            ? _f(_department, 'Department')
            : DropdownButtonFormField<String>(
                value: _departments.contains(_selectedDept) ? _selectedDept : null,
                decoration: const InputDecoration(labelText: 'Department'),
                items: _departments
                    .map((d) => DropdownMenuItem(value: d, child: Text(d, overflow: TextOverflow.ellipsis)))
                    .toList(),
                onChanged: (v) => setState(() => _selectedDept = v),
              ),
      );

  Widget _statusDropdown() => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: DropdownButtonFormField<String>(
          value: _status,
          decoration: const InputDecoration(labelText: 'Status'),
          items: ['active', 'inactive', 'terminated']
              .map((s) => DropdownMenuItem(value: s, child: Text(s)))
              .toList(),
          onChanged: (v) => setState(() => _status = v!),
        ),
      );

  Widget _datePicker() => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: GestureDetector(
          onTap: _pickDate,
          child: InputDecorator(
            decoration: InputDecoration(
              labelText: 'Hire Date *',
              suffixIcon: const Icon(Icons.calendar_today_outlined, size: 16),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: _hireDate == null ? const Color(0xFFE5E7EB) : AppTheme.primary),
              ),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: Text(
              _hireDate != null ? _hireDate!.toIso8601String().split('T')[0] : 'Select date',
              style: TextStyle(fontSize: 14, color: _hireDate != null ? Colors.black87 : const Color(0xFF9CA3AF)),
            ),
          ),
        ),
      );
}
