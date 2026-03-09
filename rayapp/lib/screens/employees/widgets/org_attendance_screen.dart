import 'package:flutter/material.dart';
import '../../../config/app_theme.dart';
import '../../../models/attendance.dart';
import '../../../models/employee.dart';
import '../../../services/attendance_service.dart';
import '../../../services/employee_service.dart';

class OrgAttendanceScreen extends StatefulWidget {
  const OrgAttendanceScreen({super.key});
  @override
  State<OrgAttendanceScreen> createState() => _OrgAttendanceScreenState();
}

class _OrgAttendanceScreenState extends State<OrgAttendanceScreen> {
  final _svc = AttendanceService();
  final _empSvc = EmployeeService();
  List<Attendance> _records = [];
  List<Employee> _employees = [];
  bool _loading = true;
  String? _error;
  String _filter = '';

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([_svc.getToday(), _empSvc.getAll()]);
      if (!mounted) return;
      setState(() {
        _records = results[0] as List<Attendance>;
        _employees = results[1] as List<Employee>;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<Attendance> get _filtered => _filter.isEmpty
      ? _records
      : _records.where((r) => r.status == _filter).toList();



  Future<void> _checkOut(String employeeId) async {
    try { await _svc.checkOut(employeeId); _load(); }
    catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e'))); }
  }

  void _showMarkDialog() => showDialog(
    context: context,
    builder: (_) => _MarkAttendanceDialog(employees: _employees, svc: _svc, onDone: _load),
  );

  @override
  Widget build(BuildContext context) {
    final present = _records.where((r) => r.status == 'present').length;
    final late = _records.where((r) => r.status == 'late').length;
    final totalHours = _records.fold(0.0, (s, r) => s + r.totalHours);
    final avgHours = _records.isEmpty ? 0.0 : totalHours / _records.length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      floatingActionButton: FloatingActionButton.small(
        backgroundColor: AppTheme.primary,
        onPressed: _showMarkDialog,
        tooltip: 'Mark Attendance',
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
                          _statCard('Present', '$present', Icons.check_circle_outline, const Color(0xFF16A34A)),
                          _statCard('Late', '$late', Icons.schedule_outlined, const Color(0xFFD97706)),
                          _statCard('Total Hrs', totalHours.toStringAsFixed(0), Icons.timer_outlined, AppTheme.primary),
                          _statCard('Avg Hrs', avgHours.toStringAsFixed(1), Icons.bar_chart_outlined, const Color(0xFF7C3AED)),
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
                        _chip('All', '', _records.length, const Color(0xFF374151)),
                        const SizedBox(width: 8),
                        _chip('Present', 'present', present, const Color(0xFF16A34A)),
                        const SizedBox(width: 8),
                        _chip('Late', 'late', late, const Color(0xFFD97706)),
                      ]),
                    ),
                  ),
                  // ── list ──────────────────────────────────────────────
                  Expanded(
                    child: _filtered.isEmpty
                        ? const Center(child: Text('No records', style: TextStyle(color: Color(0xFF6B7280))))
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                            itemCount: _filtered.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 8),
                            itemBuilder: (_, i) => _row(_filtered[i]),
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

  Widget _chip(String label, String value, int count, Color color) {
    final sel = _filter == value;
    return GestureDetector(
      onTap: () => setState(() => _filter = sel ? '' : value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: sel ? color.withValues(alpha: 0.1) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: sel ? color : const Color(0xFFE5E7EB)),
        ),
        child: Text('$label ($count)', style: TextStyle(fontSize: 12, color: color, fontWeight: sel ? FontWeight.w700 : FontWeight.normal)),
      ),
    );
  }

  Widget _row(Attendance r) {
    final statusColor = r.status == 'present' ? const Color(0xFF16A34A)
        : r.status == 'late' ? const Color(0xFFD97706)
        : const Color(0xFF6B7280);
    final checkIn = AppTheme.fmtTime(r.checkIn);
    final checkOut = r.checkOut != null ? AppTheme.fmtTime(r.checkOut!) : '--:--';
    final hasCheckedOut = r.checkOut != null;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFE5E7EB))),
      child: Row(children: [
        Container(width: 3, height: 36, decoration: BoxDecoration(color: statusColor, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(r.employeeName.isNotEmpty ? r.employeeName : r.employeeId, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF111827))),
          const SizedBox(height: 2),
          Text('In: $checkIn  Out: $checkOut  ·  ${r.totalHours.toStringAsFixed(1)}h',
              style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280))),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
            child: Text(r.status, style: TextStyle(fontSize: 11, color: statusColor, fontWeight: FontWeight.w600)),
          ),
          if (!hasCheckedOut) ...[ const SizedBox(height: 4),
            GestureDetector(
              onTap: () => _checkOut(r.employeeId),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(8), border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3))),
                child: const Text('Check Out', style: TextStyle(fontSize: 10, color: AppTheme.primary, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ]),
      ]),
    );
  }
}

