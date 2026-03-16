import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/employee.dart';
import '../../services/resource_service.dart';

class SkillMatrixScreen extends StatefulWidget {
  const SkillMatrixScreen({super.key});

  @override
  State<SkillMatrixScreen> createState() => _SkillMatrixScreenState();
}

class _SkillMatrixScreenState extends State<SkillMatrixScreen> {
  final _svc = ResourceService();
  List<Employee> _employees = [];
  bool _loading = true;
  String? _error;

  final _searchCtrl = TextEditingController();
  String _deptFilter = 'All';
  String _levelFilter = 'All';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final data = await _svc.getAllEmployees();
      if (mounted) setState(() { _employees = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<Employee> get _filtered {
    final q = _searchCtrl.text.toLowerCase();
    return _employees.where((e) {
      if (_deptFilter != 'All' && (e.department ?? '') != _deptFilter) return false;
      if (q.isNotEmpty) {
        final nameMatch = e.fullName.toLowerCase().contains(q);
        final skillMatch = e.skillsEnhanced.any((s) => s.skill.toLowerCase().contains(q))
            || e.skills.any((s) => s.toLowerCase().contains(q));
        if (!nameMatch && !skillMatch) return false;
      }
      if (_levelFilter != 'All') {
        if (!e.skillsEnhanced.any((s) => s.level == _levelFilter)) return false;
      }
      return true;
    }).toList();
  }

  /// All unique skills across all employees
  List<String> get _allSkills {
    final set = <String>{};
    for (final e in _employees) {
      for (final s in e.skillsEnhanced) {
        set.add(s.skill);
      }
      for (final s in e.skills) {
        set.add(s);
      }
    }
    final list = set.toList()..sort();
    if (_searchCtrl.text.isNotEmpty) {
      final q = _searchCtrl.text.toLowerCase();
      return list.where((s) => s.toLowerCase().contains(q)).toList();
    }
    return list;
  }

  List<String> get _departments {
    final set = {'All'};
    for (final e in _employees) {
      if (e.department != null && e.department!.isNotEmpty) set.add(e.department!);
    }
    return set.toList();
  }

  SkillEnhanced? _getSkill(Employee emp, String skillName) {
    try {
      return emp.skillsEnhanced.firstWhere(
          (s) => s.skill.toLowerCase() == skillName.toLowerCase());
    } catch (_) {
      if (emp.skills.any((s) => s.toLowerCase() == skillName.toLowerCase())) {
        return SkillEnhanced(skill: skillName, level: 'Intermediate');
      }
      return null;
    }
  }

  // ── Team-level gap analysis ──────────────────────────────────────────────

  Map<String, int> get _teamSkillCounts {
    final map = <String, int>{};
    for (final e in _employees) {
      for (final s in e.skillsEnhanced) {
        map[s.skill] = (map[s.skill] ?? 0) + 1;
      }
      for (final s in e.skills) {
        if (!e.skillsEnhanced.any((se) => se.skill.toLowerCase() == s.toLowerCase())) {
          map[s] = (map[s] ?? 0) + 1;
        }
      }
    }
    return map;
  }

  List<MapEntry<String, int>> get _top5MissingTeam {
    final counts = _teamSkillCounts;
    final total = _employees.length;
    if (total == 0) return [];
    // "missing" = skill held by <30% of team
    final missing = counts.entries.where((e) => e.value / total < 0.3).toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    return missing.take(5).toList();
  }

  double _avgByCategory(String category) {
    if (_employees.isEmpty) return 0;
    int count = 0;
    for (final e in _employees) {
      if (category == 'strong') {
        count += e.skillsEnhanced.where((s) => s.level == 'Expert' || s.level == 'Advanced').length;
      } else if (category == 'weak') {
        count += e.skillsEnhanced.where((s) => s.level == 'Beginner' || s.level == 'Intermediate').length;
      } else {
        // missing: skills not in this employee but in team
        final mySkills = e.skillsEnhanced.map((s) => s.skill.toLowerCase()).toSet();
        count += _teamSkillCounts.keys.where((k) => !mySkills.contains(k.toLowerCase())).length;
      }
    }
    return count / _employees.length;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_error != null) return Center(child: Text(_error!, style: const TextStyle(color: AppTheme.red)));

    return Column(children: [
      _buildFilters(),
      _buildTeamSummary(),
      Expanded(child: _buildMatrix()),
    ]);
  }

  Widget _buildFilters() {
    return Container(
      color: Theme.of(context).cardColor,
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
      child: Column(children: [
        TextField(
          controller: _searchCtrl,
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            hintText: 'Search name, dept, or skill…',
            prefixIcon: const Icon(Icons.search, size: 18),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(vertical: 8),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          ),
          style: const TextStyle(fontSize: 13),
        ),
        const SizedBox(height: 8),
        Row(children: [
          Expanded(child: _filterDropdown('Dept', _departments, _deptFilter, (v) => setState(() => _deptFilter = v!))),
          const SizedBox(width: 8),
          Expanded(child: _filterDropdown('Level', ['All', ...SkillEnhanced.levels], _levelFilter, (v) => setState(() => _levelFilter = v!))),
        ]),
      ]),
    );
  }

