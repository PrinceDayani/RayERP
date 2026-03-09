import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/resource_service.dart';
import '../employees/employee_detail_screen.dart';

class CapacityPlanningScreen extends StatefulWidget {
  const CapacityPlanningScreen({super.key});

  @override
  State<CapacityPlanningScreen> createState() => _CapacityPlanningScreenState();
}

class _CapacityPlanningScreenState extends State<CapacityPlanningScreen> {
  final _svc = ResourceService();
  List<EmployeeCapacity> _capacities = [];
  bool _loading = true;
  String? _error;
  String _roleFilter = 'All';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final now = DateTime.now();
      final data = await _svc.getCapacities(
        startDate: now.toIso8601String(),
        endDate: now.add(const Duration(days: 90)).toIso8601String(),
      );
      if (mounted) setState(() { _capacities = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<String> get _roles {
    final roles = {'All'};
    for (final c in _capacities) roles.add(c.position);
    return roles.toList();
  }

  List<EmployeeCapacity> get _filtered {
    if (_roleFilter == 'All') return _capacities;
    return _capacities.where((c) => c.position == _roleFilter).toList();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_error != null) return Center(child: Text(_error!, style: const TextStyle(color: AppTheme.red)));

    final filtered = _filtered;
    final overAllocated = filtered.where((c) => c.utilizationPct > 100).length;
    final available = filtered.where((c) => c.utilizationPct < 50).length;

    return Column(children: [
      // Summary bar
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        color: Theme.of(context).cardColor,
        child: Row(children: [
          _summaryChip('Total', '${filtered.length}', AppTheme.blue),
          const SizedBox(width: 10),
          _summaryChip('Over-allocated', '$overAllocated', AppTheme.red),
          const SizedBox(width: 10),
          _summaryChip('Available', '$available', AppTheme.green),
        ]),
      ),
      // Role filter
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
        child: DropdownButtonFormField<String>(
          value: _roleFilter,
          decoration: const InputDecoration(labelText: 'Role', contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
          items: _roles.map((r) => DropdownMenuItem(value: r, child: Text(r, style: const TextStyle(fontSize: 13)))).toList(),
          onChanged: (v) => setState(() => _roleFilter = v!),
        ),
      ),
      const SizedBox(height: 8),
      Expanded(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            itemCount: filtered.length,
            itemBuilder: (_, i) => _capacityCard(filtered[i]),
          ),
        ),
      ),
    ]);
  }

  Widget _capacityCard(EmployeeCapacity cap) {
    final util = cap.utilizationPct;
    final color = util > 100 ? AppTheme.red : util > 80 ? AppTheme.amber : AppTheme.green;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            GestureDetector(
              onTap: () => Navigator.push(context, MaterialPageRoute(
                  builder: (_) => EmployeeDetailScreen(id: cap.employeeId))),
              child: CircleAvatar(
                radius: 16,
                backgroundColor: AppTheme.primary.withOpacity(0.1),
                child: Text(cap.employeeName.isNotEmpty ? cap.employeeName[0] : '?',
                    style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w700, fontSize: 13)),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(cap.employeeName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              Text('${cap.position}${cap.department != null ? ' · ${cap.department}' : ''}',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
            ])),
            Text('${util.toStringAsFixed(0)}%', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: color)),
          ]),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (util / 100).clamp(0.0, 1.0),
              minHeight: 8,
              backgroundColor: const Color(0xFFF3F4F6),
              valueColor: AlwaysStoppedAnimation(color),
            ),
          ),
          const SizedBox(height: 8),
          Row(children: [
            _hoursChip('Allocated', '${cap.allocated}h/wk', color),
            const SizedBox(width: 8),
            _hoursChip('Available', '${cap.available}h/wk', AppTheme.green),
            const SizedBox(width: 8),
            _hoursChip('Capacity', '${cap.capacity}h/wk', AppTheme.blue),
          ]),
          if (cap.allocations.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(spacing: 6, runSpacing: 4, children: cap.allocations.map((a) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(color: const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(4)),
              child: Text('${a['project'] is Map ? a['project']['name'] : a['project'] ?? ''} · ${a['hours'] ?? 0}h',
                  style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
            )).toList()),
          ],
        ]),
      ),
    );
  }

  Widget _summaryChip(String label, String value, Color color) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
      child: Column(children: [
        Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: color)),
        Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
      ]),
    ),
  );

  Widget _hoursChip(String label, String value, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(6)),
    child: Column(children: [
      Text(value, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
      Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textMuted)),
    ]),
  );
}
