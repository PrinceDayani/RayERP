import 'package:flutter/material.dart';
import '../../../config/app_theme.dart';
import '../../../services/leave_service.dart';

class LeaveCreateDialog extends StatefulWidget {
  final String employeeId;
  final VoidCallback onCreated;
  const LeaveCreateDialog({super.key, required this.employeeId, required this.onCreated});

  static Future<void> show(BuildContext context, {required String employeeId, required VoidCallback onCreated}) =>
      showDialog(context: context, builder: (_) => LeaveCreateDialog(employeeId: employeeId, onCreated: onCreated));

  @override
  State<LeaveCreateDialog> createState() => _LeaveCreateDialogState();
}

class _LeaveCreateDialogState extends State<LeaveCreateDialog> {
  final _svc = LeaveService();
  final _types = ['sick', 'vacation', 'personal', 'maternity', 'paternity', 'emergency'];
  late String _leaveType;
  DateTime? _startDate, _endDate;
  final _reasonCtrl = TextEditingController();
  bool _loading = false;

  @override
  void initState() { super.initState(); _leaveType = _types[0]; }

  @override
  void dispose() { _reasonCtrl.dispose(); super.dispose(); }

  Future<void> _pick(bool isStart) async {
    final p = await showDatePicker(
      context: context, initialDate: DateTime.now(),
      firstDate: DateTime(2020), lastDate: DateTime(2030),
      builder: (c, child) => Theme(
        data: Theme.of(c).copyWith(colorScheme: const ColorScheme.light(primary: AppTheme.primary)),
        child: child!,
      ),
    );
    if (p != null) setState(() => isStart ? _startDate = p : _endDate = p);
  }

  Future<void> _submit() async {
    if (_startDate == null || _endDate == null || _reasonCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all fields')));
      return;
    }
    if (_endDate!.isBefore(_startDate!)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('End date must be after start date')));
      return;
    }
    setState(() => _loading = true);
    try {
      await _svc.create({
        'employee': widget.employeeId,
        'leaveType': _leaveType,
        'startDate': _startDate!.toIso8601String().split('T')[0],
        'endDate': _endDate!.toIso8601String().split('T')[0],
        'totalDays': _endDate!.difference(_startDate!).inDays + 1,
        'reason': _reasonCtrl.text.trim(),
      });
      if (mounted) Navigator.pop(context);
      widget.onCreated();
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
      content: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          DropdownButtonFormField<String>(
            initialValue: _leaveType,
            decoration: const InputDecoration(labelText: 'Leave Type'),
            items: _types.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
            onChanged: (v) => setState(() => _leaveType = v!),
          ),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: GestureDetector(
              onTap: () => _pick(true),
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'Start Date', suffixIcon: Icon(Icons.calendar_today_outlined, size: 16)),
                child: Text(_startDate != null ? AppTheme.fmtDate(_startDate!) : 'Select',
                    style: TextStyle(color: _startDate != null ? Colors.black87 : AppTheme.textMuted, fontSize: 13)),
              ),
            )),
            const SizedBox(width: 8),
            Expanded(child: GestureDetector(
              onTap: () => _pick(false),
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'End Date', suffixIcon: Icon(Icons.calendar_today_outlined, size: 16)),
                child: Text(_endDate != null ? AppTheme.fmtDate(_endDate!) : 'Select',
                    style: TextStyle(color: _endDate != null ? Colors.black87 : AppTheme.textMuted, fontSize: 13)),
              ),
            )),
          ]),
          const SizedBox(height: 12),
          TextField(controller: _reasonCtrl, maxLines: 2, decoration: const InputDecoration(labelText: 'Reason')),
        ]),
      ),
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
