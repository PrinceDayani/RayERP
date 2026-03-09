import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/employee.dart';
import '../../models/attendance.dart';
import '../../models/leave.dart';
import '../../services/employee_service.dart';
import '../../services/attendance_service.dart';
import '../../services/leave_service.dart';
import 'employee_form_screen.dart';
import 'widgets/attendance_card.dart';
import 'widgets/leave_card.dart';
import 'widgets/leave_create_dialog.dart';
import 'widgets/projects_tab.dart';
import 'widgets/skills_tab.dart';
import 'widgets/performance_tab.dart';
import 'widgets/reports_tab.dart';
import 'widgets/salary_tab.dart';
import 'widgets/career_tab.dart';
import 'widgets/achievements_tab.dart';
import 'widgets/resource_allocation_tab.dart';
import '../../utils/pdf_generator.dart';

class EmployeeDetailScreen extends StatefulWidget {
  final String id;
  const EmployeeDetailScreen({super.key, required this.id});
  @override
  State<EmployeeDetailScreen> createState() => _EmployeeDetailScreenState();
}

class _EmployeeDetailScreenState extends State<EmployeeDetailScreen>
    with SingleTickerProviderStateMixin {
  final _empSvc = EmployeeService();
  final _attSvc = AttendanceService();
  final _lvSvc = LeaveService();
  late TabController _tabs;
  Employee? _emp;
  List<Attendance> _attendance = [];
  List<Leave> _leaves = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 11, vsync: this);
    _load();
  }

  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final emp = await _empSvc.getById(widget.id);
      if (!mounted) return;
      setState(() { _emp = emp; _loading = false; });
      final r = await Future.wait([
        _attSvc.getByEmployee(widget.id),
        _lvSvc.getByEmployee(widget.id),
      ]);
      if (!mounted) return;
      setState(() {
        _attendance = r[0] as List<Attendance>;
        _leaves = r[1] as List<Leave>;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() { _loading = false; _error = e.toString(); });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppTheme.primary)));
    if (_emp == null) return Scaffold(body: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 36),
      const SizedBox(height: 8),
      Text(_error ?? 'Failed to load', style: const TextStyle(color: Color(0xFFDC2626))),
      TextButton(onPressed: _load, child: const Text('Retry')),
    ])));

    final emp = _emp!;
    final initials = emp.firstName[0].toUpperCase() + (emp.lastName.isNotEmpty ? emp.lastName[0].toUpperCase() : '');
    final isActive = emp.status == 'active';

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: Column(
        children: [
          // ── Fixed header ──────────────────────────────────────────────
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppTheme.primary, Color(0xFFCD2E4F)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Column(
                children: [
                  // AppBar row
                  Padding(
                    padding: const EdgeInsets.fromLTRB(4, 4, 8, 0),
                    child: Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back, color: Colors.white),
                          onPressed: () => Navigator.pop(context),
                        ),
                        Expanded(
                          child: Text(emp.fullName,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white),
                              overflow: TextOverflow.ellipsis),
                        ),
                        IconButton(
                          icon: const Icon(Icons.share_outlined, color: Colors.white),
                          tooltip: 'Share Profile',
                          onPressed: () => ProfileSharer.shareEmployee(emp),
                        ),
                        IconButton(
                          icon: const Icon(Icons.edit_outlined, color: Colors.white),
                          onPressed: () async {
                            await Navigator.push(context, MaterialPageRoute(builder: (_) => EmployeeFormScreen(employee: emp)));
                            _load();
                          },
                        ),
                      ],
                    ),
                  ),
                  // Profile row
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                      Container(
                        width: 56, height: 56,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.white.withOpacity(0.4), width: 1.5),
                        ),
                        child: Center(child: Text(initials, style: const TextStyle(fontSize: 20, color: Colors.white, fontWeight: FontWeight.bold))),
                      ),
                      const SizedBox(width: 14),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(emp.position, style: const TextStyle(fontSize: 13, color: Colors.white70)),
                        const SizedBox(height: 6),
                        Row(children: [
                          _heroPill(emp.employeeId, Icons.badge_outlined),
                          if ((emp.department ?? '').isNotEmpty) ...[
                            const SizedBox(width: 6),
                            _heroPill(emp.department!, Icons.business_outlined),
                          ],
                        ]),
                      ])),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: isActive ? const Color(0xFF16A34A).withOpacity(0.25) : const Color(0xFFDC2626).withOpacity(0.25),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: isActive ? const Color(0xFF4ADE80).withOpacity(0.6) : const Color(0xFFF87171).withOpacity(0.6)),
                        ),
                        child: Text(emp.status, style: TextStyle(
                          fontSize: 11, fontWeight: FontWeight.w600,
                          color: isActive ? const Color(0xFF4ADE80) : const Color(0xFFF87171),
                        )),
                      ),
                    ]),
                  ),
                  // Tab bar
                  TabBar(
                    controller: _tabs,
                    labelColor: Colors.white,
                    unselectedLabelColor: Colors.white60,
                    indicatorColor: Colors.white,
                    indicatorWeight: 2,
                    labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                    isScrollable: true,
                    tabAlignment: TabAlignment.start,
                    tabs: const [
                      Tab(text: 'Info'),
                      Tab(text: 'Attendance'),
                      Tab(text: 'Leaves'),
                      Tab(text: 'Projects'),
                      Tab(text: 'Skills'),
                      Tab(text: 'Salary'),
                      Tab(text: 'Performance'),
                      Tab(text: 'Career'),
                      Tab(text: 'Achievements'),
                      Tab(text: 'Resources'),
                      Tab(text: 'Reports'),
                    ],
                  ),
                ],
              ),
            ),
          ),
          // ── Tab content ───────────────────────────────────────────────
          Expanded(
            child: TabBarView(
              controller: _tabs,
              children: [
                _InfoTab(employee: emp, attendanceCount: _attendance.length, leaveCount: _leaves.length),
                _AttendanceTab(records: _attendance, employeeId: widget.id),
                _LeavesTab(leaves: _leaves, employeeId: widget.id, onRefresh: _load),
                ProjectsTab(employeeId: widget.id),
                SkillsTab(employee: emp),
                SalaryTab(employee: emp),
                PerformanceTab(employeeId: widget.id),
                CareerTab(employee: emp),
                AchievementsTab(employeeId: widget.id),
                ResourceAllocationTab(employeeId: widget.id),
                const ReportsTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _heroPill(String label, IconData icon) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 10, color: Colors.white70),
          const SizedBox(width: 3),
          Text(label, style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w500)),
        ]),
      );
}

