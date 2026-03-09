import 'package:flutter/material.dart';
import '../../../config/app_theme.dart';
import '../../../models/employee.dart';
import '../../../models/employee_stats.dart';
import '../../../services/employee_stats_service.dart';

class SkillsTab extends StatefulWidget {
  final Employee employee;
  const SkillsTab({super.key, required this.employee});
  @override
  State<SkillsTab> createState() => _SkillsTabState();
}

class _SkillsTabState extends State<SkillsTab> {
  final _svc = EmployeeStatsService();
  LeaveBalance? _balance;

  @override
  void initState() {
    super.initState();
    _svc.getLeaveBalance(widget.employee.id).then((b) {
      if (mounted) setState(() => _balance = b);
    }).catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(children: [
        _section('Skills', _buildSkills()),
        const SizedBox(height: 12),
        _section('Leave Balance', _buildLeaveBalance()),
      ]),
    );
  }

  Widget _buildSkills() {
    final skills = widget.employee.skills;
    if (skills.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Text('No skills listed', style: TextStyle(color: AppTheme.textSecondary)),
      );
    }
    // Show skills as chips with a subtle level indicator based on position in list
    // (first skills assumed more prominent — no level data in Employee model)
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Summary
        Row(children: [
          _miniStat('${skills.length}', 'Skills', AppTheme.primary),
          const SizedBox(width: 8),
          _miniStat('${(skills.length / 5).ceil()}', 'Categories est.', AppTheme.blue),
        ]),
        const SizedBox(height: 12),
        // Skill chips
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: skills.asMap().entries.map((entry) {
            final i = entry.key;
            final s = entry.value;
            // Top 3 skills get a highlighted style
            final isTop = i < 3;
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: isTop ? AppTheme.primary.withOpacity(0.12) : AppTheme.primary.withOpacity(0.05),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isTop ? AppTheme.primary.withOpacity(0.4) : AppTheme.primary.withOpacity(0.15)),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                if (isTop) ...[
                  const Icon(Icons.star, size: 10, color: AppTheme.amber),
                  const SizedBox(width: 4),
                ],
                Text(s, style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.primary,
                  fontWeight: isTop ? FontWeight.w600 : FontWeight.w500,
                )),
              ]),
            );
          }).toList(),
        ),
      ]),
    );
  }

  Widget _miniStat(String value, String label, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color.withOpacity(0.07),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: color)),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
        ]),
      );

  Widget _buildLeaveBalance() {
    if (_balance == null) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Center(child: SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary))),
      );
    }
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(children: [
        _leaveRow('Sick Leave', _balance!.sickUsed, _balance!.sickTotal, AppTheme.red),
        const SizedBox(height: 10),
        _leaveRow('Vacation', _balance!.vacationUsed, _balance!.vacationTotal, AppTheme.blue),
        const SizedBox(height: 10),
        _leaveRow('Personal', _balance!.personalUsed, _balance!.personalTotal, AppTheme.purple),
      ]),
    );
  }

  Widget _leaveRow(String label, int used, int total, Color color) {
    final remaining = total - used;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
        const Spacer(),
        Text('$remaining / $total remaining', style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
      ]),
      const SizedBox(height: 5),
      ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: LinearProgressIndicator(
          value: total == 0 ? 0 : used / total,
          backgroundColor: color.withOpacity(0.12),
          color: color,
          minHeight: 6,
        ),
      ),
    ]);
  }

  Widget _section(String title, Widget child) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Text(title.toUpperCase(),
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8)),
          ),
          const Divider(height: 1, color: AppTheme.border),
          child,
        ]),
      );
}
