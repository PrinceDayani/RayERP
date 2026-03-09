import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../services/project_service.dart';
import 'project_form_screen.dart';
import 'project_clone_screen.dart';

class ProjectSettingsScreen extends StatefulWidget {
  final Project project;
  const ProjectSettingsScreen({super.key, required this.project});
  @override
  State<ProjectSettingsScreen> createState() => _ProjectSettingsScreenState();
}

class _ProjectSettingsScreenState extends State<ProjectSettingsScreen> {
  late Project _project;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _project = widget.project;
  }

  Future<void> _updateStatus(String status) async {
    setState(() => _saving = true);
    try {
      final updated = await ProjectService().update(_project.id, {'status': status});
      setState(() => _project = updated);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Status updated to $status')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Project'),
        content: Text('Permanently delete "${_project.name}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: AppTheme.red)),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await ProjectService().deleteProject(_project.id);
      if (mounted) Navigator.of(context).popUntil((r) => r.isFirst || r.settings.name == '/projects');
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(title: const Text('Project Settings')),
      body: _saving
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Project info summary
                _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(_project.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Row(children: [
                    _StatusBadge(_project.status),
                    const SizedBox(width: 8),
                    _StatusBadge(_project.priority, isPriority: true),
                  ]),
                ])),
                const SizedBox(height: 16),

                // General actions
                _SectionLabel('General'),
                _ActionTile(
                  icon: Icons.edit_outlined,
                  title: 'Edit Project',
                  subtitle: 'Update name, dates, team, budget',
                  onTap: () async {
                    final updated = await Navigator.push<bool>(context,
                        MaterialPageRoute(builder: (_) => ProjectFormScreen(project: _project)));
                    if (updated == true && mounted) {
                      final refreshed = await ProjectService().getById(_project.id);
                      setState(() => _project = refreshed);
                    }
                  },
                ),
                _ActionTile(
                  icon: Icons.copy_outlined,
                  title: 'Clone Project',
                  subtitle: 'Create a copy with new dates',
                  onTap: () => Navigator.push(context,
                      MaterialPageRoute(builder: (_) => ProjectCloneScreen(project: _project))),
                ),

                const SizedBox(height: 16),

                // Status management
                _SectionLabel('Change Status'),
                _Card(child: Column(children: [
                  for (final s in ['planning', 'active', 'on-hold', 'completed'])
                    _StatusOption(
                      status: s,
                      current: _project.status,
                      onTap: s == _project.status ? null : () => _updateStatus(s),
                    ),
                ])),

                const SizedBox(height: 16),

                // Danger zone
                _SectionLabel('Danger Zone', color: AppTheme.red),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.red.withOpacity(0.3)),
                  ),
                  child: ListTile(
                    leading: const Icon(Icons.delete_forever_outlined, color: AppTheme.red),
                    title: const Text('Delete Project', style: TextStyle(color: AppTheme.red, fontWeight: FontWeight.w600)),
                    subtitle: const Text('Permanently remove this project and all its data'),
                    onTap: _delete,
                  ),
                ),
              ],
            ),
    );
  }
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});
  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
    padding: const EdgeInsets.all(14),
    child: child,
  );
}

class _SectionLabel extends StatelessWidget {
  final String text;
  final Color color;
  const _SectionLabel(this.text, {this.color = AppTheme.textSecondary});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color, letterSpacing: 0.5)),
  );
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String title, subtitle;
  final VoidCallback onTap;
  const _ActionTile({required this.icon, required this.title, required this.subtitle, required this.onTap});
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 8),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
    child: ListTile(
      leading: Container(
        width: 36, height: 36,
        decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: AppTheme.primary, size: 18),
      ),
      title: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
      trailing: const Icon(Icons.chevron_right, size: 18, color: AppTheme.textSecondary),
      onTap: onTap,
    ),
  );
}

class _StatusOption extends StatelessWidget {
  final String status, current;
  final VoidCallback? onTap;
  const _StatusOption({required this.status, required this.current, this.onTap});

  Color get _color => switch (status) {
    'active' => AppTheme.green, 'planning' => AppTheme.blue,
    'on-hold' => AppTheme.amber, _ => AppTheme.cyan,
  };

  @override
  Widget build(BuildContext context) {
    final selected = status == current;
    return ListTile(
      dense: true,
      leading: Container(width: 8, height: 8, decoration: BoxDecoration(color: _color, shape: BoxShape.circle)),
      title: Text(status, style: TextStyle(fontSize: 13, fontWeight: selected ? FontWeight.w700 : FontWeight.normal)),
      trailing: selected ? Icon(Icons.check, size: 16, color: _color) : null,
      onTap: onTap,
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String label;
  final bool isPriority;
  const _StatusBadge(this.label, {this.isPriority = false});

  Color get _color => isPriority
      ? switch (label) { 'critical' => AppTheme.red, 'high' => AppTheme.amber, 'medium' => AppTheme.blue, _ => AppTheme.green }
      : switch (label) { 'active' => AppTheme.green, 'planning' => AppTheme.blue, 'on-hold' => AppTheme.amber, _ => AppTheme.cyan };

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(color: _color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: TextStyle(fontSize: 11, color: _color, fontWeight: FontWeight.w600)),
  );
}
