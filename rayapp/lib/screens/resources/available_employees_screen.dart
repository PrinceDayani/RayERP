import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/resource_service.dart';
import '../../services/employee_service.dart';
import '../../models/employee.dart';

class AvailableEmployeesScreen extends StatefulWidget {
  final List<ResourceAllocation> allocations;
  const AvailableEmployeesScreen({super.key, required this.allocations});

  @override
  State<AvailableEmployeesScreen> createState() => _AvailableEmployeesScreenState();
}

class _AvailableEmployeesScreenState extends State<AvailableEmployeesScreen> {
  final _empSvc = EmployeeService();
  List<Employee> _all = [];
  bool _loading = true;
  String _deptFilter = 'All';
  String _rangeFilter = 'Now';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final emps = await _empSvc.getAll();
      if (mounted) setState(() { _all = emps.where((e) => e.status == 'active').toList(); _loading = false; });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Set<String> get _allocatedNow {
    final now = DateTime.now();
    final rangeEnd = _rangeFilter == 'Next 30d'
        ? now.add(const Duration(days: 30))
        : _rangeFilter == 'Next 90d'
            ? now.add(const Duration(days: 90))
            : now;
    return widget.allocations
        .where((a) => a.startDate.isBefore(rangeEnd) && a.endDate.isAfter(now))
        .map((a) => a.employeeId)
        .toSet();
  }

  List<Employee> get _available {
    final allocated = _allocatedNow;
    return _all.where((e) {
      if (allocated.contains(e.id)) return false;
      if (_deptFilter != 'All' && (e.department ?? '') != _deptFilter) return false;
      return true;
    }).toList();
  }

  List<String> get _departments {
    final depts = {'All'};
    for (final e in _all) {
      if ((e.department ?? '').isNotEmpty) depts.add(e.department!);
    }
    return depts.toList();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));

    final available = _available;

    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        child: Row(children: [
          Expanded(child: _dropdown('Department', _departments, _deptFilter, (v) => setState(() => _deptFilter = v!))),
          const SizedBox(width: 10),
          Expanded(child: _dropdown('Time Range', const ['Now', 'Next 30d', 'Next 90d'], _rangeFilter, (v) => setState(() => _rangeFilter = v!))),
        ]),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(children: [
          Text('${available.length} available', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.green)),
          const Spacer(),
          Text('of ${_all.length} active', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        ]),
      ),
      Expanded(
        child: available.isEmpty
            ? const Center(child: Text('No available employees', style: TextStyle(color: AppTheme.textSecondary)))
            : GridView.builder(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2, crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 1.4),
                itemCount: available.length,
                itemBuilder: (_, i) => _empCard(available[i]),
              ),
      ),
    ]);
  }

  Widget _empCard(Employee e) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: AppTheme.primary.withOpacity(0.12),
              child: Text(e.firstName.isNotEmpty ? e.firstName[0] : '?',
                  style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w700, fontSize: 14)),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: AppTheme.greenBg, borderRadius: BorderRadius.circular(8)),
              child: const Text('Free', style: TextStyle(fontSize: 10, color: AppTheme.green, fontWeight: FontWeight.w700)),
            ),
          ]),
          const SizedBox(height: 8),
          Text(e.fullName, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
          Text(e.position, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary), overflow: TextOverflow.ellipsis),
          if ((e.department ?? '').isNotEmpty)
            Text(e.department!, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted), overflow: TextOverflow.ellipsis),
        ]),
      ),
    );
  }

  Widget _dropdown(String hint, List<String> items, String value, ValueChanged<String?> onChanged) {
    return DropdownButtonFormField<String>(
      value: value,
      decoration: InputDecoration(labelText: hint, contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
      items: items.map((d) => DropdownMenuItem(value: d, child: Text(d, style: const TextStyle(fontSize: 13)))).toList(),
      onChanged: onChanged,
    );
  }
}
