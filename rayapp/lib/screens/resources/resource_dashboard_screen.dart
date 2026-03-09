import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/resource_service.dart';
import '../../models/project.dart';
import '../../services/project_service.dart';
import '../employees/employee_detail_screen.dart';
import '../projects/project_detail_screen.dart';
import 'allocation_calendar_screen.dart';
import 'workload_timeline_screen.dart';
import 'available_employees_screen.dart';
import 'capacity_planning_screen.dart';
import 'conflict_detection_screen.dart';
import 'skill_matrix_screen.dart';

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
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 7, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        _svc.getAllocations(),
        _projSvc.getAll(),
        _svc.getAvailableCount(),
        _svc.getSkillGapsCount(),
        _svc.getCapacities(),
      ]);
      if (mounted) {
        final capacities = results[4] as List<EmployeeCapacity>;
        setState(() {
          _allocations = results[0] as List<ResourceAllocation>;
          _projects = results[1] as List<Project>;
          _availableCount = results[2] as int;
          _skillGapsCount = results[3] as int;
          _overallocatedCount = capacities.where((c) => c.utilizationPct > 100).length;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  int get _totalResources {
    final ids = <String>{};
    for (final a in _allocations) ids.add(a.employeeId);
    return ids.length;
  }

  double get _avgUtilization {
    if (_allocations.isEmpty) return 0;
    final Map<String, double> empUtil = {};
    for (final a in _allocations) {
      empUtil[a.employeeId] = (empUtil[a.employeeId] ?? 0) + a.utilizationPct;
    }
    return empUtil.values.fold(0.0, (s, v) => s + v) / empUtil.length;
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
    if (_error != null) return Center(child: Text(_error!, style: const TextStyle(color: AppTheme.red)));

    return Column(children: [
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
        ]),
      ),
    ]);
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
        tabs: const [
          Tab(text: 'Overview'),
          Tab(text: 'Calendar'),
          Tab(text: 'Workload'),
          Tab(text: 'Available'),
          Tab(text: 'Capacity'),
          Tab(text: 'Conflicts'),
          Tab(text: 'Skill Matrix'),
        ],
      ),
    );
  }

  Widget _buildOverviewTab() {
    return RefreshIndicator(
      onRefresh: _load,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _statsRow(),
          const SizedBox(height: 20),
          _sectionTitle('Recent Allocations'),
          const SizedBox(height: 8),
          ..._recentAllocations.map(_allocationCard),
          if (_recentAllocations.isEmpty) _emptyState('No active allocations'),
          const SizedBox(height: 20),
          _sectionTitle('Upcoming Deadlines'),
          const SizedBox(height: 8),
          ..._upcomingDeadlines.map(_deadlineCard),
          if (_upcomingDeadlines.isEmpty) _emptyState('No deadlines in next 30 days'),
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
      ('Skill Gaps', '$_skillGapsCount', const Color(0xFF7C3AED), Icons.psychology_outlined),
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
              child: Text(a.projectName, style: const TextStyle(
                  fontSize: 12, color: AppTheme.blue,
                  decoration: TextDecoration.underline)),
            ),
            Text('From ${_fmt(a.startDate)}', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
          ])),
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
                Text('Due ${_fmt(p.endDate)}', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
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

  String _fmt(DateTime d) => '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
}
