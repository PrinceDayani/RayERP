import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../services/resource_service.dart';
import '../../services/project_service.dart';
import '../employees/employee_detail_screen.dart';

class ProjectSkillMatchScreen extends StatefulWidget {
  final String? initialProjectId;
  const ProjectSkillMatchScreen({super.key, this.initialProjectId});

  @override
  State<ProjectSkillMatchScreen> createState() => _ProjectSkillMatchScreenState();
}

class _ProjectSkillMatchScreenState extends State<ProjectSkillMatchScreen> {
  final _svc = ResourceService();
  final _projSvc = ProjectService();

  List<Project> _projects = [];
  Project? _selectedProject;
  List<ProjectSkillMatch> _matches = [];
  bool _loadingProjects = true;
  bool _loadingMatches = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadProjects();
  }

  Future<void> _loadProjects() async {
    try {
      final all = await _projSvc.getAll();
      if (!mounted) return;
      setState(() {
        _projects = all;
        _loadingProjects = false;
        if (widget.initialProjectId != null) {
          try {
            _selectedProject = all.firstWhere((p) => p.id == widget.initialProjectId);
            _loadMatches();
          } catch (_) {}
        }
      });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loadingProjects = false; });
    }
  }

  Future<void> _loadMatches() async {
    if (_selectedProject == null) return;
    setState(() { _loadingMatches = true; _error = null; });
    try {
      final data = await _svc.getProjectSkillMatch(_selectedProject!.id);
      // Sort by match % descending
      data.sort((a, b) => b.matchPercentage.compareTo(a.matchPercentage));
      if (mounted) setState(() { _matches = data; _loadingMatches = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loadingMatches = false; });
    }
  }

  Color _matchColor(int pct) {
    if (pct >= 80) return AppTheme.green;
    if (pct >= 50) return AppTheme.amber;
    return AppTheme.red;
  }

  @override
  Widget build(BuildContext context) {
    if (_loadingProjects) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));

    return Column(children: [
      // Project picker
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        child: DropdownButtonFormField<Project>(
          initialValue: _selectedProject,
          decoration: const InputDecoration(
            labelText: 'Select Project',
            prefixIcon: Icon(Icons.folder_outlined, size: 18),
          ),
          isExpanded: true,
          items: _projects.map((p) => DropdownMenuItem(
            value: p,
            child: Text(p.name, style: const TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis),
          )).toList(),
          onChanged: (v) {
            setState(() { _selectedProject = v; _matches = []; });
            _loadMatches();
          },
        ),
      ),
      if (_selectedProject != null && _selectedProject!.requiredSkills.isNotEmpty)
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Required Skills:', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Wrap(spacing: 6, runSpacing: 4, children: _selectedProject!.requiredSkills.map((s) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: AppTheme.blueBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.blue.withOpacity(0.3))),
              child: Text(s, style: const TextStyle(fontSize: 11, color: AppTheme.blue)),
            )).toList()),
          ]),
        ),
      const SizedBox(height: 8),
      if (_loadingMatches)
        const Expanded(child: Center(child: CircularProgressIndicator(color: AppTheme.primary)))
      else if (_error != null)
        Expanded(child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text(_error!, style: const TextStyle(color: AppTheme.red), textAlign: TextAlign.center),
          const SizedBox(height: 8),
          TextButton(onPressed: _loadMatches, child: const Text('Retry')),
        ])))
      else if (_selectedProject == null)
        const Expanded(child: Center(child: Text('Select a project to see skill matches', style: TextStyle(color: AppTheme.textSecondary))))
      else if (_matches.isEmpty)
        const Expanded(child: Center(child: Text('No employee data available', style: TextStyle(color: AppTheme.textSecondary))))
      else
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            itemCount: _matches.length,
            itemBuilder: (_, i) => _matchCard(_matches[i], i),
          ),
        ),
    ]);
  }

  Widget _matchCard(ProjectSkillMatch m, int rank) {
    final color = _matchColor(m.matchPercentage);
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              width: 28, height: 28,
              decoration: BoxDecoration(color: color.withOpacity(0.12), shape: BoxShape.circle),
              child: Center(child: Text('${rank + 1}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: color))),
            ),
            const SizedBox(width: 10),
            Expanded(child: GestureDetector(
              onTap: () => Navigator.push(context, MaterialPageRoute(
                  builder: (_) => EmployeeDetailScreen(id: m.employeeId))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(m.employeeName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.primary, decoration: TextDecoration.underline)),
                Text(m.position, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
              ]),
            )),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('${m.matchPercentage}%', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
              Text('match', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
            ]),
          ]),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: m.matchPercentage / 100,
              minHeight: 6,
              backgroundColor: const Color(0xFFF3F4F6),
              valueColor: AlwaysStoppedAnimation(color),
            ),
          ),
          if (m.matchedSkills.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(spacing: 6, runSpacing: 4, children: m.matchedSkills.map((s) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(color: AppTheme.greenBg, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.green.withOpacity(0.3))),
              child: Text('✓ ${s['skill']}', style: const TextStyle(fontSize: 11, color: AppTheme.green)),
            )).toList()),
          ],
          if (m.missingSkills.isNotEmpty) ...[
            const SizedBox(height: 4),
            Wrap(spacing: 6, runSpacing: 4, children: m.missingSkills.map((s) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(color: AppTheme.redBg, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.red.withOpacity(0.3))),
              child: Text('✗ $s', style: const TextStyle(fontSize: 11, color: AppTheme.red)),
            )).toList()),
          ],
        ]),
      ),
    );
  }
}
