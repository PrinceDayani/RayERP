import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/resource_service.dart';
import 'allocation_form_screen.dart';

class WorkloadTimelineScreen extends StatefulWidget {
  final List<ResourceAllocation> allocations;
  const WorkloadTimelineScreen({super.key, required this.allocations});

  @override
  State<WorkloadTimelineScreen> createState() => _WorkloadTimelineScreenState();
}

class _WorkloadTimelineScreenState extends State<WorkloadTimelineScreen> {
  // Gantt window: today − 14 days → today + 76 days (90-day window)
  late DateTime _windowStart;
  late DateTime _windowEnd;
  final int _totalDays = 90;

  // Linked horizontal scroll for header + rows
  final _hScroll = ScrollController();
  final _hScrollHeader = ScrollController();

  static const double _nameColW = 130;
  static const double _rowH = 48;
  static const double _headerH = 36;
  static const double _minDayPx = 10; // min px per day
  static const double _maxDayPx = 28; // max px per day

  String _empFilter = '';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _windowStart = DateTime(now.year, now.month, now.day).subtract(const Duration(days: 14));
    _windowEnd = _windowStart.add(Duration(days: _totalDays));
    _hScroll.addListener(() {
      if (_hScrollHeader.hasClients && _hScrollHeader.offset != _hScroll.offset) {
        _hScrollHeader.jumpTo(_hScroll.offset);
      }
    });
  }

  @override
  void dispose() {
    _hScroll.dispose();
    _hScrollHeader.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  // Unique employees that have at least one allocation in window
  List<String> get _employeeIds {
    final seen = <String>{};
    final ids = <String>[];
    for (final a in widget.allocations) {
      if (!seen.contains(a.employeeId)) {
        seen.add(a.employeeId);
        ids.add(a.employeeId);
      }
    }
    return ids;
  }

  String _empName(String id) {
    try {
      return widget.allocations.firstWhere((a) => a.employeeId == id).employeeName;
    } catch (_) {
      return id;
    }
  }

  List<ResourceAllocation> _allocsFor(String empId) =>
      widget.allocations.where((a) => a.employeeId == empId).toList();

  List<String> get _filteredIds {
    final q = _empFilter.toLowerCase();
    return _employeeIds.where((id) {
      if (q.isEmpty) return true;
      return _empName(id).toLowerCase().contains(q);
    }).toList();
  }

  Color _barColor(ResourceAllocation a) {
    final u = a.utilizationPct;
    if (u > 100) return AppTheme.red;
    if (u > 80) return AppTheme.amber;
    return AppTheme.primary;
  }

  // Clamp allocation to window, return null if outside
  ({double left, double width})? _barGeometry(ResourceAllocation a, double dayPx) {
    final start = a.startDate.isAfter(_windowStart) ? a.startDate : _windowStart;
    final end = a.endDate.isBefore(_windowEnd) ? a.endDate : _windowEnd;
    if (!start.isBefore(end)) return null;
    final left = start.difference(_windowStart).inDays * dayPx;
    final width = (end.difference(start).inDays).clamp(1, _totalDays) * dayPx;
    return (left: left, width: width);
  }

  double _todayLeft(double dayPx) =>
      DateTime.now().difference(_windowStart).inDays.toDouble() * dayPx;

  @override
  Widget build(BuildContext context) {
    final screenW = MediaQuery.of(context).size.width;
    // Responsive: available width for gantt area minus name col
    final ganttAreaW = screenW - _nameColW;
    // dayPx: fit window in available width, clamped
    final dayPx = (ganttAreaW / _totalDays).clamp(_minDayPx, _maxDayPx);
    final totalGanttW = dayPx * _totalDays;

    final ids = _filteredIds;

    return Column(children: [
      _buildToolbar(screenW),
      _buildHeader(totalGanttW, dayPx),
      const Divider(height: 1),
      Expanded(
        child: ids.isEmpty
            ? const Center(
                child: Text('No allocations found',
                    style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)))
            : _buildRows(ids, totalGanttW, dayPx),
      ),
      _buildLegend(screenW),
    ]);
  }

  Widget _buildToolbar(double screenW) {
    final compact = screenW < 480;
    return Container(
      color: Theme.of(context).cardColor,
      padding: EdgeInsets.fromLTRB(12, 8, 12, compact ? 6 : 8),
      child: Row(children: [
        Expanded(
          child: TextField(
            controller: _searchCtrl,
            onChanged: (v) => setState(() => _empFilter = v),
            style: const TextStyle(fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Filter by employee…',
              prefixIcon: const Icon(Icons.search, size: 16),
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
        ),
        const SizedBox(width: 8),
        _windowBtn(Icons.chevron_left, () => setState(() {
          _windowStart = _windowStart.subtract(const Duration(days: 30));
          _windowEnd = _windowStart.add(Duration(days: _totalDays));
        })),
        const SizedBox(width: 4),
        GestureDetector(
          onTap: () => setState(() {
            final now = DateTime.now();
            _windowStart = DateTime(now.year, now.month, now.day).subtract(const Duration(days: 14));
            _windowEnd = _windowStart.add(Duration(days: _totalDays));
          }),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text('Today',
                style: TextStyle(
                    fontSize: compact ? 10 : 11,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.primary)),
          ),
        ),
        const SizedBox(width: 4),
        _windowBtn(Icons.chevron_right, () => setState(() {
          _windowStart = _windowStart.add(const Duration(days: 30));
          _windowEnd = _windowStart.add(Duration(days: _totalDays));
        })),
      ]),
    );
  }

  Widget _windowBtn(IconData icon, VoidCallback onTap) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(6),
        child: Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            border: Border.all(color: AppTheme.border),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(icon, size: 16, color: AppTheme.textSecondary),
        ),
      );

  Widget _buildHeader(double totalGanttW, double dayPx) {
    // Build month + day markers
    final months = <({int offset, String label, int days})>[];
    DateTime cur = _windowStart;
    while (cur.isBefore(_windowEnd)) {
      final monthEnd = DateTime(cur.year, cur.month + 1, 1);
      final end = monthEnd.isBefore(_windowEnd) ? monthEnd : _windowEnd;
      final days = end.difference(cur).inDays;
      months.add((
        offset: cur.difference(_windowStart).inDays,
        label: '${_monthLabel(cur.month)} ${cur.year}',
        days: days,
      ));
      cur = monthEnd;
    }

    final todayOff = _todayLeft(dayPx);

    return SizedBox(
      height: _headerH,
      child: Row(children: [
        // Pinned name header
        Container(
          width: _nameColW,
          height: _headerH,
          color: Theme.of(context).cardColor,
          padding: const EdgeInsets.only(left: 12),
          alignment: Alignment.centerLeft,
          child: const Text('Employee',
              style: TextStyle(
                  fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textSecondary)),
        ),
        // Scrollable month headers
        Expanded(
          child: SingleChildScrollView(
            controller: _hScrollHeader,
            scrollDirection: Axis.horizontal,
            physics: const NeverScrollableScrollPhysics(),
            child: SizedBox(
              width: totalGanttW,
              height: _headerH,
              child: Stack(children: [
                // Month labels
                ...months.map((m) => Positioned(
                      left: m.offset * dayPx,
                      width: m.days * dayPx,
                      top: 0,
                      height: _headerH,
                      child: Container(
                        decoration: BoxDecoration(
                          border: Border(
                            left: BorderSide(color: AppTheme.border.withOpacity(0.6)),
                          ),
                        ),
                        padding: const EdgeInsets.only(left: 6),
                        alignment: Alignment.centerLeft,
                        child: Text(m.label,
                            style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.textSecondary),
                            overflow: TextOverflow.ellipsis),
                      ),
                    )),
                // Today marker line in header
                if (todayOff >= 0 && todayOff <= totalGanttW)
                  Positioned(
                    left: todayOff - 1,
                    top: 0,
                    bottom: 0,
                    child: Container(width: 2, color: AppTheme.primary.withOpacity(0.6)),
                  ),
              ]),
            ),
          ),
        ),
      ]),
    );
  }

  Widget _buildRows(List<String> ids, double totalGanttW, double dayPx) {
    final todayOff = _todayLeft(dayPx);
    return SingleChildScrollView(
      scrollDirection: Axis.vertical,
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Pinned name column
        SizedBox(
          width: _nameColW,
          child: Column(
            children: ids.map((id) => _nameCell(id)).toList(),
          ),
        ),
        // Scrollable gantt area
        Expanded(
          child: SingleChildScrollView(
            controller: _hScroll,
            scrollDirection: Axis.horizontal,
            child: SizedBox(
              width: totalGanttW,
              child: Stack(children: [
                // Background grid lines (month boundaries)
                ..._monthBoundaries(dayPx, totalGanttW, ids.length),
                // Today vertical line
                if (todayOff >= 0 && todayOff <= totalGanttW)
                  Positioned(
                    left: todayOff - 1,
                    top: 0,
                    bottom: 0,
                    child: Container(width: 2, color: AppTheme.primary.withOpacity(0.25)),
                  ),
                // Employee rows
                Column(
                  children: ids.asMap().entries.map((entry) {
                    final i = entry.key;
                    final id = entry.value;
                    return _ganttRow(id, i, totalGanttW, dayPx);
                  }).toList(),
                ),
              ]),
            ),
          ),
        ),
      ]),
    );
  }

  List<Widget> _monthBoundaries(double dayPx, double totalW, int rowCount) {
    final lines = <Widget>[];
    DateTime cur = DateTime(_windowStart.year, _windowStart.month + 1, 1);
    while (cur.isBefore(_windowEnd)) {
      final left = cur.difference(_windowStart).inDays * dayPx;
      lines.add(Positioned(
        left: left,
        top: 0,
        bottom: 0,
        child: Container(width: 1, color: AppTheme.border.withOpacity(0.4)),
      ));
      cur = DateTime(cur.year, cur.month + 1, 1);
    }
    return lines;
  }

  Widget _nameCell(String id) {
    final name = _empName(id);
    final initials = name.trim().isNotEmpty
        ? name.trim().split(' ').take(2).map((w) => w[0].toUpperCase()).join()
        : '?';
    return Container(
      height: _rowH,
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: AppTheme.border.withOpacity(0.4))),
        color: Theme.of(context).cardColor,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(children: [
        CircleAvatar(
          radius: 13,
          backgroundColor: AppTheme.primary.withOpacity(0.1),
          child: Text(initials,
              style: const TextStyle(
                  fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.primary)),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Text(name,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
              overflow: TextOverflow.ellipsis,
              maxLines: 1),
        ),
      ]),
    );
  }

  Widget _ganttRow(String empId, int rowIndex, double totalW, double dayPx) {
    final allocs = _allocsFor(empId);
    return Container(
      height: _rowH,
      decoration: BoxDecoration(
        color: rowIndex.isOdd
            ? Theme.of(context).scaffoldBackgroundColor
            : Theme.of(context).cardColor.withOpacity(0.5),
        border: Border(bottom: BorderSide(color: AppTheme.border.withOpacity(0.3))),
      ),
      child: Stack(
        clipBehavior: Clip.hardEdge,
        children: allocs.map((a) {
          final geo = _barGeometry(a, dayPx);
          if (geo == null) return const SizedBox.shrink();
          final color = _barColor(a);
          final barH = _rowH * 0.52;
          final topPad = (_rowH - barH) / 2;
          return Positioned(
            left: geo.left,
            width: geo.width,
            top: topPad,
            height: barH,
            child: GestureDetector(
              onTap: () => _showAllocationDetail(a),
              child: Tooltip(
                message:
                    '${a.projectName}\n${a.role}\n${AppTheme.fmtDate(a.startDate)} – ${AppTheme.fmtDate(a.endDate)}\n${a.allocatedHours.toStringAsFixed(0)}h/wk · ${a.utilizationPct.toStringAsFixed(0)}%',
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 1),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.85),
                    borderRadius: BorderRadius.circular(4),
                    boxShadow: [
                      BoxShadow(
                          color: color.withOpacity(0.25),
                          blurRadius: 2,
                          offset: const Offset(0, 1))
                    ],
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 5),
                  alignment: Alignment.centerLeft,
                  child: Text(
                    geo.width > 40 ? a.projectName : '',
                    style: const TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w600,
                        color: Colors.white),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  void _showAllocationDetail(ResourceAllocation a) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => _AllocationDetailSheet(
        allocation: a,
        onEdit: () async {
          Navigator.pop(context);
          final result = await Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (_) => AllocationFormScreen(existing: a)));
          if (result == true && mounted) {
            // Parent dashboard will reload; show confirmation
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                  content: Text('Allocation updated'),
                  backgroundColor: AppTheme.green),
            );
          }
        },
        onDelete: () async {
          Navigator.pop(context);
          final confirm = await showDialog<bool>(
            context: context,
            builder: (_) => AlertDialog(
              title: const Text('Delete Allocation'),
              content: Text(
                  'Remove ${a.employeeName} from ${a.projectName}?'),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: const Text('Cancel')),
                TextButton(
                    onPressed: () => Navigator.pop(context, true),
                    child: const Text('Delete',
                        style: TextStyle(color: AppTheme.red))),
              ],
            ),
          );
          if (confirm == true && mounted) {
            try {
              await ResourceService().deleteAllocation(a.id);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                      content: Text('Allocation deleted'),
                      backgroundColor: AppTheme.green),
                );
              }
            } catch (e) {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                      content: Text(e.toString()),
                      backgroundColor: AppTheme.red),
                );
              }
            }
          }
        },
      ),
    );
  }

  Widget _buildLegend(double screenW) {
    final compact = screenW < 400;
    return Container(
      color: Theme.of(context).cardColor,
      padding: EdgeInsets.symmetric(
          horizontal: 12, vertical: compact ? 6 : 8),
      child: Wrap(
        spacing: compact ? 8 : 14,
        runSpacing: 4,
        children: [
          _legendItem('On track (≤80%)', AppTheme.primary),
          _legendItem('High load (≤100%)', AppTheme.amber),
          _legendItem('Over-allocated (>100%)', AppTheme.red),
          Row(mainAxisSize: MainAxisSize.min, children: [
            Container(
                width: 2,
                height: 12,
                color: AppTheme.primary.withOpacity(0.5)),
            const SizedBox(width: 4),
            Text('Today',
                style: TextStyle(
                    fontSize: compact ? 9 : 10,
                    color: AppTheme.textSecondary)),
          ]),
        ],
      ),
    );
  }

  Widget _legendItem(String label, Color color) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                  color: color.withOpacity(0.85),
                  borderRadius: BorderRadius.circular(3))),
          const SizedBox(width: 4),
          Text(label,
              style: const TextStyle(
                  fontSize: 10, color: AppTheme.textSecondary)),
        ],
      );

  String _monthLabel(int m) => const [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ][m - 1];
}