  Widget _filterDropdown(String label, List<String> items, String value, ValueChanged<String?> onChanged) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      isDense: true,
      decoration: InputDecoration(
        labelText: label,
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      ),
      style: const TextStyle(fontSize: 12, color: Colors.black87),
      items: items.map((i) => DropdownMenuItem(value: i, child: Text(i, style: const TextStyle(fontSize: 12)))).toList(),
      onChanged: onChanged,
    );
  }

  Widget _buildTeamSummary() {
    final top5 = _top5MissingTeam;
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppTheme.primary.withOpacity(0.04),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.primary.withOpacity(0.12)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('TEAM SKILL SUMMARY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.6)),
        const SizedBox(height: 8),
        Row(children: [
          _summaryTile('Avg Strong', _avgByCategory('strong').toStringAsFixed(1), AppTheme.green),
          const SizedBox(width: 8),
          _summaryTile('Avg Weak', _avgByCategory('weak').toStringAsFixed(1), AppTheme.amber),
          const SizedBox(width: 8),
          _summaryTile('Avg Missing', _avgByCategory('missing').toStringAsFixed(1), AppTheme.red),
        ]),
        if (top5.isNotEmpty) ...[ 
          const SizedBox(height: 8),
          const Text('Top-5 Missing Team Skills', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
          const SizedBox(height: 4),
          Wrap(spacing: 6, runSpacing: 4, children: top5.map((e) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: AppTheme.red.withOpacity(0.08), borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.red.withOpacity(0.25))),
            child: Text('${e.key} (${e.value})', style: const TextStyle(fontSize: 11, color: AppTheme.red)),
          )).toList()),
        ],
      ]),
    );
  }

  Widget _summaryTile(String label, String value, Color color) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 6),
      decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
      child: Column(children: [
        Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: color)),
        Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary)),
      ]),
    ),
  );

  Widget _buildMatrix() {
    final employees = _filtered;
    final skills = _allSkills;

    if (employees.isEmpty) {
      return const Center(child: Text('No employees match filters', style: TextStyle(color: AppTheme.textSecondary)));
    }
    if (skills.isEmpty) {
      return const Center(child: Text('No skills found', style: TextStyle(color: AppTheme.textSecondary)));
    }

    const double colW = 90;
    const double rowH = 44;
    const double headerH = 80;
    const double nameColW = 130;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(12),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Header row: skill names
          Row(children: [
            SizedBox(width: nameColW, child: const Text('Employee', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textSecondary))),
            ...skills.map((s) => SizedBox(
              width: colW,
              height: headerH,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Align(
                  alignment: Alignment.bottomCenter,
                  child: Transform.rotate(
                    angle: -0.6,
                    child: Text(s, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
                  ),
                ),
              ),
            )),
          ]),
          const Divider(height: 1),
          // Employee rows
          ...employees.map((emp) => SizedBox(
            height: rowH,
            child: Row(children: [
              SizedBox(
                width: nameColW,
                child: Text(emp.fullName, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
              ),
              ...skills.map((s) {
                final skill = _getSkill(emp, s);
                return SizedBox(
                  width: colW,
                  height: rowH,
                  child: Center(child: GestureDetector(
                    onTap: () => _showSkillEditor(emp, s),
                    child: skill == null
                        ? Container(width: 8, height: 8, decoration: BoxDecoration(color: Colors.grey.withOpacity(0.15), shape: BoxShape.circle))
                        : _levelBadge(skill.level),
                  )),
                );
              }),
            ]),
          )),
        ]),
      ),
    );
  }

  Widget _levelBadge(String level) {
    final color = switch (level) {
      'Expert' => AppTheme.green,
      'Advanced' => AppTheme.blue,
      'Intermediate' => AppTheme.amber,
      _ => AppTheme.textSecondary,
    };
    final abbr = level[0]; // B / I / A / E
    return Container(
      width: 26,
      height: 26,
      decoration: BoxDecoration(color: color.withOpacity(0.15), shape: BoxShape.circle,
          border: Border.all(color: color.withOpacity(0.4))),
      child: Center(child: Text(abbr, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: color))),
    );
  }

  void _showSkillEditor(Employee emp, String skillName) {
    final current = _getSkill(emp, skillName);
    String? selectedLevel = current?.level;
    int? years = current?.yearsOfExperience;
    final yearsCtrl = TextEditingController(text: years?.toString() ?? '');
    bool saving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => StatefulBuilder(builder: (ctx, setModal) {
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 14),
              Text('Edit Skill: $skillName', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
              Text(emp.fullName, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
              const SizedBox(height: 16),
              DropdownButtonFormField<String?>(
                initialValue: selectedLevel,
                decoration: const InputDecoration(labelText: 'Proficiency Level'),
                items: [
                  const DropdownMenuItem(value: null, child: Text('Remove skill', style: TextStyle(color: AppTheme.red))),
                  ...SkillEnhanced.levels.map((l) => DropdownMenuItem(value: l, child: Text(l))),
                ],
                onChanged: (v) => setModal(() => selectedLevel = v),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: yearsCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Years of Experience (optional)'),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: saving ? null : () async {
                    setModal(() => saving = true);
                    try {
                      await _svc.updateSkill(
                        emp.id,
                        skillName,
                        selectedLevel,
                        yearsOfExperience: int.tryParse(yearsCtrl.text),
                      );
                      if (ctx.mounted) Navigator.pop(ctx);
                      _load(); // Refresh matrix
                    } catch (e) {
                      setModal(() => saving = false);
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.red),
                        );
                      }
                    }
                  },
                  child: saving
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(selectedLevel == null ? 'Remove Skill' : 'Save'),
                ),
              ),
            ]),
          ),
        );
      }),
    );
  }
}
