import 'package:flutter/material.dart';
import '../../../config/app_theme.dart';
import '../../../services/employee_stats_service.dart';

class ProjectsTab extends StatefulWidget {
  final String employeeId;
  const ProjectsTab({super.key, required this.employeeId});
  @override
  State<ProjectsTab> createState() => _ProjectsTabState();
}

class _ProjectsTabState extends State<ProjectsTab> {
  final _svc = EmployeeStatsService();
  List<ProjectWithTeam>? _projects;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _svc.getEmployeeProjectsRaw(widget.employeeId);
      if (mounted) setState(() => _projects = data);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Center(child: Text(_error!, style: const TextStyle(color: AppTheme.red)));
    }
    if (_projects == null) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    }
    if (_projects!.isEmpty) {
      return const Center(child: Text('No projects assigned', style: TextStyle(color: AppTheme.textSecondary)));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _projects!.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (_, i) => _ProjectCard(project: _projects![i]),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  final ProjectWithTeam project;
  const _ProjectCard({required this.project});

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.statusColor(project.status);
    final bg = AppTheme.statusBg(project.status);
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: IntrinsicHeight(
        child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Container(
            width: 3,
            decoration: BoxDecoration(
              color: color,
              borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(12), bottomLeft: Radius.circular(12)),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(
                    child: Text(project.name,
                        style: const TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 14, color: AppTheme.textPrimary)),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
                    child: Text(project.status,
                        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w600)),
                  ),
                ]),
                const SizedBox(height: 6),
                Row(children: [
                  const Icon(Icons.calendar_today_outlined, size: 11, color: AppTheme.textMuted),
                  const SizedBox(width: 4),
                  Text(
                    '${AppTheme.fmtDate(project.startDate)} → ${AppTheme.fmtDate(project.endDate)}',
                    style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                  ),
                ]),
                const SizedBox(height: 8),
                Row(children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: project.progress / 100,
                        backgroundColor: AppTheme.border,
                        color: color,
                        minHeight: 5,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text('${project.progress}%',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
                ]),
                const SizedBox(height: 4),
                _priorityChip(project.priority),
              ]),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _priorityChip(String priority) {
    final color = switch (priority) {
      'high' || 'critical' => AppTheme.red,
      'medium' => AppTheme.amber,
      _ => AppTheme.teal,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.25)),
      ),
      child: Text(priority.toUpperCase(),
          style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: color, letterSpacing: 0.5)),
    );
  }
}
