import 'package:flutter/material.dart';
import '../../../config/app_theme.dart';
import '../../../models/leave.dart';
import '../../../models/employee.dart';
import '../../../services/leave_service.dart';
import '../../../services/employee_service.dart';

class OrgLeavesScreen extends StatefulWidget {
  const OrgLeavesScreen({super.key});
  @override
  State<OrgLeavesScreen> createState() => _OrgLeavesScreenState();
}

class _OrgLeavesScreenState extends State<OrgLeavesScreen> {
  final _svc = LeaveService();
  final _empSvc = EmployeeService();
  List<Leave> _all = [];
  List<Employee> _employees = [];
  bool _loading = true;
  String? _error;
  String _statusFilter = '';

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([_svc.getAll(), _empSvc.getAll()]);
      if (mounted) setState(() {
        _all = results[0] as List<Leave>;
        _employees = results[1] as List<Employee>;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<Leave> get _filtered => _statusFilter.isEmpty
      ? _all
      : _all.where((l) => l.status == _statusFilter).toList();

  Future<void> _updateStatus(String id, String status) async {
    try { await _svc.updateStatus(id, status); _load(); }
    catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e'))); }
  }

  void _showCreateDialog() => showDialog(
    context: context,
    builder: (_) => _CreateLeaveDialog(employees: _employees, svc: _svc, onDone: _load),
  );

  @override
  Widget build(BuildContext context) {
    final pending = _all.where((l) => l.status == 'pending').length;
    final approved = _all.where((l) => l.status == 'approved').length;
    final rejected = _all.where((l) => l.status == 'rejected').length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      floatingActionButton: FloatingActionButton.small(
        backgroundColor: AppTheme.primary,
        onPressed: _showCreateDialog,
        tooltip: 'New Leave Request',
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 36),
                  const SizedBox(height: 8),
                  Text(_error!, style: const TextStyle(color: Color(0xFFDC2626))),
                  TextButton(onPressed: _load, child: const Text('Retry')),
                ]))
              : Column(children: [
                  // ── 4 stat cards ──────────────────────────────────────
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: LayoutBuilder(builder: (_, c) {
                      final cols = c.maxWidth < 340 ? 2 : 4;
                      final spacing = 8.0 * (cols - 1);
                      final tileW = (c.maxWidth - spacing) / cols;
                      return GridView.count(
                        crossAxisCount: cols,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisSpacing: 8,
                        childAspectRatio: tileW / 64,
                        children: [
                          _statCard('Total', '${_all.length}', Icons.event_note_outlined, AppTheme.primary),
                          _statCard('Pending', '$pending', Icons.hourglass_empty_outlined, const Color(0xFFD97706)),
                          _statCard('Approved', '$approved', Icons.check_circle_outline, const Color(0xFF16A34A)),
                          _statCard('Rejected', '$rejected', Icons.cancel_outlined, const Color(0xFFDC2626)),
                        ],
                      );
                    }),
                  ),
                  // ── filter chips ──────────────────────────────────────
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(children: [
                        _chip('All', '', _all.length),
                        const SizedBox(width: 8),
                        _chip('Pending', 'pending', pending),
                        const SizedBox(width: 8),
                        _chip('Approved', 'approved', approved),
                        const SizedBox(width: 8),
                        _chip('Rejected', 'rejected', rejected),
                      ]),
                    ),
                  ),
                  // ── list ──────────────────────────────────────────────
                  Expanded(
                    child: _filtered.isEmpty
                        ? const Center(child: Text('No leave requests', style: TextStyle(color: Color(0xFF6B7280))))
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                            itemCount: _filtered.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 8),
                            itemBuilder: (_, i) => _card(_filtered[i]),
                          ),
                  ),
                ]),
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFE5E7EB))),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(height: 3),
          FittedBox(fit: BoxFit.scaleDown, child: Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: color))),
          FittedBox(fit: BoxFit.scaleDown, child: Text(label, style: const TextStyle(fontSize: 9, color: Color(0xFF6B7280)))),
        ]),
      );

  Widget _chip(String label, String value, int count) {
    final sel = _statusFilter == value;
    final color = value == 'pending' ? const Color(0xFFD97706)
        : value == 'approved' ? const Color(0xFF16A34A)
        : value == 'rejected' ? const Color(0xFFDC2626)
        : AppTheme.primary;
    return GestureDetector(
      onTap: () => setState(() => _statusFilter = sel ? '' : value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: sel ? color.withValues(alpha: 0.1) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: sel ? color : const Color(0xFFE5E7EB)),
        ),
        child: Text('$label ($count)', style: TextStyle(fontSize: 12, color: sel ? color : const Color(0xFF6B7280), fontWeight: sel ? FontWeight.w700 : FontWeight.normal)),
      ),
    );
  }

  Widget _card(Leave l) {
    final statusColor = l.status == 'approved' ? const Color(0xFF16A34A)
        : l.status == 'rejected' ? const Color(0xFFDC2626)
        : const Color(0xFFD97706);
    final start = AppTheme.fmtDate(l.startDate);
    final end = AppTheme.fmtDate(l.endDate);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFE5E7EB))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (l.employeeName.isNotEmpty)
              Text(l.employeeName, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF111827))),
            Text(l.leaveType.toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF6B7280), letterSpacing: 0.5)),
          ])),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
            child: Text(l.status, style: TextStyle(fontSize: 11, color: statusColor, fontWeight: FontWeight.w600)),
          ),
        ]),
        const SizedBox(height: 6),
        Text('$start → $end  ·  ${l.totalDays} day${l.totalDays != 1 ? 's' : ''}',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF111827))),
        if (l.reason.isNotEmpty) ...[ const SizedBox(height: 4), Text(l.reason, style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)), maxLines: 2, overflow: TextOverflow.ellipsis) ],
        if (l.status == 'pending') ...[ const SizedBox(height: 10), Row(children: [
          Expanded(child: OutlinedButton(
            style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFFDC2626), side: const BorderSide(color: Color(0xFFDC2626)), padding: const EdgeInsets.symmetric(vertical: 6)),
            onPressed: () => _updateStatus(l.id, 'rejected'),
            child: const Text('Reject', style: TextStyle(fontSize: 12)),
          )),
          const SizedBox(width: 8),
          Expanded(child: ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), padding: const EdgeInsets.symmetric(vertical: 6)),
            onPressed: () => _updateStatus(l.id, 'approved'),
            child: const Text('Approve', style: TextStyle(fontSize: 12, color: Colors.white)),
          )),
        ])],
      ]),
    );
  }
}