// ── Mark Attendance Dialog ────────────────────────────────────────────────────

class _MarkAttendanceDialog extends StatefulWidget {
  final List<Employee> employees;
  final AttendanceService svc;
  final VoidCallback onDone;
  const _MarkAttendanceDialog({required this.employees, required this.svc, required this.onDone});
  @override
  State<_MarkAttendanceDialog> createState() => _MarkAttendanceDialogState();
}

class _MarkAttendanceDialogState extends State<_MarkAttendanceDialog> {
  String? _empId;
  String _status = 'present';
  TimeOfDay _checkIn = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay _checkOut = const TimeOfDay(hour: 17, minute: 0);
  DateTime _date = DateTime.now();
  bool _loading = false;

  Future<void> _pickDate() async {
    final p = await showDatePicker(context: context, initialDate: _date, firstDate: DateTime(2020), lastDate: DateTime.now(),
        builder: (c, child) => Theme(data: Theme.of(c).copyWith(colorScheme: const ColorScheme.light(primary: AppTheme.primary)), child: child!));
    if (p != null) setState(() => _date = p);
  }

  Future<void> _pickTime(bool isIn) async {
    final p = await showTimePicker(context: context, initialTime: isIn ? _checkIn : _checkOut);
    if (p != null) setState(() => isIn ? _checkIn = p : _checkOut = p);
  }

  String _fmt(TimeOfDay t) => '${t.hour.toString().padLeft(2,'0')}:${t.minute.toString().padLeft(2,'0')}';

  Future<void> _submit() async {
    if (_empId == null) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select an employee'))); return; }
    setState(() => _loading = true);
    try {
      final dateStr = _date.toIso8601String().split('T')[0];
      await widget.svc.markAttendance({
        'employee': _empId,
        'date': dateStr,
        'status': _status,
        'checkIn': '${dateStr}T${_fmt(_checkIn)}:00',
        'checkOut': '${dateStr}T${_fmt(_checkOut)}:00',
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
      title: const Text('Mark Attendance', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
      content: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
        DropdownButtonFormField<String>(
          initialValue: _empId,
          decoration: const InputDecoration(labelText: 'Employee'),
          items: widget.employees.map((e) => DropdownMenuItem(value: e.id, child: Text(e.fullName, style: const TextStyle(fontSize: 13)))).toList(),
          onChanged: (v) => setState(() => _empId = v),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: _status,
          decoration: const InputDecoration(labelText: 'Status'),
          items: ['present','late','half-day','absent'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
          onChanged: (v) => setState(() => _status = v!),
        ),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: _pickDate,
          child: InputDecorator(
            decoration: const InputDecoration(labelText: 'Date', suffixIcon: Icon(Icons.calendar_today_outlined, size: 16)),
            child: Text(AppTheme.fmtDate(_date), style: const TextStyle(fontSize: 13)),
          ),
        ),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: GestureDetector(
            onTap: () => _pickTime(true),
            child: InputDecorator(
              decoration: const InputDecoration(labelText: 'Check-in', suffixIcon: Icon(Icons.access_time, size: 16)),
              child: Text(_fmt(_checkIn), style: const TextStyle(fontSize: 13)),
            ),
          )),
          const SizedBox(width: 8),
          Expanded(child: GestureDetector(
            onTap: () => _pickTime(false),
            child: InputDecorator(
              decoration: const InputDecoration(labelText: 'Check-out', suffixIcon: Icon(Icons.access_time, size: 16)),
              child: Text(_fmt(_checkOut), style: const TextStyle(fontSize: 13)),
            ),
          )),
        ]),
      ])),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
          onPressed: _loading ? null : _submit,
          child: _loading
              ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Save', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}
