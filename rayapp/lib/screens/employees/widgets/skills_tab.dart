import 'package:flutter/material.dart';
import '../../../config/app_theme.dart';
import '../../../models/employee.dart';
import '../../../models/project.dart';
import '../../../services/employee_service.dart';
import '../../../services/project_service.dart';

class SkillsTab extends StatefulWidget {
  final Employee employee;
  const SkillsTab({super.key, required this.employee});
  @override
  State<SkillsTab> createState() => _SkillsTabState();
}

class _SkillsTabState extends State<SkillsTab> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  late List<SkillEnhanced> _skills;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 4, vsync: this);
    _skills = List.from(widget.employee.skillsEnhanced.isNotEmpty
        ? widget.employee.skillsEnhanced
        : widget.employee.skills.map((s) => SkillEnhanced(skill: s, level: 'Intermediate')));
  }

  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  void _onSkillsUpdated(List<SkillEnhanced> updated) => setState(() => _skills = updated);

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      TabBar(
        controller: _tabs,
        labelColor: AppTheme.primary,
        unselectedLabelColor: AppTheme.textSecondary,
        indicatorColor: AppTheme.primary,
        labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        tabs: const [Tab(text: 'Skills'), Tab(text: 'Gap Analysis'), Tab(text: 'Project Match'), Tab(text: 'Analytics')],
      ),
      Expanded(child: TabBarView(controller: _tabs, children: [
        _SkillsListTab(employee: widget.employee, skills: _skills, onUpdated: _onSkillsUpdated),
        _GapAnalysisTab(employee: widget.employee, skills: _skills),
        _ProjectMatchTab(skills: _skills),
        _AnalyticsTab(skills: _skills),
      ])),
    ]);
  }
}

// ── 1. Skills List Tab ────────────────────────────────────────────────────────

class _SkillsListTab extends StatefulWidget {
  final Employee employee;
  final List<SkillEnhanced> skills;
  final ValueChanged<List<SkillEnhanced>> onUpdated;
  const _SkillsListTab({required this.employee, required this.skills, required this.onUpdated});
  @override
  State<_SkillsListTab> createState() => _SkillsListTabState();
}

class _SkillsListTabState extends State<_SkillsListTab> {
  final _svc = EmployeeService();
  bool _saving = false;

  Color _levelColor(String level) => switch (level) {
    'Expert' => AppTheme.green,
    'Advanced' => AppTheme.blue,
    'Intermediate' => AppTheme.amber,
    _ => AppTheme.textSecondary,
  };

  double _levelFraction(String level) => switch (level) {
    'Expert' => 1.0,
    'Advanced' => 0.75,
    'Intermediate' => 0.5,
    _ => 0.25,
  };

  Future<void> _saveLevel(int index, String newLevel) async {
    final updated = List<SkillEnhanced>.from(widget.skills);
    updated[index] = SkillEnhanced(
      skill: updated[index].skill,
      level: newLevel,
      yearsOfExperience: updated[index].yearsOfExperience,
    );
    widget.onUpdated(updated);
    setState(() => _saving = true);
    try {
      await _svc.update(widget.employee.id, {
        'skillsEnhanced': updated.map((s) => s.toJson()).toList(),
      });
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Save failed: $e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.skills.isEmpty) {
      return const Center(child: Text('No skills listed', style: TextStyle(color: AppTheme.textSecondary)));
    }
    return Stack(children: [
      ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: widget.skills.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) {
          final s = widget.skills[i];
          final color = _levelColor(s.level);
          return Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.border),
            ),
            child: Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(s.skill, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: LinearProgressIndicator(
                    value: _levelFraction(s.level),
                    minHeight: 5,
                    backgroundColor: color.withOpacity(0.12),
                    valueColor: AlwaysStoppedAnimation(color),
                  ),
                ),
                if (s.yearsOfExperience != null) ...[
                  const SizedBox(height: 3),
                  Text('${s.yearsOfExperience}y exp', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                ],
              ])),
              const SizedBox(width: 12),
              // Inline level dropdown
              DropdownButton<String>(
                value: s.level,
                isDense: true,
                underline: const SizedBox(),
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color),
                items: SkillEnhanced.levels.map((l) => DropdownMenuItem(
                  value: l,
                  child: Text(l, style: TextStyle(fontSize: 12, color: _levelColor(l))),
                )).toList(),
                onChanged: (v) { if (v != null) _saveLevel(i, v); },
              ),
            ]),
          );
        },
      ),
      if (_saving)
        const Positioned(top: 8, right: 16, child: SizedBox(width: 16, height: 16,
            child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary))),
    ]);
  }
}

