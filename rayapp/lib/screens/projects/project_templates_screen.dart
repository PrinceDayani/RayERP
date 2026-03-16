import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../services/project_service.dart';
import 'project_detail_screen.dart';

class ProjectTemplatesScreen extends StatefulWidget {
  /// If [project] is provided, shows "Save as Template" option for that project.
  final Project? project;
  const ProjectTemplatesScreen({super.key, this.project});
  @override
  State<ProjectTemplatesScreen> createState() => _ProjectTemplatesScreenState();
}

class _ProjectTemplatesScreenState extends State<ProjectTemplatesScreen> {
  final _svc = ProjectTemplateService();
  List<Map<String, dynamic>> _templates = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    _templates = await _svc.getTemplates();
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _exportCurrent() async {
    if (widget.project == null) return;
    try {
      await _svc.exportAsTemplate(widget.project!.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Project saved as template')));
        _load();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _showCreateFromTemplate(Map<String, dynamic> template) {
    final nameCtrl = TextEditingController(text: template['name'] ?? '');
    DateTime start = DateTime.now();
    DateTime end = DateTime.now().add(const Duration(days: 30));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => StatefulBuilder(builder: (ctx, setS) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 16, right: 16, top: 16),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('New Project from "${template['name']}"',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Project Name')),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _DateTile('Start', start, () async {
              final d = await showDatePicker(context: ctx, initialDate: start,
                  firstDate: DateTime(2020), lastDate: DateTime(2035),
                  builder: (c, child) => Theme(data: Theme.of(c).copyWith(
                      colorScheme: const ColorScheme.light(primary: AppTheme.primary)), child: child!));
              if (d != null) setS(() => start = d);
            })),
            const SizedBox(width: 12),
            Expanded(child: _DateTile('End', end, () async {
              final d = await showDatePicker(context: ctx, initialDate: end,
                  firstDate: DateTime(2020), lastDate: DateTime(2035),
                  builder: (c, child) => Theme(data: Theme.of(c).copyWith(
                      colorScheme: const ColorScheme.light(primary: AppTheme.primary)), child: child!));
              if (d != null) setS(() => end = d);
            })),
          ]),
          const SizedBox(height: 16),
          SizedBox(width: double.infinity, height: 46,
            child: ElevatedButton(
              onPressed: () async {
                if (nameCtrl.text.trim().isEmpty) return;
                Navigator.pop(ctx);
                try {
                  final result = await _svc.createProjectFromTemplate(
                    template['_id'] ?? template['id'] ?? '',
                    {'name': nameCtrl.text.trim(), 'startDate': start.toIso8601String(), 'endDate': end.toIso8601String()},
                  );
                  if (!mounted) return;
                  final id = result['_id'] ?? result['id'] ?? '';
                  if (id.isNotEmpty) {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => ProjectDetailScreen(id: id)));
                  }
                } catch (e) {
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                }
              },
              child: const Text('Create Project'),
            )),
          const SizedBox(height: 16),
        ]),
      )),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Project Templates'),
        actions: [
          if (widget.project != null)
            TextButton.icon(
              icon: const Icon(Icons.save_outlined, size: 16),
              label: const Text('Save as Template'),
              onPressed: _exportCurrent,
            ),
          IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _templates.isEmpty
              ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.folder_copy_outlined, size: 48, color: AppTheme.textMuted),
                  const SizedBox(height: 12),
                  const Text('No templates yet', style: TextStyle(color: AppTheme.textSecondary)),
                  if (widget.project != null) ...[ const SizedBox(height: 12),
                    ElevatedButton(onPressed: _exportCurrent, child: const Text('Save Current Project as Template')),
                  ],
                ]))
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppTheme.primary,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _templates.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (_, i) {
                      final t = _templates[i];
                      final name = t['name'] ?? 'Unnamed Template';
                      final desc = t['description'] ?? '';
                      final taskCount = (t['tasks'] as List? ?? []).length;
                      final milestoneCount = (t['milestones'] as List? ?? []).length;
                      return Container(
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(14),
                          leading: Container(
                            width: 40, height: 40,
                            decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(10)),
                            child: const Icon(Icons.folder_copy_outlined, color: AppTheme.primary, size: 20),
                          ),
                          title: Text(name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                          subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            if (desc.isNotEmpty) Text(desc, maxLines: 1, overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                            const SizedBox(height: 4),
                            Row(children: [
                              _MetaChip('$taskCount tasks', AppTheme.blue),
                              const SizedBox(width: 6),
                              _MetaChip('$milestoneCount milestones', AppTheme.purple),
                            ]),
                          ]),
                          trailing: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              textStyle: const TextStyle(fontSize: 12),
                            ),
                            onPressed: () => _showCreateFromTemplate(t),
                            child: const Text('Use'),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

class _DateTile extends StatelessWidget {
  final String label;
  final DateTime date;
  final VoidCallback onTap;
  const _DateTile(this.label, this.date, this.onTap);
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppTheme.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
        Text(AppTheme.fmtDate(date), style: const TextStyle(fontSize: 13)),
      ]),
    ),
  );
}

class _MetaChip extends StatelessWidget {
  final String label; final Color color;
  const _MetaChip(this.label, this.color);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
    decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: TextStyle(fontSize: 10, color: color)),
  );
}
