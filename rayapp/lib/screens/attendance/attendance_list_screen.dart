import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/attendance.dart';
import '../../services/attendance_service.dart';
import 'attendance_detail_screen.dart';

class AttendanceListScreen extends StatefulWidget {
  const AttendanceListScreen({super.key});

  @override
  State<AttendanceListScreen> createState() => _AttendanceListScreenState();
}

class _AttendanceListScreenState extends State<AttendanceListScreen> {
  late Future<List<Attendance>> _future;

  @override
  void initState() {
    super.initState();
    _future = AttendanceService().getAll();
  }

  Color _statusColor(String s) => switch (s) {
        'present' => const Color(0xFF16A34A),
        'late' => const Color(0xFFD97706),
        'half-day' => const Color(0xFF2563EB),
        _ => const Color(0xFFDC2626),
      };

  Color _statusBg(String s) => switch (s) {
        'present' => const Color(0xFFF0FDF4),
        'late' => const Color(0xFFFFFBEB),
        'half-day' => const Color(0xFFEFF6FF),
        _ => const Color(0xFFFEF2F2),
      };

  String _formatTime(DateTime dt) =>
      '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: FutureBuilder<List<Attendance>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
          }
          if (snap.hasError) return Center(child: Text('Error: ${snap.error}'));
          final records = snap.data ?? [];
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: records.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final a = records[i];
              return Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AttendanceDetailScreen(id: a.id))),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: _statusBg(a.status),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(Icons.access_time_outlined, color: _statusColor(a.status), size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(a.date.toLocal().toString().split(' ')[0],
                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Color(0xFF1A1A1A))),
                              const SizedBox(height: 2),
                              Text('Check in: ${_formatTime(a.checkIn)}  •  ${a.totalHours.toStringAsFixed(1)}h',
                                  style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _statusBg(a.status),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(a.status, style: TextStyle(color: _statusColor(a.status), fontSize: 11, fontWeight: FontWeight.w500)),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