// ─── Info Tab ────────────────────────────────────────────────────────────────

class _InfoTab extends StatelessWidget {
  final Employee employee;
  final int attendanceCount, leaveCount;
  const _InfoTab({required this.employee, required this.attendanceCount, required this.leaveCount});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(children: [
        // Quick stats row
        Row(children: [
          _quickStat('Attendance', '$attendanceCount records', Icons.access_time_outlined, const Color(0xFF2563EB)),
          const SizedBox(width: 10),
          _quickStat('Leaves', '$leaveCount requests', Icons.event_note_outlined, const Color(0xFFD97706)),
          if (employee.salary != null) ...[
            const SizedBox(width: 10),
            _quickStat('Salary', '₹${(employee.salary! / 1000).toStringAsFixed(0)}k', Icons.currency_rupee_outlined, const Color(0xFF059669)),
          ],
        ]),
        const SizedBox(height: 14),
        _section('Work', [
          _tile('Employee ID', employee.employeeId, Icons.badge_outlined),
          _tile('Position', employee.position, Icons.work_outline),
          if ((employee.jobTitle ?? '').isNotEmpty) _tile('Job Title', employee.jobTitle!, Icons.title_outlined),
          if ((employee.department ?? '').isNotEmpty) _tile('Department', employee.department!, Icons.business_outlined),
          if (employee.hireDate != null) _tile('Hire Date', _fmt(employee.hireDate!), Icons.calendar_today_outlined),
        ]),
        const SizedBox(height: 10),
        _section('Contact', [
          _tile('Email', employee.email, Icons.email_outlined),
          _tile('Phone', employee.phone, Icons.phone_outlined),
        ]),
        if (employee.address != null && !employee.address!.isEmpty) ...[
          const SizedBox(height: 10),
          _section('Address', [_tile('Address', employee.address!.display, Icons.location_on_outlined)]),
        ],
        if (employee.emergencyContact != null && !employee.emergencyContact!.isEmpty) ...[
          const SizedBox(height: 10),
          _section('Emergency Contact', [
            if ((employee.emergencyContact!.name ?? '').isNotEmpty) _tile('Name', employee.emergencyContact!.name!, Icons.person_outline),
            if ((employee.emergencyContact!.relationship ?? '').isNotEmpty) _tile('Relation', employee.emergencyContact!.relationship!, Icons.people_outline),
            if ((employee.emergencyContact!.phone ?? '').isNotEmpty) _tile('Phone', employee.emergencyContact!.phone!, Icons.phone_outlined),
          ]),
        ],
        if ((employee.bio ?? '').isNotEmpty) ...[
          const SizedBox(height: 10),
          _section('Bio', [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
              child: Text(employee.bio!, style: const TextStyle(fontSize: 13, color: Color(0xFF374151), height: 1.5)),
            ),
          ]),
        ],
        if (employee.skills.isNotEmpty) ...[
          const SizedBox(height: 10),
          _section('Skills', [
            Padding(
              padding: const EdgeInsets.all(12),
              child: Wrap(spacing: 6, runSpacing: 6, children: employee.skills.map((s) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.07),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
                ),
                child: Text(s, style: const TextStyle(fontSize: 12, color: AppTheme.primary)),
              )).toList()),
            ),
          ]),
        ],
      ]),
    );
  }

  Widget _quickStat(String label, String value, IconData icon, Color color) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
            Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF6B7280))),
          ]),
        ),
      );

  Widget _section(String title, List<Widget> children) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Text(title.toUpperCase(),
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF9CA3AF), letterSpacing: 0.8)),
          ),
          const Divider(height: 1, color: Color(0xFFE5E7EB)),
          ...children,
        ]),
      );

  Widget _tile(String label, String value, IconData icon) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
        child: Row(children: [
          Icon(icon, size: 16, color: AppTheme.primary),
          const SizedBox(width: 12),
          SizedBox(width: 90, child: Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)))),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF111827)))),
        ]),
      );

  String _fmt(DateTime d) => AppTheme.fmtDate(d);
}

