import 'package:flutter/material.dart';
import '../../../config/app_theme.dart';
import '../../../models/attendance.dart';
import '../../../services/attendance_service.dart';

class OrgAttendanceScreen extends StatefulWidget {
  const OrgAttendanceScreen({super.key});
  @override
  State<OrgAttendanceScreen> createState() => _OrgAttendanceScreenState();
}

class _OrgAttendanceScreenState extends State<OrgAttendanceScreen> {
  final _svc = AttendanceService();
  List<Attendance> _records = [];
  bool _loading = true;
  String? _error;
  String _filter = '';

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _svc.getToday();
      if (mounted) setState(() { _records = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<Attendance> get _filtered => _filter.isEmpty
      ? _records
      : _records.where((r) => r.status == _filter).toList();

  @override
  Widget build(BuildContext context) {
    final present = _records.where((r) => r.status == 'present').length;
    final late = _records.where((r) => r.status == 'late').length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text("Today's Attendance"),
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _load)],
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
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                    child: Row(children: [
                      _statChip('All', _records.length, '', const Color(0xFF374151)),
                      const SizedBox(width: 8),
                      _statChip('Present', present, 'present', const Color(0xFF16A34A)),
                      const SizedBox(width: 8),
                      _statChip('Late', late, 'late', const Color(0xFFD97706)),
                    ]),
                  ),
                  Expanded(
                    child: _filtered.isEmpty
                        ? const Center(child: Text('No records', style: TextStyle(color: Color(0xFF6B7280))))
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                            itemCount: _filtered.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 8),
                            itemBuilder: (_, i) => _row(_filtered[i]),
                          ),
                  ),
                ]),
    );
  }

  Widget _statChip(String label, int count, String value, Color color) {
    final sel = _filter == value;
    return GestureDetector(
      onTap: () => setState(() => _filter = sel ? '' : value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: sel ? color.withOpacity(0.1) : Colors.white,
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
    final checkIn = '${r.checkIn.hour.toString().padLeft(2, '0')}:${r.checkIn.minute.toString().padLeft(2, '0')}';
    final checkOut = r.checkOut != null
        ? '${r.checkOut!.hour.toString().padLeft(2, '0')}:${r.checkOut!.minute.toString().padLeft(2, '0')}'
        : '--:--';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFE5E7EB))),
      child: Row(children: [
        Container(width: 3, height: 36, decoration: BoxDecoration(color: statusColor, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(r.employeeId, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF111827))),
          const SizedBox(height: 2),
          Text('In: $checkIn  Out: $checkOut  ·  ${r.totalHours.toStringAsFixed(1)}h', style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280))),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
          child: Text(r.status, style: TextStyle(fontSize: 11, color: statusColor, fontWeight: FontWeight.w600)),
        ),
      ]),
    );
  }
}
