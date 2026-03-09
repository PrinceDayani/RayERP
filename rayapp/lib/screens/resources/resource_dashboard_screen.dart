import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/resource_service.dart';
import '../../services/project_service.dart';
import '../../models/project.dart';
import '../employees/employee_detail_screen.dart';
import '../projects/project_detail_screen.dart';
import 'allocation_calendar_screen.dart';
import 'workload_timeline_screen.dart';
import 'available_employees_screen.dart';
import 'capacity_planning_screen.dart';
import 'conflict_detection_screen.dart';
import 'skill_matrix_screen.dart';
import 'skill_gap_screen.dart';
import 'project_skill_match_screen.dart';
import 'skill_analytics_screen.dart';
import 'allocation_summary_screen.dart';
import 'allocation_form_screen.dart';

class ResourceDashboardScreen extends StatefulWidget {
  const ResourceDashboardScreen({super.key});

  @override
  State<ResourceDashboardScreen> createState() => _ResourceDashboardScreenState();
}

class _ResourceDashboardScreenState extends State<ResourceDashboardScreen>
    with SingleTickerProviderStateMixin {
  final _svc = ResourceService();
  final _projSvc = ProjectService();
  late TabController _tabs;

  List<ResourceAllocation> _allocations = [];
  List<Project> _projects = [];
  int _availableCount = 0;
  int _skillGapsCount = 0;
  int _overallocatedCount = 0;
  double _avgUtilization = 0;
  bool _loading = true;
  String? _error;

  // Allocation filters
  String _filterStatus = 'all';
  DateTime? _filterStart;
  DateTime? _filterEnd;

  static const _tabLabels = [
    'Overview', 'Calendar', 'Workload', 'Available',
    'Capacity', 'Conflicts', 'Skill Matrix',
    'Skill Gaps', 'Project Match', 'Analytics', 'Summary',
  ];

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: _tabLabels.length, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final now = DateTime.now();
      final start = now.toIso8601String();
      final end = now.add(const Duration(days: 90)).toIso8601String();

      final results = await Future.wait([
        _svc.getAllocations(
          status: _filterStatus == 'all' ? null : _filterStatus,
          startDate: _filterStart?.toIso8601String(),
          endDate: _filterEnd?.toIso8601String(),
        ),
        _projSvc.getAll(),
        _svc.getAvailableCount(),
        _svc.getSkillGapsCount(),
        _svc.getCapacities(startDate: start, endDate: end),
      ]);

      if (!mounted) return;
      final capacities = results[4] as List<EmployeeCapacity>;
      final allocs = results[0] as List<ResourceAllocation>;

      // Avg utilization from capacities
      double avgUtil = 0;
      if (capacities.isNotEmpty) {
        avgUtil = capacities.fold(0.0, (s, c) => s + c.utilizationPct) / capacities.length;
      }

      setState(() {
        _allocations = allocs;
        _projects = results[1] as List<Project>;
        _availableCount = results[2] as int;
        _skillGapsCount = results[3] as int;
        _overallocatedCount = capacities.where((c) => c.utilizationPct > 100).length;
        _avgUtilization = avgUtil;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  int get _totalResources {
    final ids = <String>{};
    for (final a in _allocations) ids.add(a.employeeId);
    return ids.length;
  }

  List<ResourceAllocation> get _recentAllocations {
    final sorted = [..._allocations]..sort((a, b) => b.startDate.compareTo(a.startDate));
    return sorted.take(10).toList();
  }

  List<Project> get _upcomingDeadlines {
    final now = DateTime.now();
    final cutoff = now.add(const Duration(days: 30));
    return _projects
        .where((p) => p.endDate.isAfter(now) && p.endDate.isBefore(cutoff) && p.status == 'active')
        .toList()
      ..sort((a, b) => a.endDate.compareTo(b.endDate));
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_error != null) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.error_outline, color: AppTheme.red, size: 40),
      const SizedBox(height: 8),
      Text(_error!, style: const TextStyle(color: AppTheme.red), textAlign: TextAlign.center),
      const SizedBox(height: 12),
      ElevatedButton(onPressed: _load, child: const Text('Retry')),
    ]));

    return Scaffold(
      body: Column(children: [
        _buildTabBar(),
        Expanded(
          child: TabBarView(controller: _tabs, children: [
            _buildOverviewTab(),
            const AllocationCalendarScreen(),
            WorkloadTimelineScreen(allocations: _allocations),
            AvailableEmployeesScreen(allocations: _allocations),
            const CapacityPlanningScreen(),
            const ConflictDetectionScreen(),
            const SkillMatrixScreen(),
            const SkillGapScreen(),
            const ProjectSkillMatchScreen(),
            const SkillAnalyticsScreen(),
            const AllocationSummaryScreen(),
          ]),
        ),
      ]),
      floatingActionButton: FloatingActionButton.small(
        onPressed: () async {
          final result = await Navigator.push(context, MaterialPageRoute(
              builder: (_) => const AllocationFormScreen()));
          if (result == true) _load();
        },
        backgroundColor: AppTheme.primary,
        tooltip: 'New Allocation',
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      color: Theme.of(context).cardColor,
      child: TabBar(
        controller: _tabs,
        isScrollable: true,
        tabAlignment: TabAlignment.start,
        labelColor: AppTheme.primary,
        unselectedLabelColor: AppTheme.textSecondary,
        indicatorColor: AppTheme.primary,
        labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        tabs: _tabLabels.map((t) => Tab(text: t)).toList(),
      ),
    );
  }

  Widget _buildOverviewTab() {
    final screenW = MediaQuery.of(context).size.width;
    final hPad = screenW < 400 ? 12.0 : 16.0;
    return Column(children: [
      _buildFilterBar(hPad),
      Expanded(
        child: RefreshIndicator(
          onRefresh: _load,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.fromLTRB(hPad, 16, hPad, 80),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _statsRow(),
              const SizedBox(height: 20),
              _sectionTitle('Recent Allocations'),
              const SizedBox(height: 8),
              ..._recentAllocations.map(_allocationCard),
              if (_recentAllocations.isEmpty) _emptyState('No allocations match filters'),
              const SizedBox(height: 20),
              _sectionTitle('Upcoming Deadlines (30 days)'),
              const SizedBox(height: 8),
              ..._upcomingDeadlines.map(_deadlineCard),
              if (_upcomingDeadlines.isEmpty) _emptyState('No deadlines in next 30 days'),
            ]),
          ),
        ),
      ),
    ]);
  }

  Widget _buildFilterBar(double hPad) {
    final screenW = MediaQuery.of(context).size.width;
    final compact = screenW < 480;
    final hasFilters = _filterStatus != 'all' || _filterStart != null || _filterEnd != null;

    return Container(
      color: Theme.of(context).cardColor,
      padding: EdgeInsets.fromLTRB(hPad, 8, hPad, 8),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Status chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: [
            _filterChip('All', 'all'),
            const SizedBox(width: 6),
            _filterChip('Active', 'active'),
            const SizedBox(width: 6),
            _filterChip('Planned', 'planned'),
            const SizedBox(width: 6),
            _filterChip('Completed', 'completed'),
            const SizedBox(width: 6),
            _filterChip('On Hold', 'on_hold'),
          ]),
        ),
        const SizedBox(height: 8),
        Row(children: [
          Expanded(
            child: _datePicker(
              label: compact ? 'From' : 'Start Date',
              date: _filterStart,
              onPick: (d) { setState(() => _filterStart = d); _load(); },
              onClear: () { setState(() => _filterStart = null); _load(); },
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _datePicker(
              label: compact ? 'To' : 'End Date',
              date: _filterEnd,
              onPick: (d) { setState(() => _filterEnd = d); _load(); },
              onClear: () { setState(() => _filterEnd = null); _load(); },
            ),
          ),
          if (hasFilters) ...[  
            const SizedBox(width: 8),
            TextButton(
              onPressed: () {
                setState(() {
                  _filterStatus = 'all';
                  _filterStart = null;
                  _filterEnd = null;
                });
                _load();
              },
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                foregroundColor: AppTheme.red,
              ),
              child: Text(compact ? 'Clear' : 'Clear All',
                  style: const TextStyle(fontSize: 12)),
            ),
          ],
        ]),
      ]),
    );
  }

  Widget _filterChip(String label, String value) {
    final active = _filterStatus == value;
    return GestureDetector(
      onTap: () { setState(() => _filterStatus = value); _load(); },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: active ? AppTheme.primary : AppTheme.primary.withOpacity(0.06),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: active ? AppTheme.primary : AppTheme.primary.withOpacity(0.2)),
        ),
        child: Text(label,
            style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: active ? Colors.white : AppTheme.primary)),
      ),
    );
  }

  Widget _datePicker({
    required String label,
    required DateTime? date,
    required ValueChanged<DateTime> onPick,
    required VoidCallback onClear,
  }) {
    return InkWell(
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: date ?? DateTime.now(),
          firstDate: DateTime(2020),
          lastDate: DateTime(2030),
        );
        if (picked != null) onPick(picked);
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          border: Border.all(
              color: date != null ? AppTheme.primary : AppTheme.border),
          borderRadius: BorderRadius.circular(8),
          color: date != null
              ? AppTheme.primary.withOpacity(0.04)
              : Theme.of(context).inputDecorationTheme.fillColor,
        ),
        child: Row(children: [
          Icon(Icons.calendar_today_outlined,
              size: 13,
              color: date != null ? AppTheme.primary : AppTheme.textSecondary),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              date != null ? AppTheme.fmtDate(date) : label,
              style: TextStyle(
                  fontSize: 12,
                  color: date != null
                      ? AppTheme.primary
                      : AppTheme.textSecondary,
                  fontWeight: date != null ? FontWeight.w600 : FontWeight.normal),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (date != null)
            GestureDetector(
              onTap: onClear,
              child: const Icon(Icons.close, size: 14, color: AppTheme.textSecondary),
            ),
        ]),
      ),
    );
  }

  Widget _statsRow() {
    final stats = [
      ('Total Resources', '$_totalResources', AppTheme.blue, Icons.people_outline),
      ('Available Now', '$_availableCount', AppTheme.green, Icons.person_outline),
      ('Overallocated', '$_overallocatedCount', AppTheme.red, Icons.warning_amber_outlined),
      ('Avg Utilization', '${_avgUtilization.toStringAsFixed(0)}%', AppTheme.amber, Icons.speed_outlined),
      ('Active Projects', '${_projects.where((p) => p.status == 'active').length}', AppTheme.primary, Icons.folder_outlined),
      ('Skill Gaps', '$_skillGapsCount', AppTheme.purple, Icons.psychology_outlined),
    ];
    return LayoutBuilder(builder: (_, c) {
      final cols = c.maxWidth < 360 ? 2 : 3;
      final tileH = c.maxWidth < 360 ? 72.0 : 80.0;
      final tileW = (c.maxWidth - (cols - 1) * 8) / cols;
      return GridView.count(
        crossAxisCount: cols,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: tileW / tileH,
        children: stats.map((s) => _statCard(s.$1, s.$2, s.$3, s.$4)).toList(),
      );
    });
  }

  Widget _statCard(String label, String value, Color color, IconData icon) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, size: 15, color: color),
          const Spacer(),
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: color)),
          Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
        ]),
      ),
    );
  }

  Widget _allocationCard(ResourceAllocation a) {
    final isHigh = a.utilizationPct > 80;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            GestureDetector(
              onTap: () => Navigator.push(context, MaterialPageRoute(
                  builder: (_) => EmployeeDetailScreen(id: a.employeeId))),
              child: Text(a.employeeName, style: const TextStyle(
                  fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.primary,
                  decoration: TextDecoration.underline)),
            ),
            const SizedBox(height: 2),
            GestureDetector(
              onTap: () => Navigator.push(context, MaterialPageRoute(
                  builder: (_) => ProjectDetailScreen(id: a.projectId))),
              child: Text('${a.projectName} · ${a.role}', style: const TextStyle(
                  fontSize: 12, color: AppTheme.blue,
                  decoration: TextDecoration.underline)),
            ),
            Text('${AppTheme.fmtDate(a.startDate)} – ${AppTheme.fmtDate(a.endDate)}',
                style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
          ])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isHigh ? AppTheme.redBg : AppTheme.greenBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${a.utilizationPct.toStringAsFixed(0)}%',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                    color: isHigh ? AppTheme.red : AppTheme.green),
              ),
            ),
            const SizedBox(height: 4),
            Text('${a.allocatedHours.toStringAsFixed(0)}h/wk',
                style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
          ]),
        ]),
      ),
    );
  }

  Widget _deadlineCard(Project p) {
    final daysLeft = p.endDate.difference(DateTime.now()).inDays;
    final color = daysLeft <= 7 ? AppTheme.red : daysLeft <= 14 ? AppTheme.amber : AppTheme.green;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => Navigator.push(context, MaterialPageRoute(
            builder: (_) => ProjectDetailScreen(id: p.id))),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(p.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.primary)),
              const SizedBox(height: 2),
              Row(children: [
                _priorityBadge(p.priority),
                const SizedBox(width: 6),
                Text('Due ${AppTheme.fmtDate(p.endDate)}', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
              ]),
            ])),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Text('$daysLeft d', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _priorityBadge(String priority) {
    final color = priority == 'critical' ? AppTheme.red : priority == 'high' ? AppTheme.amber : AppTheme.blue;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
      child: Text(priority.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: color)),
    );
  }

  Widget _sectionTitle(String t) => Text(t, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700));

  Widget _emptyState(String msg) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 16),
    child: Center(child: Text(msg, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13))),
  );
}