// ─── Attendance Tab ───────────────────────────────────────────────────────────

class _AttendanceTab extends StatelessWidget {
  final List<Attendance> records;
  final String employeeId;
  const _AttendanceTab({required this.records, required this.employeeId});

  @override
  Widget build(BuildContext context) {
    if (records.isEmpty) return const Center(child: Text('No attendance records', style: TextStyle(color: AppTheme.textSecondary)));

    final present = records.where((r) => r.status == 'present').length;
    final late = records.where((r) => r.status == 'late').length;
    final halfDay = records.where((r) => r.status == 'half-day').length;
    final totalHours = records.fold(0.0, (s, r) => s + r.totalHours);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 2.4,
          children: [
            _statCard('Present', '$present days', Icons.check_circle_outline, const Color(0xFF16A34A)),
            _statCard('Late', '$late days', Icons.schedule_outlined, const Color(0xFFD97706)),
            _statCard('Half Day', '$halfDay days', Icons.timelapse_outlined, const Color(0xFF2563EB)),
            _statCard('Total Hours', '${totalHours.toStringAsFixed(0)}h', Icons.timer_outlined, AppTheme.primary),
          ],
        ),
        const SizedBox(height: 12),
        ...records.map((r) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: AttendanceCard(record: r),
        )),
      ],
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFE5E7EB))),
        child: Row(children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, size: 14, color: color),
          ),
          const SizedBox(width: 8),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(value, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: color)),
            Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF6B7280))),
          ]),
        ]),
      );
}

// ─── Leaves Tab ──────────────────────────────────────────────────────────────

class _LeavesTab extends StatefulWidget {
  final List<Leave> leaves;
  final String employeeId;
  final VoidCallback onRefresh;
  const _LeavesTab({required this.leaves, required this.employeeId, required this.onRefresh});
  @override
  State<_LeavesTab> createState() => _LeavesTabState();
}

class _LeavesTabState extends State<_LeavesTab> {
  final _svc = LeaveService();

  Future<void> _updateStatus(String id, String status) async {
    try { await _svc.updateStatus(id, status); widget.onRefresh(); }
    catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e'))); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      floatingActionButton: FloatingActionButton.small(
        backgroundColor: AppTheme.primary,
        onPressed: () => LeaveCreateDialog.show(context, employeeId: widget.employeeId, onCreated: widget.onRefresh),
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: widget.leaves.isEmpty
          ? const Center(child: Text('No leave records', style: TextStyle(color: AppTheme.textSecondary)))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: widget.leaves.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) => LeaveCard(
                leave: widget.leaves[i],
                onUpdateStatus: (status) => _updateStatus(widget.leaves[i].id, status),
              ),
            ),
    );
  }
}