// ── 2. Gap Analysis Tab ───────────────────────────────────────────────────────

class _GapAnalysisTab extends StatefulWidget {
  final Employee employee;
  final List<SkillEnhanced> skills;
  const _GapAnalysisTab({required this.employee, required this.skills});
  @override
  State<_GapAnalysisTab> createState() => _GapAnalysisTabState();
}

class _GapAnalysisTabState extends State<_GapAnalysisTab> {
  final _empSvc = EmployeeService();
  List<Employee> _allEmployees = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final emps = await _empSvc.getAll();
      if (mounted) setState(() { _allEmployees = emps; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  // Classify this employee's skills
  List<SkillEnhanced> get _strong => widget.skills.where((s) => s.level == 'Expert' || s.level == 'Advanced').toList();
  List<SkillEnhanced> get _weak => widget.skills.where((s) => s.level == 'Beginner' || s.level == 'Intermediate').toList();

  // Top-5 skills missing from this employee but present in team
  List<MapEntry<String, int>> get _missingSkills {
    final mySkillNames = widget.skills.map((s) => s.skill.toLowerCase()).toSet();
    final Map<String, int> teamSkillCount = {};
    for (final emp in _allEmployees) {
      if (emp.id == widget.employee.id) continue;
      for (final s in emp.skillsEnhanced) {
        final key = s.skill.toLowerCase();
        if (!mySkillNames.contains(key)) {
          teamSkillCount[s.skill] = (teamSkillCount[s.skill] ?? 0) + 1;
        }
      }
      for (final s in emp.skills) {
        final key = s.toLowerCase();
        if (!mySkillNames.contains(key)) {
          teamSkillCount[s] = (teamSkillCount[s] ?? 0) + 1;
        }
      }
    }
    final sorted = teamSkillCount.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    return sorted.take(5).toList();
  }

  int get _teamSize => _allEmployees.where((e) => e.id != widget.employee.id).length;

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));

    final missing = _missingSkills;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Summary row
        Row(children: [
          _summaryChip('Strong', '${_strong.length}', AppTheme.green),
          const SizedBox(width: 8),
          _summaryChip('Weak', '${_weak.length}', AppTheme.amber),
          const SizedBox(width: 8),
          _summaryChip('Missing', '${missing.length}+', AppTheme.red),
        ]),
        const SizedBox(height: 16),
        _sectionLabel('Strong Skills'),
        const SizedBox(height: 6),
        if (_strong.isEmpty) _empty('No strong skills yet'),
        ..._strong.map((s) => _skillRow(s.skill, s.level, AppTheme.green)),
        const SizedBox(height: 12),
        _sectionLabel('Needs Improvement'),
        const SizedBox(height: 6),
        if (_weak.isEmpty) _empty('All skills are strong'),
        ..._weak.map((s) => _skillRow(s.skill, s.level, AppTheme.amber)),
        const SizedBox(height: 12),
        _sectionLabel('Top Missing Skills (Team has, you don\'t)'),
        const SizedBox(height: 6),
        if (missing.isEmpty) _empty('No skill gaps detected'),
        ...missing.map((e) {
          final pct = _teamSize == 0 ? 0.0 : e.value / _teamSize;
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(e.key, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
                Text('${(pct * 100).toStringAsFixed(0)}% of team', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
              ]),
              const SizedBox(height: 4),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: pct.clamp(0.0, 1.0),
                  minHeight: 7,
                  backgroundColor: AppTheme.red.withOpacity(0.1),
                  valueColor: const AlwaysStoppedAnimation(AppTheme.red),
                ),
              ),
            ]),
          );
        }),
      ]),
    );
  }

  Widget _summaryChip(String label, String value, Color color) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withOpacity(0.2))),
      child: Column(children: [
        Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: color)),
        Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
      ]),
    ),
  );

  Widget _skillRow(String name, String level, Color color) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Row(children: [
      Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
      const SizedBox(width: 8),
      Expanded(child: Text(name, style: const TextStyle(fontSize: 13))),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
        decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
        child: Text(level, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
      ),
    ]),
  );

  Widget _sectionLabel(String t) => Text(t, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.textSecondary, letterSpacing: 0.3));
  Widget _empty(String msg) => Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(msg, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)));
}

