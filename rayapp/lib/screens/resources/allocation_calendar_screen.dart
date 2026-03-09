import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../config/app_theme.dart';
import '../../services/resource_service.dart';
import '../../services/employee_service.dart';
import '../../models/employee.dart';

class AllocationCalendarScreen extends StatefulWidget {
  const AllocationCalendarScreen({super.key});

  @override
  State<AllocationCalendarScreen> createState() => _AllocationCalendarScreenState();
}

class _AllocationCalendarScreenState extends State<AllocationCalendarScreen> {
  final _svc = ResourceService();
  final _empSvc = EmployeeService();

  List<ResourceAllocation> _allocations = [];
  List<Employee> _allEmployees = [];
  bool _loading = true;
  String? _error;

  CalendarFormat _format = CalendarFormat.month;
  DateTime _focusedDay = DateTime.now();
  DateTime _selectedDay = DateTime.now();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([_svc.getAllocations(), _empSvc.getAll()]);
      if (mounted) {
        setState(() {
          _allocations = results[0] as List<ResourceAllocation>;
          _allEmployees = (results[1] as List<Employee>).where((e) => e.status == 'active').toList();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  /// Allocations active on a given day
  List<ResourceAllocation> _allocationsForDay(DateTime day) {
    final d = DateTime(day.year, day.month, day.day);
    return _allocations.where((a) {
      final start = DateTime(a.startDate.year, a.startDate.month, a.startDate.day);
      final end = DateTime(a.endDate.year, a.endDate.month, a.endDate.day);
      return !d.isBefore(start) && !d.isAfter(end);
    }).toList();
  }

  bool _hasAllocations(DateTime day) => _allocationsForDay(day).isNotEmpty;

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_error != null) return Center(child: Text(_error!, style: const TextStyle(color: AppTheme.red)));

    final dayAllocations = _allocationsForDay(_selectedDay);

    return Column(children: [
      // Format toggle
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        child: Row(children: [
          const Text('View:', style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
          const SizedBox(width: 8),
          _fmtBtn('Month', CalendarFormat.month),
          const SizedBox(width: 6),
          _fmtBtn('2 Weeks', CalendarFormat.twoWeeks),
          const SizedBox(width: 6),
          _fmtBtn('Week', CalendarFormat.week),
          const Spacer(),
          Text('${_allocations.length} allocations', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        ]),
      ),
      TableCalendar(
        firstDay: DateTime.now().subtract(const Duration(days: 180)),
        lastDay: DateTime.now().add(const Duration(days: 365)),
        focusedDay: _focusedDay,
        calendarFormat: _format,
        selectedDayPredicate: (d) => isSameDay(d, _selectedDay),
        onDaySelected: (selected, focused) => setState(() {
          _selectedDay = selected;
          _focusedDay = focused;
        }),
        onFormatChanged: (f) => setState(() => _format = f),
        onPageChanged: (f) => _focusedDay = f,
        eventLoader: (day) => _allocationsForDay(day),
        calendarStyle: CalendarStyle(
          todayDecoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.3), shape: BoxShape.circle),
          selectedDecoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
          markerDecoration: const BoxDecoration(color: AppTheme.blue, shape: BoxShape.circle),
          markersMaxCount: 3,
          markerSize: 5,
          outsideDaysVisible: false,
        ),
        headerStyle: const HeaderStyle(
          formatButtonVisible: false,
          titleCentered: true,
          titleTextStyle: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
        ),
      ),
      const Divider(height: 1),
      // Selected day allocations
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
        child: Row(children: [
          Text(_fmtDate(_selectedDay), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
            decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
            child: Text('${dayAllocations.length}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primary)),
          ),
        ]),
      ),
      Expanded(
        child: dayAllocations.isEmpty
            ? const Center(child: Text('No allocations on this day', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)))
            : ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                itemCount: dayAllocations.length,
                itemBuilder: (_, i) => _allocationBlock(dayAllocations[i]),
              ),
      ),
    ]);
  }

  Widget _fmtBtn(String label, CalendarFormat fmt) {
    final active = _format == fmt;
    return GestureDetector(
      onTap: () => setState(() => _format = fmt),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: active ? AppTheme.primary : AppTheme.primary.withOpacity(0.08),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
            color: active ? Colors.white : AppTheme.primary)),
      ),
    );
  }

  Widget _allocationBlock(ResourceAllocation a) {
    final util = a.utilizationPct;
    final color = util > 80 ? AppTheme.red : util > 50 ? AppTheme.amber : AppTheme.green;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        dense: true,
        leading: CircleAvatar(
          radius: 18,
          backgroundColor: AppTheme.primary.withOpacity(0.1),
          child: Text(a.employeeName.isNotEmpty ? a.employeeName[0] : '?',
              style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w700, fontSize: 13)),
        ),
        title: Text(a.employeeName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        subtitle: Text(a.projectName, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
            child: Text('${util.toStringAsFixed(0)}%', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
          ),
          const SizedBox(width: 4),
          Icon(Icons.swap_horiz, size: 18, color: AppTheme.textSecondary),
        ]),
        onTap: () => _showReassignSheet(a),
      ),
    );
  }

  void _showReassignSheet(ResourceAllocation alloc) {
    // Employees not already on this project on this day
    final dayAllocs = _allocationsForDay(_selectedDay);
    final onProject = dayAllocs.where((a) => a.projectId == alloc.projectId).map((a) => a.employeeId).toSet();
    final candidates = _allEmployees.where((e) => !onProject.contains(e.id)).toList();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => _ReassignSheet(
        allocation: alloc,
        candidates: candidates,
        onReassign: (emp) {
          // Client-side optimistic update: swap employee on this allocation
          setState(() {
            final idx = _allocations.indexOf(alloc);
            if (idx != -1) {
              _allocations[idx] = ResourceAllocation(
                employeeId: emp.id,
                employeeName: emp.fullName,
                projectId: alloc.projectId,
                projectName: alloc.projectName,
                startDate: alloc.startDate,
                endDate: alloc.endDate,
                utilizationPct: alloc.utilizationPct,
              );
            }
          });
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Reassigned to ${emp.fullName} — save in project settings to persist'),
                duration: const Duration(seconds: 3)),
          );
        },
      ),
    );
  }

  String _fmtDate(DateTime d) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return '${days[d.weekday - 1]}, ${d.day} ${months[d.month - 1]} ${d.year}';
  }
}

