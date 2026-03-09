import 'package:flutter/material.dart';
import '../../../config/app_theme.dart';
import '../../../models/employee_stats.dart';
import '../../../services/employee_stats_service.dart';

class AchievementsTab extends StatefulWidget {
  final String employeeId;
  const AchievementsTab({super.key, required this.employeeId});
  @override
  State<AchievementsTab> createState() => _AchievementsTabState();
}

class _AchievementsTabState extends State<AchievementsTab> {
  final _svc = EmployeeStatsService();
  List<Achievement>? _items;
  String? _error;

  @override
  void initState() {
    super.initState();
    _svc.getAchievements(widget.employeeId).then((v) {
      if (mounted) setState(() => _items = v);
    }).catchError((e) {
      if (mounted) setState(() => _error = e.toString());
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) return Center(child: Text(_error!, style: const TextStyle(color: AppTheme.red)));
    if (_items == null) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_items!.isEmpty) {
      return const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.emoji_events_outlined, size: 48, color: AppTheme.textMuted),
        SizedBox(height: 8),
        Text('No achievements yet', style: TextStyle(color: AppTheme.textSecondary)),
      ]));
    }

    // Group by category
    final grouped = <String, List<Achievement>>{};
    for (final a in _items!) {
      (grouped[a.category] ??= []).add(a);
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        // Summary row
        Row(children: [
          _statPill('Total', '${_items!.length}', AppTheme.primary),
          const SizedBox(width: 8),
          _statPill('Certs', '${_items!.where((a) => a.category == 'certification').length}', AppTheme.blue),
          const SizedBox(width: 8),
          _statPill('Awards', '${_items!.where((a) => a.category == 'award').length}', AppTheme.amber),
        ]),
        const SizedBox(height: 16),
        for (final entry in grouped.entries) ...[
          _categoryHeader(entry.key),
          const SizedBox(height: 8),
          ...entry.value.map(_card),
          const SizedBox(height: 12),
        ],
      ],
    );
  }

  Widget _statPill(String label, String value, Color color) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: color.withOpacity(0.07),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: color.withOpacity(0.2)),
          ),
          child: Column(children: [
            Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
            Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
          ]),
        ),
      );

  Widget _categoryHeader(String category) {
    final cfg = _catConfig(category);
    return Row(children: [
      Icon(cfg.$2, size: 14, color: cfg.$1),
      const SizedBox(width: 6),
      Text(cfg.$3, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: cfg.$1, letterSpacing: 0.5)),
    ]);
  }

  Widget _card(Achievement a) {
    final cfg = _catConfig(a.category);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 36, height: 36,
          decoration: BoxDecoration(color: cfg.$1.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
          child: Icon(cfg.$2, size: 18, color: cfg.$1),
        ),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(a.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
          if (a.description.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(a.description, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
          ],
          const SizedBox(height: 4),
          Row(children: [
            Text(AppTheme.fmtDate(a.date), style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
            if (a.issuer != null) ...[
              const Text(' · ', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
              Text(a.issuer!, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
            ],
            if (a.isExpired) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(color: AppTheme.red.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                child: const Text('Expired', style: TextStyle(fontSize: 9, color: AppTheme.red, fontWeight: FontWeight.w600)),
              ),
            ],
          ]),
          if (a.credentialId != null) ...[
            const SizedBox(height: 2),
            Text('ID: ${a.credentialId}', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted, fontFamily: 'monospace')),
          ],
        ])),
      ]),
    );
  }

  (Color, IconData, String) _catConfig(String cat) => switch (cat) {
        'award' => (AppTheme.amber, Icons.emoji_events_outlined, 'AWARDS'),
        'certification' => (AppTheme.blue, Icons.school_outlined, 'CERTIFICATIONS'),
        'training' => (const Color(0xFF16A34A), Icons.menu_book_outlined, 'TRAINING'),
        'recognition' => (AppTheme.primary, Icons.thumb_up_outlined, 'RECOGNITION'),
        _ => (AppTheme.purple, Icons.star_outline, 'MILESTONES'),
      };
}
