import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/attendance.dart';
import '../../services/attendance_service.dart';

class AttendanceDetailScreen extends StatelessWidget {
  final String id;
  const AttendanceDetailScreen({super.key, required this.id});

  String _fmt(DateTime dt) =>
      '${dt.toLocal().toString().split(' ')[0]}  ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(title: const Text('Attendance Detail')),
      body: FutureBuilder<Attendance>(
        future: AttendanceService().getById(id),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
          }
          if (snap.hasError) return Center(child: Text('Error: ${snap.error}'));
          final a = snap.data!;
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Column(
                children: [
                  _tile('Date', a.date.toLocal().toString().split(' ')[0], Icons.calendar_today_outlined),
                  _divider(),
                  _tile('Check In', _fmt(a.checkIn), Icons.login_outlined),
                  _divider(),
                  _tile('Check Out', a.checkOut != null ? _fmt(a.checkOut!) : '-', Icons.logout_outlined),
                  _divider(),
                  _tile('Total Hours', '${a.totalHours.toStringAsFixed(2)} hrs', Icons.timer_outlined),
                  _divider(),
                  _tile('Break Time', '${a.breakTime.toStringAsFixed(0)} min', Icons.free_breakfast_outlined),
                  _divider(),
                  _tile('Status', a.status, Icons.info_outline),
                  _divider(),
                  _tile('Approval', a.approvalStatus, Icons.verified_outlined),
                  _divider(),
                  _tile('Source', a.entrySource, Icons.source_outlined),
                  if (a.notes != null) ...[
                    _divider(),
                    _tile('Notes', a.notes!, Icons.notes_outlined),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _tile(String label, String value, IconData icon) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 18, color: AppTheme.primary),
            const SizedBox(width: 12),
            SizedBox(width: 100, child: Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)))),
            Expanded(child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF1A1A1A)))),
          ],
        ),
      );

  Widget _divider() => const Divider(height: 1, indent: 16, endIndent: 16, color: Color(0xFFE5E7EB));
}
