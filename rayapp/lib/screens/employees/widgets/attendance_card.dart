import 'package:flutter/material.dart';
import '../../../config/app_theme.dart';
import '../../../models/attendance.dart';

class AttendanceCard extends StatelessWidget {
  final Attendance record;
  const AttendanceCard({super.key, required this.record});

  @override
  Widget build(BuildContext context) {
    final a = record;
    final color = AppTheme.statusColor(a.status);
    final ci = AppTheme.fmtTime(a.checkIn.toLocal());
    final co = a.checkOut != null ? AppTheme.fmtTime(a.checkOut!.toLocal()) : '--:--';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(children: [
        Container(
          width: 3, height: 64,
          decoration: BoxDecoration(
            color: color,
            borderRadius: const BorderRadius.only(topLeft: Radius.circular(12), bottomLeft: Radius.circular(12)),
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(AppTheme.fmtDate(a.date.toLocal()),
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.textPrimary)),
                const SizedBox(height: 5),
                Row(children: [
                  _chip(Icons.login_outlined, ci, color),
                  const SizedBox(width: 6),
                  _chip(Icons.logout_outlined, co, AppTheme.textSecondary),
                  const SizedBox(width: 6),
                  _chip(Icons.timer_outlined, '${a.totalHours.toStringAsFixed(1)}h', AppTheme.blue),
                ]),
              ])),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: AppTheme.statusBg(a.status), borderRadius: BorderRadius.circular(20)),
                child: Text(a.status, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
              ),
            ]),
          ),
        ),
      ]),
    );
  }

  Widget _chip(IconData icon, String label, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
        decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(6)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 10, color: color),
          const SizedBox(width: 3),
          Text(label, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w500)),
        ]),
      );
}