class _ReassignSheet extends StatefulWidget {
  final ResourceAllocation allocation;
  final List<Employee> candidates;
  final ValueChanged<Employee> onReassign;

  const _ReassignSheet({required this.allocation, required this.candidates, required this.onReassign});

  @override
  State<_ReassignSheet> createState() => _ReassignSheetState();
}

class _ReassignSheetState extends State<_ReassignSheet> {
  final _ctrl = TextEditingController();
  String _q = '';

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final filtered = widget.candidates.where((e) =>
        e.fullName.toLowerCase().contains(_q) ||
        e.position.toLowerCase().contains(_q) ||
        (e.department ?? '').toLowerCase().contains(_q)).toList();

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const SizedBox(height: 12),
        Container(width: 36, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Reassign: ${widget.allocation.projectName}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
            Text('Currently: ${widget.allocation.employeeName}', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
            const SizedBox(height: 10),
            TextField(
              controller: _ctrl,
              onChanged: (v) => setState(() => _q = v.toLowerCase()),
              decoration: InputDecoration(
                hintText: 'Search employee…',
                prefixIcon: const Icon(Icons.search, size: 18),
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 8),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
              style: const TextStyle(fontSize: 13),
            ),
          ]),
        ),
        const SizedBox(height: 8),
        ConstrainedBox(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.4),
          child: filtered.isEmpty
              ? const Padding(padding: EdgeInsets.all(24), child: Text('No available employees', style: TextStyle(color: AppTheme.textSecondary)))
              : ListView.builder(
                  shrinkWrap: true,
                  itemCount: filtered.length,
                  itemBuilder: (_, i) {
                    final e = filtered[i];
                    return ListTile(
                      dense: true,
                      leading: CircleAvatar(
                        radius: 16,
                        backgroundColor: AppTheme.primary.withOpacity(0.1),
                        child: Text(e.firstName.isNotEmpty ? e.firstName[0] : '?',
                            style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w700, fontSize: 12)),
                      ),
                      title: Text(e.fullName, style: const TextStyle(fontSize: 13)),
                      subtitle: Text('${e.position}${e.department != null ? ' · ${e.department}' : ''}',
                          style: const TextStyle(fontSize: 11)),
                      onTap: () => widget.onReassign(e),
                    );
                  },
                ),
        ),
        const SizedBox(height: 16),
      ]),
    );
  }
}
