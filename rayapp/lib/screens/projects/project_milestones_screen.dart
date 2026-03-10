import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../services/project_service.dart';

class ProjectMilestonesScreen extends StatefulWidget {
  final Project project;
  const ProjectMilestonesScreen({super.key, required this.project});
  @override
  State<ProjectMilestonesScreen> createState() => _ProjectMilestonesScreenState();
}

class _ProjectMilestonesScreenState extends State<ProjectMilestonesScreen> {
  late List<Map<String, dynamic>> _milestones;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _milestones = widget.project.milestones.map((m) => Map<String, dynamic>.from(m)).toList();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ProjectService().updateMilestones(widget.project.id, _milestones);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Milestones saved')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _showForm({Map<String, dynamic>? existing, int? index}) {
    final nameCtrl = TextEditingController(text: existing?['name'] ?? existing?['title'] ?? '');
    final descCtrl = TextEditingController(text: existing?['description'] ?? '');
    DateTime due = DateTime.tryParse(existing?['dueDate'] ?? existing?['date'] ?? '') ??
        DateTime.now().add(const Duration(days: 14));
    String status = existing?['status'] ?? 'pending';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => StatefulBuilder(builder: (ctx, setS) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 16, right: 16, top: 16),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(existing == null ? 'Add Milestone' : 'Edit Milestone',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          TextField(controller: nameCtrl, autofocus: true, decoration: const InputDecoration(labelText: 'Title')),
          const SizedBox(height: 10),
          TextField(controller: descCtrl, maxLines: 2, decoration: const InputDecoration(labelText: 'Description (optional)')),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: GestureDetector(
              onTap: () async {
                final d = await showDatePicker(context: ctx, initialDate: due,
                    firstDate: DateTime(2020), lastDate: DateTime(2035),
                    builder: (c, child) => Theme(data: Theme.of(c).copyWith(
                        colorScheme: const ColorScheme.light(primary: AppTheme.primary)), child: child!));
                if (d != null) setS(() => due = d);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppTheme.border)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Due Date', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                  Text(AppTheme.fmtDate(due), style: const TextStyle(fontSize: 13)),
                ]),
              ),
            )),
            const SizedBox(width: 12),
            Expanded(child: DropdownButtonFormField<String>(
              value: status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: ['pending', 'in-progress', 'completed'].map((s) =>
                  DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 13)))).toList(),
              onChanged: (v) => setS(() => status = v!),
            )),
          ]),
          const SizedBox(height: 16),
          SizedBox(width: double.infinity, height: 46,
            child: ElevatedButton(
              onPressed: () {
                if (nameCtrl.text.trim().isEmpty) return;
                final m = {
                  if (existing?['_id'] != null) '_id': existing!['_id'],
                  'name': nameCtrl.text.trim(),
                  if (descCtrl.text.trim().isNotEmpty) 'description': descCtrl.text.trim(),
                  'dueDate': due.toIso8601String(),
                  'status': status,
                };
                setState(() {
                  if (index != null) _milestones[index] = m;
                  else _milestones.add(m);
                });
                Navigator.pop(ctx);
              },
              child: Text(existing == null ? 'Add' : 'Save'),
            )),
          const SizedBox(height: 16),
        ]),
      )),
    );
  }

  void _toggleStatus(int i) {
    final m = Map<String, dynamic>.from(_milestones[i]);
    m['status'] = m['status'] == 'completed' ? 'pending' : 'completed';
    setState(() => _milestones[i] = m);
  }

  void _delete(int i) {
    setState(() => _milestones.removeAt(i));
  }

  Color _statusColor(String s) => switch (s) {
    'completed' => AppTheme.green, 'in-progress' => AppTheme.blue, _ => AppTheme.textSecondary,
  };

  @override
  Widget build(BuildContext context) {
    final completed = _milestones.where((m) => m['status'] == 'completed').length;
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Milestones'),
        actions: [
          if (_saving)
            const Padding(padding: EdgeInsets.all(14), child: SizedBox(width: 20, height: 20,
                child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2)))
          else
            TextButton(onPressed: _save, child: const Text('Save', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w700))),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppTheme.primary, foregroundColor: Colors.white,
        onPressed: () => _showForm(),
        child: const Icon(Icons.add),
      ),
      body: Column(children: [
        Container(
          color: Colors.white,
          padding: EdgeInsets.symmetric(horizontal: AppTheme.hPad(context), vertical: 10),
          child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('$completed / ${_milestones.length} completed',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              ClipRRect(borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: _milestones.isEmpty ? 0 : completed / _milestones.length,
                  minHeight: 6, backgroundColor: AppTheme.border,
                  valueColor: const AlwaysStoppedAnimation(AppTheme.green),
                )),
            ])),
          ]),
        ),
        const Divider(height: 1, color: AppTheme.border),
        Expanded(
          child: _milestones.isEmpty
              ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.flag_outlined, size: 48, color: AppTheme.textMuted),
                  const SizedBox(height: 12),
                  const Text('No milestones yet', style: TextStyle(color: AppTheme.textSecondary)),
                  const SizedBox(height: 12),
                  ElevatedButton(onPressed: () => _showForm(), child: const Text('Add Milestone')),
                ]))
              : ReorderableListView.builder(
                  padding: EdgeInsets.fromLTRB(AppTheme.hPad(context), 12, AppTheme.hPad(context), 80),
                  itemCount: _milestones.length,
                  onReorder: (oldIndex, newIndex) {
                    setState(() {
                      if (newIndex > oldIndex) newIndex--;
                      final item = _milestones.removeAt(oldIndex);
                      _milestones.insert(newIndex, item);
                    });
                  },
                  itemBuilder: (_, i) {
                    final m = _milestones[i];
                    final title = m['name'] ?? m['title'] ?? '';
                    final status = m['status'] ?? 'pending';
                    final done = status == 'completed';
                    final due = DateTime.tryParse(m['dueDate'] ?? m['date'] ?? '');
                    final isOverdue = due != null && due.isBefore(DateTime.now()) && !done;
                    return Container(
                      key: ValueKey(i),
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: isOverdue ? AppTheme.red.withOpacity(0.4) : AppTheme.border),
                      ),
                      child: ListTile(
                        leading: GestureDetector(
                          onTap: () => _toggleStatus(i),
                          child: Icon(
                            done ? Icons.check_circle : Icons.radio_button_unchecked,
                            color: done ? AppTheme.green : AppTheme.textSecondary, size: 22,
                          ),
                        ),
                        title: Text(title, style: TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w600,
                          decoration: done ? TextDecoration.lineThrough : null,
                          color: done ? AppTheme.textSecondary : AppTheme.textPrimary,
                        )),
                        subtitle: Row(children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: _statusColor(status).withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                            child: Text(status, style: TextStyle(fontSize: 10, color: _statusColor(status))),
                          ),
                          if (due != null) ...[ const SizedBox(width: 6),
                            Text(AppTheme.fmtDate(due),
                                style: TextStyle(fontSize: 10, color: isOverdue ? AppTheme.red : AppTheme.textSecondary)),
                          ],
                        ]),
                        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                          IconButton(icon: const Icon(Icons.edit_outlined, size: 16, color: AppTheme.textSecondary),
                              onPressed: () => _showForm(existing: m, index: i)),
                          IconButton(icon: const Icon(Icons.delete_outline, size: 16, color: AppTheme.red),
                              onPressed: () => _delete(i)),
                        ]),
                      ),
                    );
                  },
                ),
        ),
      ]),
    );
  }
}