// ── 3. Project Match Tab ──────────────────────────────────────────────────────

class _ProjectMatchTab extends StatefulWidget {
  final List<SkillEnhanced> skills;
  const _ProjectMatchTab({required this.skills});
  @override
  State<_ProjectMatchTab> createState() => _ProjectMatchTabState();
}

class _ProjectMatchTabState extends State<_ProjectMatchTab> {
  final _projSvc = ProjectService();
  List<Project> _projects = [];
  Project? _selected;
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final data = await _projSvc.getAll();
      if (mounted) setState(() { _projects = data; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  // Derive required skills from project tags (tags often contain tech/skill names)
  List<String> _projectRequiredSkills(Project p) =>
      [...p.tags, ...p.name.split(' ')].where((t) => t.length > 2).toList();

  double _matchScore(Project p) {
    final required = _projectRequiredSkills(p).map((s) => s.toLowerCase()).toSet();
    if (required.isEmpty) return 0.5; // neutral if no tags
    final mySkills = widget.skills.map((s) => s.skill.toLowerCase()).toSet();
    final matched = required.intersection(mySkills).length;
    return (matched / required.length).clamp(0.0, 1.0);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));

    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        child: DropdownButtonFormField<Project>(
          value: _selected,
          decoration: const InputDecoration(labelText: 'Select Project to Analyze'),
          items: _projects.map((p) => DropdownMenuItem(value: p, child: Text(p.name, style: const TextStyle(fontSize: 13)))).toList(),
          onChanged: (v) => setState(() => _selected = v),
        ),
      ),
      const SizedBox(height: 12),
      if (_selected == null)
        const Expanded(child: Center(child: Text('Select a project to see skill fit', style: TextStyle(color: AppTheme.textSecondary))))
      else
        Expanded(child: _buildMatchResult(_selected!)),
    ]);
  }

  Widget _buildMatchResult(Project p) {
    final score = _matchScore(p);
    final required = _projectRequiredSkills(p);
    final mySkillNames = widget.skills.map((s) => s.skill.toLowerCase()).toSet();
    final matched = required.where((s) => mySkillNames.contains(s.toLowerCase())).toList();
    final missing = required.where((s) => !mySkillNames.contains(s.toLowerCase())).toList();
    final color = score >= 0.7 ? AppTheme.green : score >= 0.4 ? AppTheme.amber : AppTheme.red;
    final label = score >= 0.7 ? 'Strong Match' : score >= 0.4 ? 'Partial Match' : 'Weak Match';

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Card(child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            Row(children: [
              Expanded(child: Text(p.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
              ),
            ]),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: score,
                minHeight: 12,
                backgroundColor: color.withOpacity(0.1),
                valueColor: AlwaysStoppedAnimation(color),
              ),
            ),
            const SizedBox(height: 6),
            Text('${(score * 100).toStringAsFixed(0)}% skill match', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
          ]),
        )),
        const SizedBox(height: 12),
        if (matched.isNotEmpty) ...[
          _sectionLabel('✓ Matched Skills'),
          const SizedBox(height: 6),
          Wrap(spacing: 6, runSpacing: 6, children: matched.map((s) => _chip(s, AppTheme.green)).toList()),
          const SizedBox(height: 12),
        ],
        if (missing.isNotEmpty) ...[
          _sectionLabel('✗ Missing Skills'),
          const SizedBox(height: 6),
          Wrap(spacing: 6, runSpacing: 6, children: missing.map((s) => _chip(s, AppTheme.red)).toList()),
        ],
        if (required.isEmpty)
          const Text('No skill tags on this project — add tags to enable matching.',
              style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
      ]),
    );
  }

  Widget _chip(String label, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3))),
    child: Text(label, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w500)),
  );

  Widget _sectionLabel(String t) => Text(t, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.textSecondary));
}

