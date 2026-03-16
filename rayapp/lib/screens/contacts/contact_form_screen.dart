import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/contact.dart';
import '../../services/contact_service.dart';
import '../../services/department_service.dart';

class ContactFormScreen extends StatefulWidget {
  final Contact? contact;
  const ContactFormScreen({super.key, this.contact});
  @override
  State<ContactFormScreen> createState() => _ContactFormScreenState();
}

class _ContactFormScreenState extends State<ContactFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _svc = ContactService.instance;
  bool _loading = false;
  String? _deptError;

  late final TextEditingController _name, _phone, _email, _altPhone,
      _company, _position, _role, _address, _notes, _reference,
      _website, _linkedIn, _twitter, _industry, _companySize, _annualRevenue;
  final _tagCtrl = TextEditingController();

  String _contactType    = 'personal';
  String _visibilityLevel = 'personal';
  String _priority       = 'medium';
  String _status         = 'active';
  bool   _isCustomer     = false;
  bool   _isVendor       = false;
  String? _departmentId;
  List<String> _tags     = [];
  DateTime? _birthday;
  DateTime? _anniversary;
  List<Map<String, String>> _departments = [];

  bool get _isEdit => widget.contact != null;

  bool _isDirty() {
    final c = widget.contact;
    if (c == null) {
      return _name.text.trim().isNotEmpty ||
          _phone.text.trim().isNotEmpty ||
          _email.text.trim().isNotEmpty ||
          _altPhone.text.trim().isNotEmpty ||
          _company.text.trim().isNotEmpty ||
          _position.text.trim().isNotEmpty ||
          _role.text.trim().isNotEmpty ||
          _address.text.trim().isNotEmpty ||
          _notes.text.trim().isNotEmpty ||
          _reference.text.trim().isNotEmpty ||
          _website.text.trim().isNotEmpty ||
          _linkedIn.text.trim().isNotEmpty ||
          _twitter.text.trim().isNotEmpty ||
          _industry.text.trim().isNotEmpty ||
          _companySize.text.trim().isNotEmpty ||
          _annualRevenue.text.trim().isNotEmpty ||
          _tags.isNotEmpty ||
          _birthday != null ||
          _anniversary != null;
    }
    return _name.text.trim() != c.name ||
        _phone.text.trim() != c.phone ||
        _email.text.trim() != (c.email ?? '') ||
        _altPhone.text.trim() != (c.alternativePhone ?? '') ||
        _company.text.trim() != (c.company ?? '') ||
        _position.text.trim() != (c.position ?? '') ||
        _role.text.trim() != (c.role ?? '') ||
        _address.text.trim() != (c.address ?? '') ||
        _notes.text.trim() != (c.notes ?? '') ||
        _reference.text.trim() != (c.reference ?? '') ||
        _website.text.trim() != (c.website ?? '') ||
        _linkedIn.text.trim() != (c.linkedIn ?? '') ||
        _twitter.text.trim() != (c.twitter ?? '') ||
        _industry.text.trim() != (c.industry ?? '') ||
        _companySize.text.trim() != (c.companySize ?? '') ||
        _annualRevenue.text.trim() != (c.annualRevenue ?? '') ||
        _contactType != c.contactType ||
        _visibilityLevel != c.visibilityLevel ||
        _priority != c.priority ||
        _status != c.status ||
        _isCustomer != c.isCustomer ||
        _isVendor != c.isVendor ||
        _departmentId != c.department?.id ||
        _tags.join(',') != c.tags.join(',') ||
        _birthday != c.birthday ||
        _anniversary != c.anniversary;
  }

  String? _phoneValidator(String? v) {
    if (v == null || v.trim().isEmpty) return 'Required';
    final digits = v.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 7) return 'Phone must have at least 7 digits';
    return null;
  }

  String? _emailValidator(String? v) {
    if (v == null || v.trim().isEmpty) return null;
    if (!v.contains('@')) return 'Invalid email format';
    return null;
  }

  @override
  void initState() {
    super.initState();
    final c = widget.contact;
    _name          = TextEditingController(text: c?.name ?? '');
    _phone         = TextEditingController(text: c?.phone ?? '');
    _email         = TextEditingController(text: c?.email ?? '');
    _altPhone      = TextEditingController(text: c?.alternativePhone ?? '');
    _company       = TextEditingController(text: c?.company ?? '');
    _position      = TextEditingController(text: c?.position ?? '');
    _role          = TextEditingController(text: c?.role ?? '');
    _address       = TextEditingController(text: c?.address ?? '');
    _notes         = TextEditingController(text: c?.notes ?? '');
    _reference     = TextEditingController(text: c?.reference ?? '');
    _website       = TextEditingController(text: c?.website ?? '');
    _linkedIn      = TextEditingController(text: c?.linkedIn ?? '');
    _twitter       = TextEditingController(text: c?.twitter ?? '');
    _industry      = TextEditingController(text: c?.industry ?? '');
    _companySize   = TextEditingController(text: c?.companySize ?? '');
    _annualRevenue = TextEditingController(text: c?.annualRevenue ?? '');
    _contactType      = c?.contactType ?? 'personal';
    _visibilityLevel  = c?.visibilityLevel ?? 'personal';
    _priority         = c?.priority ?? 'medium';
    _status           = c?.status ?? 'active';
    _isCustomer       = c?.isCustomer ?? false;
    _isVendor         = c?.isVendor ?? false;
    _departmentId     = c?.department?.id;
    _tags             = List<String>.from(c?.tags ?? []);
    _birthday         = c?.birthday;
    _anniversary      = c?.anniversary;
    _loadDepartments();
  }

  Future<void> _loadDepartments() async {
    try {
      final depts = await DepartmentService().getAll();
      if (mounted) {
        setState(() {
          _departments = depts.map((d) => {'id': d.id, 'name': d.name}).toList();
          _deptError = null;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _deptError = e.toString());
    }
  }

  @override
  void dispose() {
    for (final c in [_name, _phone, _email, _altPhone, _company, _position,
        _role, _address, _notes, _reference, _website, _linkedIn, _twitter,
        _industry, _companySize, _annualRevenue, _tagCtrl]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickDate(bool isBirthday) async {
    final initial = isBirthday ? (_birthday ?? DateTime(1990)) : (_anniversary ?? DateTime.now());
    final p = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: isBirthday ? DateTime(1900) : DateTime(2000),
      lastDate: DateTime.now().add(const Duration(days: 365 * 10)),
      builder: (c, child) => Theme(
        data: Theme.of(c).copyWith(colorScheme: const ColorScheme.light(primary: AppTheme.primary)),
        child: child!,
      ),
    );
    if (p != null) setState(() => isBirthday ? _birthday = p : _anniversary = p);
  }

  void _addTag() {
    final t = _tagCtrl.text.trim();
    if (t.isNotEmpty && !_tags.contains(t)) {
      setState(() { _tags.add(t); _tagCtrl.clear(); });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_visibilityLevel == 'departmental' && (_departmentId == null || _departmentId!.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select a department for departmental visibility')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      final body = <String, dynamic>{
        'name': _name.text.trim(),
        'phone': _phone.text.trim(),
        'visibilityLevel': _visibilityLevel,
        'contactType': _contactType,
        'priority': _priority,
        'status': _status,
        'isCustomer': _isCustomer,
        'isVendor': _isVendor,
        if (_email.text.trim().isNotEmpty)         'email': _email.text.trim(),
        if (_altPhone.text.trim().isNotEmpty)       'alternativePhone': _altPhone.text.trim(),
        if (_company.text.trim().isNotEmpty)        'company': _company.text.trim(),
        if (_position.text.trim().isNotEmpty)       'position': _position.text.trim(),
        if (_role.text.trim().isNotEmpty)           'role': _role.text.trim(),
        if (_address.text.trim().isNotEmpty)        'address': _address.text.trim(),
        if (_notes.text.trim().isNotEmpty)          'notes': _notes.text.trim(),
        if (_reference.text.trim().isNotEmpty)      'reference': _reference.text.trim(),
        if (_website.text.trim().isNotEmpty)        'website': _website.text.trim(),
        if (_linkedIn.text.trim().isNotEmpty)       'linkedIn': _linkedIn.text.trim(),
        if (_twitter.text.trim().isNotEmpty)        'twitter': _twitter.text.trim(),
        if (_industry.text.trim().isNotEmpty)       'industry': _industry.text.trim(),
        if (_companySize.text.trim().isNotEmpty)    'companySize': _companySize.text.trim(),
        if (_annualRevenue.text.trim().isNotEmpty)  'annualRevenue': _annualRevenue.text.trim(),
        if (_visibilityLevel == 'departmental' && _departmentId != null) 'department': _departmentId,
        if (_tags.isNotEmpty)       'tags': _tags,
        if (_birthday != null)      'birthday': _birthday!.toIso8601String(),
        if (_anniversary != null)   'anniversary': _anniversary!.toIso8601String(),
      };
      _isEdit ? await _svc.update(widget.contact!.id, body) : await _svc.create(body);
      if (mounted) {
        Navigator.pop(context);
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(_isEdit ? 'Contact updated' : 'Contact created'), duration: const Duration(seconds: 2)),
            );
          }
        });
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  double _hPad(double w) {
    if (w < 400) return 12;
    if (w < 600) return 16;
    return 20;
  }

  bool _isTwoCol(double w) => w >= 600;

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final pad = _hPad(w);
    final twoCol = _isTwoCol(w);
    final scaffoldBg = isDark ? const Color(0xFF111827) : const Color(0xFFF8F9FA);
    final footerBg = isDark ? const Color(0xFF1F2937) : Colors.white;
    final footerBorder = isDark ? const Color(0xFF374151) : AppTheme.border;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        if (!_isDirty()) {
          Navigator.of(context).pop();
          return;
        }
        final discard = await showDialog<bool>(
          context: context,
          builder: (_) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Text('Discard changes?', style: TextStyle(fontWeight: FontWeight.w700)),
            content: const Text('You have unsaved changes. Are you sure you want to discard them?'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
              FilledButton(
                style: FilledButton.styleFrom(backgroundColor: AppTheme.red),
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Discard'),
              ),
            ],
          ),
        );
        if (discard == true && context.mounted) {
          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
        backgroundColor: scaffoldBg,
        appBar: AppBar(
          title: Text(_isEdit ? 'Edit Contact' : 'New Contact',
              style: const TextStyle(fontWeight: FontWeight.w700)),
          centerTitle: false,
        ),
        body: Form(
          key: _formKey,
          child: Column(children: [
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.fromLTRB(pad, pad, pad, 0),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 900),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      _section(isDark, 1, 'Basic Info', Icons.person_outline, [
                        _f(_name, 'Full Name', req: true),
                        twoCol
                            ? _row2(_f(_phone, 'Phone', kb: TextInputType.phone, validator: _phoneValidator),
                                    _f(_email, 'Email', kb: TextInputType.emailAddress, validator: _emailValidator))
                            : Column(children: [
                                _f(_phone, 'Phone', kb: TextInputType.phone, validator: _phoneValidator),
                                _f(_email, 'Email', kb: TextInputType.emailAddress, validator: _emailValidator),
                              ]),
                        twoCol
                            ? _row2(_f(_altPhone, 'Alternative Phone', kb: TextInputType.phone),
                                    _f(_company, 'Company'))
                            : Column(children: [
                                _f(_altPhone, 'Alternative Phone', kb: TextInputType.phone),
                                _f(_company, 'Company'),
                              ]),
                        twoCol
                            ? _row2(_f(_position, 'Position'), _f(_role, 'Role / Title'))
                            : Column(children: [_f(_position, 'Position'), _f(_role, 'Role / Title')]),
                        _f(_address, 'Address', lines: 2),
                      ]),
                      const SizedBox(height: 12),

                      _section(isDark, 2, 'Classification', Icons.label_outline, [
                        twoCol
                            ? _row2(
                                _dd('Type', _contactType, ['personal', 'company', 'client', 'vendor', 'partner'], (v) => setState(() => _contactType = v!)),
                                _dd('Priority', _priority, ['low', 'medium', 'high', 'critical'], (v) => setState(() => _priority = v!)),
                              )
                            : Column(children: [
                                _dd('Type', _contactType, ['personal', 'company', 'client', 'vendor', 'partner'], (v) => setState(() => _contactType = v!)),
                                _dd('Priority', _priority, ['low', 'medium', 'high', 'critical'], (v) => setState(() => _priority = v!)),
                              ]),
                        twoCol
                            ? _row2(
                                _dd('Status', _status, ['active', 'inactive', 'archived'], (v) => setState(() => _status = v!)),
                                _dd('Visibility', _visibilityLevel, ['personal', 'departmental', 'universal'], (v) => setState(() => _visibilityLevel = v!)),
                              )
                            : Column(children: [
                                _dd('Status', _status, ['active', 'inactive', 'archived'], (v) => setState(() => _status = v!)),
                                _dd('Visibility', _visibilityLevel, ['personal', 'departmental', 'universal'], (v) => setState(() => _visibilityLevel = v!)),
                              ]),
                        if (_visibilityLevel == 'departmental') _deptDropdown(),
                        if (_deptError != null) ...[
                          Padding(
                            padding: const EdgeInsets.only(bottom: 14),
                            child: Text('Failed to load departments: $_deptError',
                                style: const TextStyle(fontSize: 12, color: AppTheme.red)),
                          ),
                        ],
                        _checkRow(twoCol),
                        _tagsField(),
                      ]),
                      const SizedBox(height: 12),

                      _section(isDark, 3, 'Business Details', Icons.business_outlined, [
                        _f(_industry, 'Industry'),
                        twoCol
                            ? _row2(_f(_companySize, 'Company Size'), _f(_annualRevenue, 'Annual Revenue'))
                            : Column(children: [_f(_companySize, 'Company Size'), _f(_annualRevenue, 'Annual Revenue')]),
                        _f(_reference, 'Reference'),
                        _f(_notes, 'Notes', lines: 3),
                      ]),
                      const SizedBox(height: 12),

                      _section(isDark, 4, 'Social & Dates', Icons.public_outlined, [
                        _f(_website, 'Website', kb: TextInputType.url),
                        _f(_linkedIn, 'LinkedIn URL', kb: TextInputType.url),
                        _f(_twitter, 'Twitter Handle'),
                        twoCol
                            ? _row2(_datePicker('Birthday', _birthday, true), _datePicker('Anniversary', _anniversary, false))
                            : Column(children: [_datePicker('Birthday', _birthday, true), _datePicker('Anniversary', _anniversary, false)]),
                      ]),
                      SizedBox(height: pad),
                    ]),
                  ),
                ),
              ),
            ),

            Container(
              padding: EdgeInsets.fromLTRB(pad, 12, pad, MediaQuery.of(context).padding.bottom + 12),
              decoration: BoxDecoration(
                color: footerBg,
                border: Border(top: BorderSide(color: footerBorder)),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 8, offset: const Offset(0, -2))],
              ),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 900),
                  child: SizedBox(
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _loading ? null : _submit,
                      child: _loading
                          ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Text(_isEdit ? 'Save Changes' : 'Create Contact',
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                    ),
                  ),
                ),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _section(bool isDark, int num, String title, IconData icon, List<Widget> children) {
    final bg = isDark ? const Color(0xFF1F2937) : Colors.white;
    final border = isDark ? const Color(0xFF374151) : AppTheme.border;
    return Container(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
          child: Row(children: [
            Container(
              width: 24, height: 24,
              decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(6)),
              child: Center(child: Text('$num', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700))),
            ),
            const SizedBox(width: 8),
            Icon(icon, size: 15, color: AppTheme.primary),
            const SizedBox(width: 6),
            Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : AppTheme.textPrimary)),
          ]),
        ),
        Divider(height: 1, color: isDark ? const Color(0xFF374151) : AppTheme.border),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: children),
        ),
      ]),
    );
  }

  Widget _row2(Widget a, Widget b) => Row(children: [
        Expanded(child: Padding(padding: const EdgeInsets.only(right: 6), child: a)),
        Expanded(child: Padding(padding: const EdgeInsets.only(left: 6), child: b)),
      ]);

  Widget _f(TextEditingController ctrl, String label,
      {TextInputType? kb, bool req = false, int lines = 1, String? Function(String?)? validator}) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: TextFormField(
          controller: ctrl,
          keyboardType: kb,
          maxLines: lines,
          textInputAction: lines > 1 ? TextInputAction.newline : TextInputAction.next,
          decoration: InputDecoration(labelText: req ? '$label *' : label),
          validator: validator ?? (req ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null : null),
        ),
      );

  Widget _dd(String label, String value, List<String> options, ValueChanged<String?> onChange) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: DropdownButtonFormField<String>(
          initialValue: value,
          isDense: true,
          decoration: InputDecoration(labelText: label),
          items: options.map((o) => DropdownMenuItem(value: o,
              child: Text(_capitalize(o), style: const TextStyle(fontSize: 13)))).toList(),
          onChanged: onChange,
        ),
      );

  Widget _deptDropdown() => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: DropdownButtonFormField<String>(
          initialValue: _departmentId,
          isDense: true,
          decoration: const InputDecoration(labelText: 'Department *'),
          items: _departments.map((d) => DropdownMenuItem(value: d['id'],
              child: Text(d['name']!, style: const TextStyle(fontSize: 13)))).toList(),
          onChanged: (v) => setState(() => _departmentId = v),
          validator: (v) => _visibilityLevel == 'departmental' && (v == null || v.isEmpty) ? 'Required' : null,
        ),
      );

  Widget _checkRow(bool twoCol) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Row(children: [
          Expanded(child: _checkTile('Customer', _isCustomer, AppTheme.blue, (v) => setState(() => _isCustomer = v ?? false))),
          const SizedBox(width: 8),
          Expanded(child: _checkTile('Vendor', _isVendor, AppTheme.amber, (v) => setState(() => _isVendor = v ?? false))),
        ]),
      );

  Widget _checkTile(String label, bool value, Color color, ValueChanged<bool?> onChange) {
    return GestureDetector(
      onTap: () => onChange(!value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: value ? color.withValues(alpha: 0.08) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: value ? color : AppTheme.border, width: value ? 1.5 : 1),
        ),
        child: Row(children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            width: 18, height: 18,
            decoration: BoxDecoration(
              color: value ? color : Colors.transparent,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: value ? color : AppTheme.textMuted),
            ),
            child: value ? const Icon(Icons.check, size: 12, color: Colors.white) : null,
          ),
          const SizedBox(width: 8),
          Text(label, style: TextStyle(fontSize: 13, fontWeight: value ? FontWeight.w600 : FontWeight.normal,
              color: value ? color : AppTheme.textSecondary)),
        ]),
      ),
    );
  }

  Widget _tagsField() => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (_tags.isNotEmpty) ...[
            Wrap(spacing: 6, runSpacing: 6, children: _tags.map((t) => Chip(
              label: Text(t, style: const TextStyle(fontSize: 12)),
              deleteIcon: const Icon(Icons.close, size: 13),
              onDeleted: () => setState(() => _tags.remove(t)),
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              padding: const EdgeInsets.symmetric(horizontal: 4),
              visualDensity: VisualDensity.compact,
            )).toList()),
            const SizedBox(height: 8),
          ],
          Row(children: [
            Expanded(child: TextFormField(
              controller: _tagCtrl,
              decoration: InputDecoration(
                hintText: 'Add tag and press +',
                hintStyle: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                prefixIcon: const Icon(Icons.label_outline, size: 16, color: AppTheme.textMuted),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
              onFieldSubmitted: (_) => _addTag(),
              textInputAction: TextInputAction.done,
            )),
            const SizedBox(width: 8),
            SizedBox(
              height: 44,
              child: ElevatedButton(
                onPressed: _addTag,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
                child: const Icon(Icons.add, size: 18),
              ),
            ),
          ]),
        ]),
      );

  Widget _datePicker(String label, DateTime? value, bool isBirthday) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: GestureDetector(
          onTap: () => _pickDate(isBirthday),
          child: InputDecorator(
            decoration: InputDecoration(
              labelText: label,
              suffixIcon: Row(mainAxisSize: MainAxisSize.min, children: [
                if (value != null)
                  GestureDetector(
                    onTap: () => setState(() => isBirthday ? _birthday = null : _anniversary = null),
                    child: const Padding(
                      padding: EdgeInsets.all(8),
                      child: Icon(Icons.clear, size: 15, color: AppTheme.textMuted),
                    ),
                  ),
                const Padding(
                  padding: EdgeInsets.only(right: 12),
                  child: Icon(Icons.calendar_today_outlined, size: 15, color: AppTheme.textMuted),
                ),
              ]),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.border)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
            ),
            child: Text(
              value != null ? '${value.year}-${value.month.toString().padLeft(2, '0')}-${value.day.toString().padLeft(2, '0')}' : 'Select date',
              style: TextStyle(fontSize: 14, color: value != null ? AppTheme.textPrimary : AppTheme.textMuted),
            ),
          ),
        ),
      );

  String _capitalize(String s) => s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);
}
