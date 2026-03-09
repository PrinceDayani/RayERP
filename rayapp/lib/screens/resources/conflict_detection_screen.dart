import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/resource_service.dart';
import '../employees/employee_detail_screen.dart';

class ConflictDetectionScreen extends StatefulWidget {
  const ConflictDetectionScreen({super.key});

  @override
  State<ConflictDetectionScreen> createState() => _ConflictDetectionScreenState();
}

class _ConflictDetectionScreenState extends State<ConflictDetectionScreen> {
  final _svc = ResourceService();
  List<ResourceConflict> _conflicts = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _svc.getConflicts();
      if (mounted) setState(() { _conflicts = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Color _severityColor(String s) => switch (s) {
    'CRITICAL' => AppTheme.red,
    'HIGH' => const Color(0xFFEA580C),
    'MEDIUM' => AppTheme.amber,
    _ => AppTheme.blue,
  };

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_error != null) return Center(child: Text(_error!, style: const TextStyle(color: AppTheme.red)));

    if (_conflicts.isEmpty) {
      return const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.check_circle_outline, size: 48, color: AppTheme.green),
        SizedBox(height: 12),
        Text('No conflicts detected', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.green)),
        SizedBox(height: 4),
        Text('All resource allocations look healthy', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
      ]));
    }

    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
        child: Row(children: [
          Text('${_conflicts.length} conflict${_conflicts.length > 1 ? 's' : ''} found',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.red)),
          const Spacer(),
          TextButton.icon(
            onPressed: _load,
            icon: const Icon(Icons.refresh, size: 16),
            label: const Text('Refresh', style: TextStyle(fontSize: 12)),
          ),
        ]),
      ),
      Expanded(
        child: ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          itemCount: _conflicts.length,
          itemBuilder: (_, i) => _conflictCard(_conflicts[i]),
        ),
      ),
    ]);
  }

  Widget _conflictCard(ResourceConflict c) {
    final color = _severityColor(c.severity);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: color.withOpacity(0.4)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Header
          Row(children: [
            Expanded(child: GestureDetector(
              onTap: () => Navigator.push(context, MaterialPageRoute(
                  builder: (_) => EmployeeDetailScreen(id: c.employeeId))),
              child: Text(c.employeeName, style: const TextStyle(
                  fontWeight: FontWeight.w700, fontSize: 14,
                  color: AppTheme.primary, decoration: TextDecoration.underline)),
            )),
            _badge(c.severity, color),
          ]),
          const SizedBox(height: 6),
          Row(children: [
            Icon(Icons.warning_amber_rounded, size: 14, color: color),
            const SizedBox(width: 4),
            Text(c.type, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600)),
          ]),
          const SizedBox(height: 10),
          // Side-by-side project comparison
          if (c.conflictingProjects.length >= 2) ...[
            const Text('Conflicting Allocations', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Row(children: [
              Expanded(child: _projectBox(c.conflictingProjects[0], color, c.type)),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 6),
                child: Icon(Icons.compare_arrows, size: 18, color: AppTheme.textMuted),
              ),
              Expanded(child: _projectBox(c.conflictingProjects[1], color, c.type)),
            ]),
            if (c.type == 'Time Overlap' && c.overlapDays > 0) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: color.withOpacity(0.06), borderRadius: BorderRadius.circular(6)),
                child: Row(children: [
                  Icon(Icons.calendar_today, size: 12, color: color),
                  const SizedBox(width: 6),
                  Text('${c.overlapDays} overlap days', style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600)),
                  const SizedBox(width: 12),
                  Icon(Icons.access_time, size: 12, color: color),
                  const SizedBox(width: 4),
                  Text('${c.totalConflictHours.toStringAsFixed(0)}h conflicting', style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600)),
                ]),
              ),
            ],
          ] else if (c.conflictingProjects.isNotEmpty) ...[
            const Text('Over-allocated on', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
            const SizedBox(height: 4),
            Wrap(spacing: 6, runSpacing: 4, children: c.conflictingProjects.map((p) =>
              _projectBox(p, color, c.type)).toList()),
          ],
          const SizedBox(height: 12),
          // Resolution actions
          Row(children: [
            _actionBtn('Reassign', Icons.swap_horiz, AppTheme.blue),
            const SizedBox(width: 6),
            _actionBtn('Adjust Hours', Icons.tune, AppTheme.amber),
            const SizedBox(width: 6),
            _actionBtn('Reschedule', Icons.event, AppTheme.green),
          ]),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => Navigator.push(context, MaterialPageRoute(
                  builder: (_) => EmployeeDetailScreen(id: c.employeeId))),
              icon: const Icon(Icons.person_outline, size: 14),
              label: const Text('View Employee Details', style: TextStyle(fontSize: 12)),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 8),
                side: BorderSide(color: AppTheme.primary.withOpacity(0.4)),
                foregroundColor: AppTheme.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _projectBox(ProjectWithAlloc p, Color borderColor, String conflictType) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: borderColor.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: borderColor.withOpacity(0.2)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(p.projectName, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
        const SizedBox(height: 2),
        Text('${_fmt(p.startDate)} – ${_fmt(p.endDate)}', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
        Text('${p.allocatedHoursPerWeek.toStringAsFixed(0)}h/wk', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
      ]),
    );
  }

  Widget _badge(String label, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
    child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
  );

  Widget _actionBtn(String label, IconData icon, Color color) => Expanded(
    child: OutlinedButton.icon(
      onPressed: () => _showActionSnackbar(label),
      icon: Icon(icon, size: 13, color: color),
      label: Text(label, style: TextStyle(fontSize: 11, color: color)),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 6),
        side: BorderSide(color: color.withOpacity(0.4)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      ),
    ),
  );

  void _showActionSnackbar(String action) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$action — navigate to project to apply changes'), duration: const Duration(seconds: 2)),
    );
  }

  String _fmt(DateTime d) => '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year.toString().substring(2)}';
}