// ── Detail bottom sheet ────────────────────────────────────────────────────

class _AllocationDetailSheet extends StatelessWidget {
  final ResourceAllocation allocation;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _AllocationDetailSheet({
    required this.allocation,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final a = allocation;
    final utilColor = a.utilizationPct > 100
        ? AppTheme.red
        : a.utilizationPct > 80
            ? AppTheme.amber
            : AppTheme.green;

    return Padding(
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
        Row(children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(a.projectName,
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 2),
              Text(a.employeeName,
                  style: const TextStyle(
                      fontSize: 13, color: AppTheme.textSecondary)),
            ]),
          ),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
                color: utilColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8)),
            child: Text('${a.utilizationPct.toStringAsFixed(0)}%',
                style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: utilColor)),
          ),
        ]),
        const SizedBox(height: 14),
        _row('Role', a.role),
        _row('Period',
            '${AppTheme.fmtDate(a.startDate)} – ${AppTheme.fmtDate(a.endDate)}'),
        _row('Hours / week', '${a.allocatedHours.toStringAsFixed(0)}h'),
        _row('Status', a.status),
        _row('Priority', a.priority),
        if (a.notes != null && a.notes!.isNotEmpty) _row('Notes', a.notes!),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: onDelete,
              icon: const Icon(Icons.delete_outline, size: 16,
                  color: AppTheme.red),
              label: const Text('Delete',
                  style: TextStyle(color: AppTheme.red)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppTheme.red),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: onEdit,
              icon: const Icon(Icons.edit_outlined, size: 16),
              label: const Text('Edit'),
            ),
          ),
        ]),
      ]),
    );
  }

  Widget _row(String label, String value) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(children: [
          SizedBox(
              width: 110,
              child: Text(label,
                  style: const TextStyle(
                      fontSize: 12, color: AppTheme.textSecondary))),
          Expanded(
              child: Text(value,
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w600))),
        ]),
      );
}