// ── Create Leave Dialog ───────────────────────────────────────────────────────

class _CreateLeaveDialog extends StatefulWidget {
  final List<Employee> employees;
  final LeaveService svc;
  final VoidCallback onDone;
  const _CreateLeaveDialog({required this.employees, required this.svc, required this.onDone});
  @override
  State<_CreateLeaveDialog> createState() => _CreateLeaveDialogState();
}

class _CreateLeaveDialogState extends State<_CreateLeaveDialog> {
  String? _empId;
  String _leaveType = 'sick';
  DateTime? _startDate, _endDate;
  final _reasonCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() { _reasonCtrl.dispose(); super.dispose(); }

  Future<void> _pick(bool isStart) async {
    final p = await showDatePicker(
      context: context, initialDate: DateTime.now(),
      firstDate: DateTime(2020), lastDate: DateTime(2030),
      builder: (c, child) => Theme(data: Theme.of(c).copyWith(colorScheme: const ColorScheme.light(primary: AppTheme.primary)), child: child!),
    );
    if (p != null) setState(() => isStart ? _startDate = p : _endDate = p);
  }

  Future<void> _submit() async {
    if (_empId == null || _startDate == null || _endDate == null || _reasonCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all fields')));
      return;
    }
    if (_endDate!.isBefore(_startDate!)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('End date must be after start date')));
      return;
    }
    setState(() => _loading = true);
    try {
      await widget.svc.create({
        'employee': _empId,
        'leaveType': _leaveType,
        'startDate': _startDate!.toIso8601String().split('T')[0],
        'endDate': _endDate!.toIso8601String().split('T')[0],
        'totalDays': _endDate!.difference(_startDate!).inDays + 1,
        'reason': _reasonCtrl.text.trim(),
      });
      if (mounted) Navigator.pop(context);
      widget.onDone();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Text('New Leave Request', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
      content: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
        DropdownButtonFormField<String>(
          initialValue: _empId,
          decoration: const InputDecoration(labelText: 'Employee'),
          items: widget.employees.map((e) => DropdownMenuItem(value: e.id, child: Text(e.fullName, style: const TextStyle(fontSize: 13)))).toList(),
          onChanged: (v) => setState(() => _empId = v),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: _leaveType,
          decoration: const InputDecoration(labelText: 'Leave Type'),
          items: ['sick','vacation','personal','maternity','paternity','emergency']
              .map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
          onChanged: (v) => setState(() => _leaveType = v!),
        ),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: GestureDetector(
            onTap: () => _pick(true),
            child: InputDecorator(
              decoration: const InputDecoration(labelText: 'Start Date', suffixIcon: Icon(Icons.calendar_today_outlined, size: 16)),
              child: Text(_startDate != null ? AppTheme.fmtDate(_startDate!) : 'Select',
                  style: TextStyle(fontSize: 13, color: _startDate != null ? Colors.black87 : AppTheme.textMuted)),
            ),
          )),
          const SizedBox(width: 8),
          Expanded(child: GestureDetector(
            onTap: () => _pick(false),
            child: InputDecorator(
              decoration: const InputDecoration(labelText: 'End Date', suffixIcon: Icon(Icons.calendar_today_outlined, size: 16)),
              child: Text(_endDate != null ? AppTheme.fmtDate(_endDate!) : 'Select',
                  style: TextStyle(fontSize: 13, color: _endDate != null ? Colors.black87 : AppTheme.textMuted)),
            ),
          )),
        ]),
        const SizedBox(height: 12),
        TextField(controller: _reasonCtrl, maxLines: 2, decoration: const InputDecoration(labelText: 'Reason')),
      ])),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
          onPressed: _loading ? null : _submit,
          child: _loading
              ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Submit', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}
