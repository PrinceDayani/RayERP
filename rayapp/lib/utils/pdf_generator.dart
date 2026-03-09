import 'package:share_plus/share_plus.dart';
import '../../models/employee.dart';
import '../../config/app_theme.dart';

class ProfileSharer {
  static Future<void> shareEmployee(Employee e) async {
    final buf = StringBuffer();
    buf.writeln('👤 ${e.fullName}');
    buf.writeln('━━━━━━━━━━━━━━━━━━━━');
    buf.writeln('Position : ${e.position}');
    if ((e.jobTitle ?? '').isNotEmpty) buf.writeln('Job Title : ${e.jobTitle}');
    if ((e.department ?? '').isNotEmpty) buf.writeln('Department: ${e.department}');
    buf.writeln('ID        : ${e.employeeId}');
    buf.writeln('Status    : ${e.status.toUpperCase()}');
    if (e.hireDate != null) buf.writeln('Hire Date : ${AppTheme.fmtDate(e.hireDate!)}');
    if (e.salary != null) buf.writeln('Salary    : ₹${e.salary!.toStringAsFixed(0)} p.a.');

    buf.writeln();
    buf.writeln('📞 Contact');
    buf.writeln('Email : ${e.email}');
    buf.writeln('Phone : ${e.phone}');

    if (e.address != null && !e.address!.isEmpty) {
      buf.writeln();
      buf.writeln('📍 Address');
      buf.writeln(e.address!.display);
    }

    if (e.emergencyContact != null && !e.emergencyContact!.isEmpty) {
      buf.writeln();
      buf.writeln('🚨 Emergency Contact');
      if ((e.emergencyContact!.name ?? '').isNotEmpty) buf.writeln('Name     : ${e.emergencyContact!.name}');
      if ((e.emergencyContact!.relationship ?? '').isNotEmpty) buf.writeln('Relation : ${e.emergencyContact!.relationship}');
      if ((e.emergencyContact!.phone ?? '').isNotEmpty) buf.writeln('Phone    : ${e.emergencyContact!.phone}');
    }

    if (e.skills.isNotEmpty) {
      buf.writeln();
      buf.writeln('🛠 Skills');
      buf.writeln(e.skills.join(', '));
    }

    if ((e.bio ?? '').isNotEmpty) {
      buf.writeln();
      buf.writeln('📝 Bio');
      buf.writeln(e.bio);
    }

    buf.writeln();
    buf.writeln('— Shared via RayERP');

    await Share.share(buf.toString(), subject: '${e.fullName} — Employee Profile');
  }
}