// ── 4. Analytics Tab ──────────────────────────────────────────────────────────

class _AnalyticsTab extends StatelessWidget {
  final List<SkillEnhanced> skills;
  const _AnalyticsTab({required this.skills});

  Map<String, int> get _byLevel {
    final m = <String, int>{};
    for (final s in skills) m[s.level] = (m[s.level] ?? 0) + 1;
    return m;
  }

  @override
  Widget build(BuildContext context) {
    if (skills.isEmpty) {
      return const Center(child: Text('No skills to analyze', style: TextStyle(color: AppTheme.textSecondary)));
    }

    final byLevel = _byLevel;
    final total = skills.length;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Distribution bar chart
        Card(child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('SKILL LEVEL DISTRIBUTION', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8)),
            const SizedBox(height: 14),
            ...SkillEnhanced.levels.reversed.map((level) {
              final count = byLevel[level] ?? 0;
              final frac = total == 0 ? 0.0 : count / total;
              final color = _levelColor(level);
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(children: [
                  SizedBox(width: 88, child: Text(level, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500))),
                  Expanded(child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: frac,
                      minHeight: 18,
                      backgroundColor: color.withOpacity(0.1),
                      valueColor: AlwaysStoppedAnimation(color),
                    ),
                  )),
                  const SizedBox(width: 8),
                  SizedBox(width: 28, child: Text('$count', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color))),
                ]),
              );
            }),
          ]),
        )),
        const SizedBox(height: 12),
        // Skill score card
        Card(child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('SKILL SCORE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8)),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _scoreCard('Total Skills', '$total', AppTheme.blue)),
              const SizedBox(width: 8),
              Expanded(child: _scoreCard('Avg Score', _avgScore(), AppTheme.green)),
              const SizedBox(width: 8),
              Expanded(child: _scoreCard('Expert', '${byLevel['Expert'] ?? 0}', AppTheme.primary)),
            ]),
          ]),
        )),
        const SizedBox(height: 12),
        // All skills with level badges
        Card(child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('ALL SKILLS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8)),
            const SizedBox(height: 10),
            Wrap(spacing: 6, runSpacing: 6, children: skills.map((s) {
              final color = _levelColor(s.level);
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: color.withOpacity(0.25))),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Text(s.skill, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w500)),
                  const SizedBox(width: 5),
                  Container(width: 1, height: 10, color: color.withOpacity(0.3)),
                  const SizedBox(width: 5),
                  Text(s.level[0], style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: color)),
                ]),
              );
            }).toList()),
          ]),
        )),
      ]),
    );
  }

  String _avgScore() {
    if (skills.isEmpty) return '0';
    final sum = skills.fold(0, (s, e) => s + e.levelIndex + 1);
    return (sum / skills.length).toStringAsFixed(1);
  }

  Color _levelColor(String level) => switch (level) {
    'Expert' => AppTheme.green,
    'Advanced' => AppTheme.blue,
    'Intermediate' => AppTheme.amber,
    _ => AppTheme.textSecondary,
  };

  Widget _scoreCard(String label, String value, Color color) => Container(
    padding: const EdgeInsets.symmetric(vertical: 10),
    decoration: BoxDecoration(color: color.withOpacity(0.07), borderRadius: BorderRadius.circular(8)),
    child: Column(children: [
      Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: color)),
      Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
    ]),
  );
}
