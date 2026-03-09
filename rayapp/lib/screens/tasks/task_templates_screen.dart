import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/task.dart';
import '../../services/task_service.dart';
import '../../services/auth_provider.dart';

class TaskTemplatesScreen extends StatefulWidget {
  final String? projectId;
  const TaskTemplatesScreen({super.key, this.projectId});

  @override
  State<TaskTemplatesScreen> createState() => _TaskTemplatesScreenState();
}

class _TaskTemplatesScreenState extends State<TaskTemplatesScreen> {
  final _svc = TaskService();
  List<Task> _templates = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _templates = await _svc.getTemplates();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _useTemplate(Task template) async {
    if (widget.projectId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Open from a project to use templates'),
            backgroundColor: AppTheme.amber),
      );
      return;
    }
    final auth = context.read<AuthProvider>();
    try {
      await _svc.createFromTemplate(template.id, {
        'project': widget.projectId,
        'assignedBy': auth.user?.id ?? '',
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Task created from template'),
              backgroundColor: AppTheme.green),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.red));
    }
  }

  Color _pc(String p) => switch (p) {
        'critical' => AppTheme.red,
        'high' => AppTheme.amber,
        'medium' => AppTheme.blue,
        _ => AppTheme.green,
      };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(title: const Text('Task Templates')),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary))
          : _templates.isEmpty
              ? Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.folder_copy_outlined,
                      size: 52, color: AppTheme.textMuted),
                  const SizedBox(height: 12),
                  const Text('No templates available',
                      style: TextStyle(color: AppTheme.textSecondary)),
                ]))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _templates.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final t = _templates[i];
                    final pc = _pc(t.priority);
                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(children: [
                              const Icon(Icons.folder_copy_outlined,
                                  size: 16, color: AppTheme.primary),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  t.templateName?.isNotEmpty == true
                                      ? t.templateName!
                                      : t.title,
                                  style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: pc.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(t.priority,
                                    style: TextStyle(
                                        fontSize: 10, color: pc)),
                              ),
                            ]),
                            if (t.description.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text(t.description,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                      fontSize: 12,
                                      color: AppTheme.textSecondary)),
                            ],
                            if (t.checklist.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text(
                                '${t.checklist.length} checklist items',
                                style: const TextStyle(
                                    fontSize: 11,
                                    color: AppTheme.textSecondary),
                              ),
                            ],
                            const SizedBox(height: 10),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () => _useTemplate(t),
                                child: const Text('Use Template'),
                              ),
                            ),
                          ]),
                    );
                  },
                ),
    );
  }
}
