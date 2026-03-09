import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../../config/app_theme.dart';
import '../../services/resource_service.dart';
import '../employees/employee_detail_screen.dart';

class AllocationSummaryScreen extends StatefulWidget {
  const AllocationSummaryScreen({super.key});

  @override
  State<AllocationSummaryScreen> createState() => _AllocationSummaryScreenState();
}

class _AllocationSummaryScreenState extends State<AllocationSummaryScreen> {
  final _svc = ResourceService();
  List<EmployeeSummary> _summaries = [];
  List<ResourceAllocation> _allocations = [];
  bool _loading = true;
  String? _error;
  String _statusFilter = 'all';
  bool _exporting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([
        _svc.getEmployeeSummary(),
        _svc.getAllocations(),
      ]);
      final summaries = results[0] as List<EmployeeSummary>;
      summaries.sort((a, b) => b.utilizationPct.compareTo(a.utilizationPct));
      if (mounted) {
        setState(() {
          _summaries = summaries;
          _allocations = results[1] as List<ResourceAllocation>;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<EmployeeSummary> get _filtered {
    if (_statusFilter == 'all') return _summaries;
    return _summaries.where((s) => s.status == _statusFilter).toList();
  }

  int get _over => _summaries.where((s) => s.status == 'over').length;
  int get _full => _summaries.where((s) => s.status == 'full').length;
  int get _partial => _summaries.where((s) => s.status == 'partial').length;
  int get _available => _summaries.where((s) => s.status == 'available').length;

  Color _statusColor(String s) => switch (s) {
    'over' => AppTheme.red,
    'full' => AppTheme.amber,
    'partial' => AppTheme.blue,
    _ => AppTheme.green,
  };

  String _statusLabel(String s) => switch (s) {
    'over' => 'Over',
    'full' => 'Full',
    'partial' => 'Partial',
    _ => 'Free',
  };

  void _showExportSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Center(
              child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 16),
          const Align(
            alignment: Alignment.centerLeft,
            child: Text('Export Data',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(height: 4),
          const Align(
            alignment: Alignment.centerLeft,
            child: Text('Choose what to export as CSV',
                style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
          ),
          const SizedBox(height: 16),
          _exportOption(
            icon: Icons.people_outline,
            title: 'Employee Summary',
            subtitle: 'Name, position, booked/free hours, utilization, status',
            onTap: () { Navigator.pop(context); _exportSummary(); },
          ),
          const SizedBox(height: 10),
          _exportOption(
            icon: Icons.assignment_outlined,
            title: 'Raw Allocations',
            subtitle: 'Employee, project, role, hours/wk, dates, status, utilization',
            onTap: () { Navigator.pop(context); _exportAllocations(); },
          ),
        ]),
      ),
    );
  }

  Widget _exportOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          border: Border.all(color: AppTheme.border),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, size: 20, color: AppTheme.primary),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 2),
            Text(subtitle,
                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
          ])),
          const Icon(Icons.download_outlined, size: 18, color: AppTheme.textSecondary),
        ]),
      ),
    );
  }

  Future<void> _exportSummary() async {
    setState(() => _exporting = true);
    try {
      final buf = StringBuffer();
      buf.writeln('Name,Position,Department,Booked Hours,Free Hours,Utilization %,Status,Projects');
      for (final s in _summaries) {
        final projects = s.allocations.map((a) => a['project'] ?? '').join('; ');
        buf.writeln('"${s.name}","${s.position}","${s.department ?? ''}",${s.bookedHours},${s.freeHours},${s.utilizationPct},"${s.status}","$projects"');
      }
      await _shareFile(buf.toString(), 'allocation_summary.csv', 'Resource Allocation Summary');
    } catch (e) {
      _showError('Export failed: $e');
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  Future<void> _exportAllocations() async {
    setState(() => _exporting = true);
    try {
      final buf = StringBuffer();
      buf.writeln('Employee,Project,Role,Allocated Hours/wk,Start Date,End Date,Status,Priority,Utilization %,Billable Hours,Actual Hours');
      for (final a in _allocations) {
        buf.writeln('"${a.employeeName}","${a.projectName}","${a.role}",${a.allocatedHours.toStringAsFixed(0)},"${AppTheme.fmtDate(a.startDate)}","${AppTheme.fmtDate(a.endDate)}","${a.status}","${a.priority}",${a.utilizationPct.toStringAsFixed(0)},${a.billableHours.toStringAsFixed(0)},${a.actualHours.toStringAsFixed(0)}');
      }
      await _shareFile(buf.toString(), 'allocations.csv', 'Resource Allocations');
    } catch (e) {
      _showError('Export failed: $e');
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  Future<void> _shareFile(String content, String filename, String subject) async {
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$filename');
    await file.writeAsString(content);
    await Share.shareXFiles([XFile(file.path)], subject: subject);
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), backgroundColor: AppTheme.red));
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_error != null) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      Text(_error!, style: const TextStyle(color: AppTheme.red), textAlign: TextAlign.center),
      const SizedBox(height: 8),
      TextButton(onPressed: _load, child: const Text('Retry')),
    ]));

    final filtered = _filtered;
    final screenW = MediaQuery.of(context).size.width;
    final compact = screenW < 400;

    return Column(children: [
      Container(
        padding: EdgeInsets.fromLTRB(12, 10, 12, compact ? 6 : 8),
        color: Theme.of(context).cardColor,
        child: Column(children: [
          // Status filter chips
          Row(children: [
            _statChip('Over', '$_over', AppTheme.red, 'over', compact),
            const SizedBox(width: 5),
            _statChip('Full', '$_full', AppTheme.amber, 'full', compact),
            const SizedBox(width: 5),
            _statChip('Partial', '$_partial', AppTheme.blue, 'partial', compact),
            const SizedBox(width: 5),
            _statChip('Free', '$_available', AppTheme.green, 'available', compact),
          ]),
          const SizedBox(height: 8),
          Row(children: [
            _statChip('All', '${_summaries.length}', AppTheme.primary, 'all', compact),
            const Spacer(),
            // Avg utilization badge
            if (_summaries.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(6)),
                child: Text(
                  'Avg ${(_summaries.fold(0, (s, e) => s + e.utilizationPct) / _summaries.length).toStringAsFixed(0)}% util',
                  style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.primary),
                ),
              ),
              const SizedBox(width: 8),
            ],
            TextButton.icon(
              onPressed: _exporting ? null : _showExportSheet,
              icon: _exporting
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.download_outlined, size: 16),
              label: Text(compact ? 'Export' : 'Export CSV',
                  style: const TextStyle(fontSize: 12)),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              ),
            ),
          ]),
        ]),
      ),
      Expanded(
        child: filtered.isEmpty
            ? const Center(
                child: Text('No employees match this filter',
                    style: TextStyle(color: AppTheme.textSecondary)))
            : RefreshIndicator(
                onRefresh: _load,
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
                  itemCount: filtered.length,
                  itemBuilder: (_, i) => _summaryCard(filtered[i], screenW),
                ),
              ),
      ),
    ]);
  }

  Widget _statChip(String label, String value, Color color, String filterVal, bool compact) {
    final active = _statusFilter == filterVal;
    return GestureDetector(
      onTap: () => setState(() => _statusFilter = filterVal),
      child: Container(
        padding: EdgeInsets.symmetric(
            horizontal: compact ? 7 : 10, vertical: compact ? 4 : 5),
        decoration: BoxDecoration(
          color: active ? color : color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: active ? color : color.withOpacity(0.2)),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Text(value,
              style: TextStyle(
                  fontSize: compact ? 12 : 13,
                  fontWeight: FontWeight.w700,
                  color: active ? Colors.white : color)),
          const SizedBox(width: 3),
          Text(label,
              style: TextStyle(
                  fontSize: compact ? 9 : 11,
                  color: active
                      ? Colors.white.withOpacity(0.85)
                      : AppTheme.textSecondary)),
        ]),
      ),
    );
  }

  Widget _summaryCard(EmployeeSummary s, double screenW) {
    final color = _statusColor(s.status);
    final compact = screenW < 400;
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: EdgeInsets.all(compact ? 12 : 14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(
              child: GestureDetector(
                onTap: () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => EmployeeDetailScreen(id: s.id))),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(s.name,
                      style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: compact ? 13 : 14,
                          color: AppTheme.primary,
                          decoration: TextDecoration.underline)),
                  Text(
                      '${s.position}${s.department != null ? ' · ${s.department}' : ''}',
                      style: const TextStyle(
                          fontSize: 12, color: AppTheme.textSecondary)),
                ]),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6)),
              child: Text(_statusLabel(s.status),
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: color)),
            ),
          ]),
          const SizedBox(height: 10),
          // Utilization bar
          Stack(children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: (s.utilizationPct / 100).clamp(0.0, 1.0),
                minHeight: 7,
                backgroundColor: const Color(0xFFF3F4F6),
                valueColor: AlwaysStoppedAnimation(color),
              ),
            ),
          ]),
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 6, children: [
            _hoursChip('Booked', '${s.bookedHours}h', color),
            _hoursChip('Free', '${s.freeHours}h', AppTheme.green),
            _hoursChip('Util', '${s.utilizationPct}%', color),
          ]),
          if (s.allocations.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: s.allocations.map((a) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(4)),
                child: Text(
                    '${a['project'] ?? ''} · ${a['hours'] ?? 0}h',
                    style: const TextStyle(
                        fontSize: 10, color: AppTheme.textSecondary)),
              )).toList(),
            ),
          ],
        ]),
      ),
    );
  }

  Widget _hoursChip(String label, String value, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(6)),
        child: Column(children: [
          Text(value,
              style: TextStyle(
                  fontSize: 11, fontWeight: FontWeight.w700, color: color)),
          Text(label,
              style: const TextStyle(fontSize: 9, color: AppTheme.textMuted)),
        ]),
      );
}
