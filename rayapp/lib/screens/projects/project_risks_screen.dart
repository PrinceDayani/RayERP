import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../services/project_service.dart';

class ProjectRisksScreen extends StatefulWidget {
  final Project project;
  const ProjectRisksScreen({super.key, required this.project});
  @override
  State<ProjectRisksScreen> createState() => _ProjectRisksScreenState();
}

class _ProjectRisksScreenState extends State<ProjectRisksScreen> {
  late List<Map<String, dynamic>> _risks;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _risks = widget.project.risks.map((r) => Map<String, dynamic>.from(r)).toList();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ProjectService().updateRisks(widget.project.id, _risks);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Risks saved')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _showForm({Map<String, dynamic>? existing, int? index}) {
    final titleCtrl = TextEditingController(text: existing?['title'] ?? existing?['description'] ?? '');
    final descCtrl = TextEditingController(text: existing?['mitigation'] ?? '');
    String severity = existing?['severity'] ?? existing?['level'] ?? 'medium';
    String status = existing?['status'] ?? 'identified';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => StatefulBuilder(builder: (ctx, setS) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 16, right: 16, top: 16),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(existing == null ? 'Add Risk' : 'Edit Risk',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          TextField(controller: titleCtrl, autofocus: true, decoration: const InputDecoration(labelText: 'Risk Title')),
          const SizedBox(height: 10),
          TextField(controller: descCtrl, maxLines: 2, decoration: const InputDecoration(labelText: 'Mitigation Plan (optional)')),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: DropdownButtonFormField<String>(
              initialValue: severity,
              decoration: const InputDecoration(labelText: 'Severity'),
              items: ['low', 'medium', 'high', 'critical'].map((s) =>
                  DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 13)))).toList(),
              onChanged: (v) => setS(() => severity = v!),
            )),
            const SizedBox(width: 12),
            Expanded(child: DropdownButtonFormField<String>(
              initialValue: status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: ['identified', 'monitoring', 'mitigated', 'closed'].map((s) =>
                  DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 13)))).toList(),
              onChanged: (v) => setS(() => status = v!),
            )),
          ]),
          const SizedBox(height: 16),
          SizedBox(width: double.infinity, height: 46,
            child: ElevatedButton(
              onPressed: () {
                if (titleCtrl.text.trim().isEmpty) return;
                final r = {
                  if (existing?['_id'] != null) '_id': existing!['_id'],
                  'title': titleCtrl.text.trim(),
                  if (descCtrl.text.trim().isNotEmpty) 'mitigation': descCtrl.text.trim(),
                  'severity': severity,
                  'status': status,
                };
                setState(() {
                  if (index != null) {
                    _risks[index] = r;
                  } else {
                    _risks.add(r);
                  }
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

  Color _severityColor(String s) => switch (s) {
    'critical' => AppTheme.red, 'high' => AppTheme.amber,
    'medium' => AppTheme.blue, _ => AppTheme.green,
  };

  Color _statusColor(String s) => switch (s) {
    'mitigated' || 'closed' => AppTheme.green,
    'monitoring' => AppTheme.amber,
    _ => AppTheme.textSecondary,
  };

  @override
  Widget build(BuildContext context) {
    // Risk summary counts
    final critical = _risks.where((r) => (r['severity'] ?? r['level'] ?? '') == 'critical').length;
    final high = _risks.where((r) => (r['severity'] ?? r['level'] ?? '') == 'high').length;
    final open = _risks.where((r) => !['mitigated', 'closed'].contains(r['status'] ?? '')).length;

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Risks'),
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
        // Summary bar
        Container(
          color: Colors.white,
          padding: EdgeInsets.symmetric(horizontal: AppTheme.hPad(context), vertical: 10),
          child: Row(children: [
            _SummaryChip('${_risks.length} Total', AppTheme.primary),
            const SizedBox(width: 8),
            _SummaryChip('$critical Critical', AppTheme.red),
            const SizedBox(width: 8),
            _SummaryChip('$high High', AppTheme.amber),
            const SizedBox(width: 8),
            _SummaryChip('$open Open', AppTheme.textSecondary),
          ]),
        ),
        const Divider(height: 1, color: AppTheme.border),
        Expanded(
          child: _risks.isEmpty
              ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.warning_amber_outlined, size: 48, color: AppTheme.textMuted),
                  const SizedBox(height: 12),
                  const Text('No risks identified', style: TextStyle(color: AppTheme.textSecondary)),
                  const SizedBox(height: 12),
                  ElevatedButton(onPressed: () => _showForm(), child: const Text('Add Risk')),
                ]))
              : ListView.separated(
                  padding: EdgeInsets.fromLTRB(AppTheme.hPad(context), 12, AppTheme.hPad(context), 80),
                  itemCount: _risks.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final r = _risks[i];
                    final title = r['title'] ?? r['description'] ?? '';
                    final severity = r['severity'] ?? r['level'] ?? 'low';
                    final status = r['status'] ?? 'identified';
                    final mitigation = r['mitigation'] ?? '';
                    final sc = _severityColor(severity);
                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: sc.withOpacity(0.3)),
                      ),
                      padding: const EdgeInsets.all(12),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          Container(width: 8, height: 8, decoration: BoxDecoration(color: sc, shape: BoxShape.circle)),
                          const SizedBox(width: 8),
                          Expanded(child: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
                          IconButton(icon: const Icon(Icons.edit_outlined, size: 16, color: AppTheme.textSecondary),
                              padding: EdgeInsets.zero, constraints: const BoxConstraints(),
                              onPressed: () => _showForm(existing: r, index: i)),
                          const SizedBox(width: 4),
                          IconButton(icon: const Icon(Icons.delete_outline, size: 16, color: AppTheme.red),
                              padding: EdgeInsets.zero, constraints: const BoxConstraints(),
                              onPressed: () => setState(() => _risks.removeAt(i))),
                        ]),
                        if (mitigation.isNotEmpty) ...[ const SizedBox(height: 4),
                          Text('Mitigation: $mitigation',
                              style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                        ],
                        const SizedBox(height: 8),
                        Row(children: [
                          _Badge(severity, sc),
                          const SizedBox(width: 6),
                          _Badge(status, _statusColor(status)),
                        ]),
                      ]),
                    );
                  },
                ),
        ),
      ]),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  final String label; final Color color;
  const _SummaryChip(this.label, this.color);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
  );
}

class _Badge extends StatelessWidget {
  final String label; final Color color;
  const _Badge(this.label, this.color);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
  );
}
