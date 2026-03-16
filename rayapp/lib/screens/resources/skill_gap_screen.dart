import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/resource_service.dart';
import '../employees/employee_detail_screen.dart';

class SkillGapScreen extends StatefulWidget {
  const SkillGapScreen({super.key});

  @override
  State<SkillGapScreen> createState() => _SkillGapScreenState();
}

class _SkillGapScreenState extends State<SkillGapScreen> {
  final _svc = ResourceService();
  List<SkillGapResult> _results = [];
  bool _loading = true;
  String? _error;
  String _filter = 'all'; // all | has_gaps | strong

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _svc.getSkillGapAnalysis();
      if (mounted) setState(() { _results = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<SkillGapResult> get _filtered {
    return switch (_filter) {
      'has_gaps' => _results.where((r) => r.missingSkills.isNotEmpty || r.weakSkills.isNotEmpty).toList(),
      'strong' => _results.where((r) => r.strongSkills.isNotEmpty && r.missingSkills.isEmpty).toList(),
      _ => _results,
    };
  }

  int get _withGaps => _results.where((r) => r.missingSkills.isNotEmpty || r.weakSkills.isNotEmpty).length;
  int get _strong => _results.where((r) => r.strongSkills.isNotEmpty && r.missingSkills.isEmpty).length;

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_error != null) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.error_outline, color: AppTheme.red, size: 40),
      const SizedBox(height: 8),
      Text(_error!, style: const TextStyle(color: AppTheme.red), textAlign: TextAlign.center),
      const SizedBox(height: 12),
      TextButton(onPressed: _load, child: const Text('Retry')),
    ]));
    }

    final filtered = _filtered;
    return Column(children: [
      // Summary chips
      Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
        color: Theme.of(context).cardColor,
        child: Row(children: [
          _chip('All', '${_results.length}', AppTheme.blue, 'all'),
          const SizedBox(width: 8),
          _chip('Has Gaps', '$_withGaps', AppTheme.red, 'has_gaps'),
          const SizedBox(width: 8),
          _chip('Strong', '$_strong', AppTheme.green, 'strong'),
        ]),
      ),
      Expanded(
        child: filtered.isEmpty
            ? const Center(child: Text('No results for this filter', style: TextStyle(color: AppTheme.textSecondary)))
            : RefreshIndicator(
                onRefresh: _load,
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  itemCount: filtered.length,
                  itemBuilder: (_, i) => _card(filtered[i]),
                ),
              ),
      ),
    ]);
  }

  Widget _chip(String label, String count, Color color, String value) {
    final active = _filter == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _filter = value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: active ? color : color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: active ? color : color.withOpacity(0.2)),
          ),
          child: Column(children: [
            Text(count, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: active ? Colors.white : color)),
            Text(label, style: TextStyle(fontSize: 10, color: active ? Colors.white.withOpacity(0.85) : AppTheme.textSecondary)),
          ]),
        ),
      ),
    );
  }

  Widget _card(SkillGapResult r) {
    final hasGaps = r.missingSkills.isNotEmpty || r.weakSkills.isNotEmpty;
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: GestureDetector(
              onTap: () => Navigator.push(context, MaterialPageRoute(
                  builder: (_) => EmployeeDetailScreen(id: r.employeeId))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(r.employeeName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.primary, decoration: TextDecoration.underline)),
                Text('${r.position}${r.department != null ? ' · ${r.department}' : ''}',
                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
              ]),
            )),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: hasGaps ? AppTheme.redBg : AppTheme.greenBg,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(hasGaps ? 'Has Gaps' : 'Strong',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: hasGaps ? AppTheme.red : AppTheme.green)),
            ),
          ]),
          if (r.missingSkills.isNotEmpty) ...[
            const SizedBox(height: 10),
            _skillSection('Missing Skills', r.missingSkills.map((s) => {'skill': s}).toList(), AppTheme.red, Icons.remove_circle_outline),
          ],
          if (r.weakSkills.isNotEmpty) ...[
            const SizedBox(height: 8),
            _skillSection('Needs Improvement', r.weakSkills, AppTheme.amber, Icons.trending_up),
          ],
          if (r.strongSkills.isNotEmpty) ...[
            const SizedBox(height: 8),
            _skillSection('Strong Skills', r.strongSkills, AppTheme.green, Icons.check_circle_outline),
          ],
        ]),
      ),
    );
  }

  Widget _skillSection(String title, List<Map<String, dynamic>> skills, Color color, IconData icon) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Icon(icon, size: 13, color: color),
        const SizedBox(width: 4),
        Text(title, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
      ]),
      const SizedBox(height: 4),
      Wrap(spacing: 6, runSpacing: 4, children: skills.map((s) {
        final name = s['skill'] ?? '';
        final current = s['currentLevel'];
        final required = s['requiredLevel'];
        final level = s['level'];
        final label = current != null ? '$name ($current→$required)' : (level != null ? '$name ($level)' : name);
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withOpacity(0.25)),
          ),
          child: Text(label, style: TextStyle(fontSize: 11, color: color)),
        );
      }).toList()),
    ]);
  }
}
