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

  void _err(String msg) => ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppTheme.red));

  void _ok(String msg) => ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppTheme.green));

  void _openForm({Task? template}) {
    final titleCtrl = TextEditingController(text: template?.title ?? '');
    final descCtrl = TextEditingController(text: template?.description ?? '');
    String priority = template?.priority ?? 'medium';
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: Text(template == null ? 'New Template' : 'Edit Template',
              style: const TextStyle(fontSize: 15)),
          content: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(
              controller: titleCtrl,
              autofocus: true,
              decoration: const InputDecoration(
                  labelText: 'Title *',
                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: descCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                  labelText: 'Description',
                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              initialValue: priority,
              decoration: const InputDecoration(
                  labelText: 'Priority',
                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
              items: ['low', 'medium', 'high', 'critical']
                  .map((p) => DropdownMenuItem(value: p, child: Text(p)))
                  .toList(),
              onChanged: (v) => setS(() => priority = v ?? priority),
            ),
          ]),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            TextButton(
              onPressed: () async {
                final title = titleCtrl.text.trim();
                if (title.isEmpty) return;
                Navigator.pop(ctx);
                final auth = context.read<AuthProvider>();
                try {
                  if (template == null) {
                    await _svc.create({
                      'title': title,
                      'description': descCtrl.text.trim(),
                      'priority': priority,
                      'isTemplate': true,
                      'templateName': title,
                      'project': widget.projectId ?? '',
                      'assignedTo': auth.user?.id ?? '',
                      'assignedBy': auth.user?.id ?? '',
                    });
                    _ok('Template created');
                  } else {
                    await _svc.update(template.id, {
                      'title': title,
                      'description': descCtrl.text.trim(),
                      'priority': priority,
                      'templateName': title,
                    });
                    _ok('Template updated');
                  }
                  _load();
                } catch (e) { _err(e.toString()); }
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _delete(Task template) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Template', style: TextStyle(fontSize: 15)),
        content: const Text('This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Delete', style: TextStyle(color: AppTheme.red))),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await _svc.deleteTask(template.id);
      _ok('Template deleted');
      _load();
    } catch (e) { _err(e.toString()); }
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
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.red));
      }
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
      floatingActionButton: FloatingActionButton(
        heroTag: 'template_fab',
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        onPressed: () => _openForm(),
        child: const Icon(Icons.add),
      ),
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
              : AppTheme.constrain(ListView.separated(
                  padding: EdgeInsets.fromLTRB(
                      AppTheme.hPad(context), 16, AppTheme.hPad(context), 80),
                  itemCount: _templates.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final t = _templates[i];
                    final pc = _pc(t.priority);
                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
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
                                  t.templateName?.isNotEmpty == true ? t.templateName! : t.title,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: pc.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(t.priority, style: TextStyle(fontSize: 10, color: pc)),
                              ),
                            ]),
                            if (t.description.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text(t.description,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                            ],
                            if (t.checklist.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text('${t.checklist.length} checklist items',
                                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                            ],
                            const SizedBox(height: 10),
                            LayoutBuilder(builder: (context, constraints) {
                              final narrow = constraints.maxWidth < 360;
                              final useBtn = ElevatedButton(
                                onPressed: () => _useTemplate(t),
                                child: const Text('Use Template'),
                              );
                              final actions = Row(mainAxisSize: MainAxisSize.min, children: [
                                IconButton(
                                  icon: const Icon(Icons.edit_outlined, size: 18, color: AppTheme.textSecondary),
                                  onPressed: () => _openForm(template: t),
                                  tooltip: 'Edit',
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(),
                                ),
                                const SizedBox(width: 8),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, size: 18, color: AppTheme.red),
                                  onPressed: () => _delete(t),
                                  tooltip: 'Delete',
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(),
                                ),
                              ]);
                              if (narrow) {
                                return Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    useBtn,
                                    const SizedBox(height: 6),
                                    Row(mainAxisAlignment: MainAxisAlignment.end, children: [actions]),
                                  ],
                                );
                              }
                              return Row(children: [
                                Expanded(child: useBtn),
                                const SizedBox(width: 8),
                                actions,
                              ]);
                            }),
                          ]),
                    );
                  },
                )),
    );
  }
}
