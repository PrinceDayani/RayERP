import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/resource_service.dart';
import '../employees/employee_detail_screen.dart';
import 'allocation_form_screen.dart';

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
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _svc.getConflicts();
      if (mounted) setState(() { _conflicts = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Color _severityColor(String s) => switch (s.toUpperCase()) {
    'CRITICAL' => AppTheme.red,
    'HIGH' => const Color(0xFFEA580C),
    'MEDIUM' => AppTheme.amber,
    _ => AppTheme.blue,
  };

  /// Resolve a conflict allocation map to a ResourceAllocation by fetching
  /// from the real API (the conflict payload contains allocation IDs).
  Future<ResourceAllocation?> _resolveAllocation(
      Map<String, dynamic>? allocMap) async {
    if (allocMap == null) return null;
    final id = allocMap['_id'] ?? allocMap['id'];
    if (id == null || id.toString().isEmpty) return null;
    try {
      final all = await _svc.getAllocations();
      return all.firstWhere((a) => a.id == id.toString());
    } catch (_) {
      return null;
    }
  }

  Future<void> _openEdit(Map<String, dynamic>? allocMap) async {
    final alloc = await _resolveAllocation(allocMap);
    if (!mounted) return;
    if (alloc == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Could not load allocation details'),
            backgroundColor: AppTheme.red),
      );
      return;
    }
    final result = await Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_) => AllocationFormScreen(existing: alloc)));
    if (result == true && mounted) _load();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    }
    if (_error != null) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.error_outline, color: AppTheme.red, size: 40),
        const SizedBox(height: 8),
        Text(_error!,
            style: const TextStyle(color: AppTheme.red),
            textAlign: TextAlign.center),
        const SizedBox(height: 12),
        TextButton(onPressed: _load, child: const Text('Retry')),
      ]));
    }

    if (_conflicts.isEmpty) {
      return const Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.check_circle_outline, size: 48, color: AppTheme.green),
        SizedBox(height: 12),
        Text('No conflicts detected',
            style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppTheme.green)),
        SizedBox(height: 4),
        Text('All resource allocations look healthy',
            style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
      ]));
    }

    final screenW = MediaQuery.of(context).size.width;

    return Column(children: [
      Padding(
        padding: EdgeInsets.fromLTRB(screenW < 400 ? 12 : 16, 12,
            screenW < 400 ? 12 : 16, 4),
        child: Row(children: [
          Expanded(
            child: Text(
              '${_conflicts.length} employee${_conflicts.length > 1 ? 's' : ''} with conflicts',
              style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.red),
            ),
          ),
          TextButton.icon(
            onPressed: _load,
            icon: const Icon(Icons.refresh, size: 16),
            label: const Text('Refresh', style: TextStyle(fontSize: 12)),
          ),
        ]),
      ),
      Expanded(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView.builder(
            padding: EdgeInsets.fromLTRB(
                screenW < 400 ? 12 : 16,
                0,
                screenW < 400 ? 12 : 16,
                16),
            itemCount: _conflicts.length,
            itemBuilder: (_, i) => _conflictCard(_conflicts[i], screenW),
          ),
        ),
      ),
    ]);
  }

  Widget _conflictCard(ResourceConflict c, double screenW) {
    final compact = screenW < 400;
    final firstConflict =
        c.conflicts.isNotEmpty ? c.conflicts[0] : <String, dynamic>{};
    final severity = firstConflict['severity'] ?? 'medium';
    final color = _severityColor(severity.toString());
    final conflictType =
        (firstConflict['conflictType'] ?? 'over_allocation')
            .toString()
            .replaceAll('_', ' ');
    final alloc1 = firstConflict['allocation1'] as Map<String, dynamic>?;
    final alloc2 = firstConflict['allocation2'] as Map<String, dynamic>?;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: color.withOpacity(0.4)),
      ),
      child: Padding(
        padding: EdgeInsets.all(compact ? 12 : 14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Header
          Row(children: [
            Expanded(
              child: GestureDetector(
                onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) =>
                            EmployeeDetailScreen(id: c.employeeId))),
                child: Text(c.employeeName,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        color: AppTheme.primary,
                        decoration: TextDecoration.underline)),
              ),
            ),
            _badge(severity.toString().toUpperCase(), color),
          ]),
          const SizedBox(height: 6),
          Row(children: [
            Icon(Icons.warning_amber_rounded, size: 14, color: color),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                '${c.totalConflicts} conflict${c.totalConflicts > 1 ? 's' : ''} · $conflictType',
                style: TextStyle(
                    fontSize: 12,
                    color: color,
                    fontWeight: FontWeight.w600),
              ),
            ),
          ]),
          if (c.totalOverallocation > 0) ...[
            const SizedBox(height: 4),
            Text(
              'Over-allocated by ${c.totalOverallocation.toStringAsFixed(0)}h',
              style: const TextStyle(fontSize: 12, color: AppTheme.red),
            ),
          ],
          // Conflicting allocation boxes
          if (alloc1 != null && alloc2 != null) ...[
            const SizedBox(height: 10),
            const Text('Conflicting Allocations',
                style: TextStyle(
                    fontSize: 11,
                    color: AppTheme.textSecondary,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Row(children: [
              Expanded(child: _allocBox(alloc1, color)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: Icon(Icons.compare_arrows,
                    size: 18, color: AppTheme.textMuted),
              ),
              Expanded(child: _allocBox(alloc2, color)),
            ]),
          ],
          const SizedBox(height: 12),
          // Action buttons — wired to real navigation
          compact
              ? Column(children: [
                  _actionRow(alloc1, alloc2, color),
                  const SizedBox(height: 6),
                  _viewEmployeeBtn(c),
                ])
              : Column(children: [
                  _actionRow(alloc1, alloc2, color),
                  const SizedBox(height: 8),
                  _viewEmployeeBtn(c),
                ]),
        ]),
      ),
    );
  }

  Widget _actionRow(
      Map<String, dynamic>? alloc1,
      Map<String, dynamic>? alloc2,
      Color color) {
    return Row(children: [
      Expanded(
        child: _actionBtn(
          'Reassign',
          Icons.swap_horiz,
          AppTheme.blue,
          alloc1 != null ? () => _openEdit(alloc1) : null,
        ),
      ),
      const SizedBox(width: 6),
      Expanded(
        child: _actionBtn(
          'Adjust Hours',
          Icons.tune,
          AppTheme.amber,
          alloc1 != null ? () => _openEdit(alloc1) : null,
        ),
      ),
      const SizedBox(width: 6),
      Expanded(
        child: _actionBtn(
          'Reschedule',
          Icons.event,
          AppTheme.green,
          alloc2 != null ? () => _openEdit(alloc2) : null,
        ),
      ),
    ]);
  }

  Widget _viewEmployeeBtn(ResourceConflict c) => SizedBox(
        width: double.infinity,
        child: OutlinedButton.icon(
          onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (_) => EmployeeDetailScreen(id: c.employeeId))),
          icon: const Icon(Icons.person_outline, size: 14),
          label: const Text('View Employee Details',
              style: TextStyle(fontSize: 12)),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 8),
            side: BorderSide(color: AppTheme.primary.withOpacity(0.4)),
            foregroundColor: AppTheme.primary,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
          ),
        ),
      );

  Widget _allocBox(Map<String, dynamic> alloc, Color borderColor) {
    final proj = alloc['project'];
    final projName =
        proj is Map ? (proj['name'] ?? '') : proj?.toString() ?? '';
    final hours = (alloc['allocatedHours'] ?? 0).toDouble();
    final start = alloc['startDate'] != null
        ? DateTime.tryParse(alloc['startDate'])
        : null;
    final end =
        alloc['endDate'] != null ? DateTime.tryParse(alloc['endDate']) : null;
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: borderColor.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: borderColor.withOpacity(0.2)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(projName,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            overflow: TextOverflow.ellipsis),
        if (start != null && end != null)
          Text('${_fmt(start)} – ${_fmt(end)}',
              style: const TextStyle(
                  fontSize: 10, color: AppTheme.textMuted)),
        Text('${hours.toStringAsFixed(0)}h/wk',
            style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppTheme.textSecondary)),
      ]),
    );
  }

  Widget _badge(String label, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(6)),
        child: Text(label,
            style: TextStyle(
                fontSize: 11, fontWeight: FontWeight.w700, color: color)),
      );

  Widget _actionBtn(
      String label, IconData icon, Color color, VoidCallback? onTap) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 13, color: onTap != null ? color : AppTheme.textMuted),
      label: Text(label,
          style: TextStyle(
              fontSize: 11,
              color: onTap != null ? color : AppTheme.textMuted)),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 6),
        side: BorderSide(
            color: onTap != null
                ? color.withOpacity(0.4)
                : AppTheme.border),
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      ),
    );
  }

  String _fmt(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year.toString().substring(2)}';
}
