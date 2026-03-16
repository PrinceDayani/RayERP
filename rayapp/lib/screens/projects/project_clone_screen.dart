import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../services/project_service.dart';
import 'project_detail_screen.dart';

class ProjectCloneScreen extends StatefulWidget {
  final Project project;
  const ProjectCloneScreen({super.key, required this.project});
  @override
  State<ProjectCloneScreen> createState() => _ProjectCloneScreenState();
}

class _ProjectCloneScreenState extends State<ProjectCloneScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _name;
  late DateTime _startDate;
  late DateTime _endDate;
  bool _cloneTasks = true;
  bool _cloneBudget = true;
  bool _cloneTeam = true;
  bool _cloneMilestones = true;
  bool _cloneRisks = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: '${widget.project.name} (Copy)');
    final duration = widget.project.endDate.difference(widget.project.startDate);
    _startDate = DateTime.now();
    _endDate = DateTime.now().add(duration);
  }

  @override
  void dispose() { _name.dispose(); super.dispose(); }

  Future<void> _pickDate(bool isStart) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isStart ? _startDate : _endDate,
      firstDate: DateTime(2020), lastDate: DateTime(2035),
      builder: (c, child) => Theme(
        data: Theme.of(c).copyWith(colorScheme: const ColorScheme.light(primary: AppTheme.primary)),
        child: child!,
      ),
    );
    if (picked == null) return;
    setState(() { if (isStart) {
      _startDate = picked;
    } else {
      _endDate = picked;
    } });
  }

  Future<void> _clone() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final cloned = await ProjectService().clone(widget.project.id, {
        'name': _name.text.trim(),
        'startDate': _startDate.toIso8601String(),
        'endDate': _endDate.toIso8601String(),
        'cloneTasks': _cloneTasks,
        'cloneBudget': _cloneBudget,
        'cloneTeam': _cloneTeam,
        'cloneMilestones': _cloneMilestones,
        'cloneRisks': _cloneRisks,
      });
      if (!mounted) return;
      Navigator.pushReplacement(context,
          MaterialPageRoute(builder: (_) => ProjectDetailScreen(id: cloned.id)));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(title: const Text('Clone Project')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Source info
            Container(
              decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.primary.withOpacity(0.2))),
              padding: const EdgeInsets.all(12),
              child: Row(children: [
                const Icon(Icons.copy_outlined, size: 16, color: AppTheme.primary),
                const SizedBox(width: 8),
                Expanded(child: Text('Cloning: ${widget.project.name}',
                    style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w600))),
              ]),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'New Project Name'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null,
            ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _DateTile('Start Date', _startDate, () => _pickDate(true))),
              const SizedBox(width: 12),
              Expanded(child: _DateTile('End Date', _endDate, () => _pickDate(false))),
            ]),
            const SizedBox(height: 20),
            const Text('Include in clone', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.textSecondary)),
            const SizedBox(height: 8),
            _ToggleTile('Tasks', _cloneTasks, (v) => setState(() => _cloneTasks = v)),
            _ToggleTile('Budget & Categories', _cloneBudget, (v) => setState(() => _cloneBudget = v)),
            _ToggleTile('Team Members', _cloneTeam, (v) => setState(() => _cloneTeam = v)),
            _ToggleTile('Milestones', _cloneMilestones, (v) => setState(() => _cloneMilestones = v)),
            _ToggleTile('Risks', _cloneRisks, (v) => setState(() => _cloneRisks = v)),
            const SizedBox(height: 24),
            SizedBox(
              height: 48,
              child: ElevatedButton(
                onPressed: _saving ? null : _clone,
                child: _saving
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Clone Project'),
              ),
            ),
          ],
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppTheme.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
        const SizedBox(height: 2),
        Text(AppTheme.fmtDate(date), style: const TextStyle(fontSize: 13)),
      ]),
    ),
  );
}

class _ToggleTile extends StatelessWidget {
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _ToggleTile(this.label, this.value, this.onChanged);
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 6),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppTheme.border)),
    child: SwitchListTile(
      dense: true,
      title: Text(label, style: const TextStyle(fontSize: 13)),
      value: value,
      activeThumbColor: AppTheme.primary,
      onChanged: onChanged,
    ),
  );
}
