import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/attendance.dart';
import '../../models/employee.dart';
import '../../services/attendance_service.dart';
import '../../services/employee_service.dart';
import 'attendance_detail_screen.dart';

class AttendanceListScreen extends StatefulWidget {
  const AttendanceListScreen({super.key});
  @override
  State<AttendanceListScreen> createState() => _AttendanceListScreenState();
}

class _AttendanceListScreenState extends State<AttendanceListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Container(
        color: Theme.of(context).cardColor,
        child: TabBar(
          controller: _tabs,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          tabs: const [
            Tab(icon: Icon(Icons.dashboard_outlined, size: 16), text: 'Dashboard'),
            Tab(icon: Icon(Icons.calendar_month_outlined, size: 16), text: 'Records'),
            Tab(icon: Icon(Icons.bar_chart_outlined, size: 16), text: 'Insights'),
          ],
        ),
      ),
      Expanded(
        child: TabBarView(controller: _tabs, children: const [
          _DashboardTab(),
          _RecordsTab(),
          _InsightsTab(),
        ]),
      ),
    ]);
  }
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────

class _DashboardTab extends StatefulWidget {
  const _DashboardTab();
  @override
  State<_DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<_DashboardTab> {
  final _svc = AttendanceService();
  final _empSvc = EmployeeService();
  Map<String, dynamic>? _stats;
  List<Attendance> _today = [];
  int _totalActive = 0;
  bool _loading = true;
  String? _error;

  final _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([
        _svc.getStats(month: _now.month, year: _now.year),
        _svc.getToday(),
        _empSvc.getAll(),
      ]);
      if (!mounted) return;
      setState(() {
        _stats = results[0] as Map<String, dynamic>;
        _today = results[1] as List<Attendance>;
        final emps = results[2] as List<Employee>;
        _totalActive = emps.where((e) => e.status == 'active').length;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_error != null) return _errorView(_error!, _load);

    final s = _stats!;
    final presentToday = _today.where((r) => r.status == 'present' || r.status == 'late' || r.status == 'half-day').length;
    final lateToday = _today.where((r) => r.status == 'late').length;
    final absentToday = _totalActive - presentToday;
    final attendancePct = _totalActive > 0 ? presentToday / _totalActive : 0.0;

    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.primary,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Today hero ──────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.primary, Color(0xFFCD2E4F)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.today_outlined, color: Colors.white70, size: 14),
                const SizedBox(width: 6),
                Text(
                  'Today — ${AppTheme.fmtDate(_now)}',
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ]),
              const SizedBox(height: 10),
              Row(children: [
                Expanded(child: _heroStat('Present', '$presentToday', Colors.white)),
                Expanded(child: _heroStat('Late', '$lateToday', const Color(0xFFFFD580))),
                Expanded(child: _heroStat('Absent', '${absentToday < 0 ? 0 : absentToday}', const Color(0xFFFF8A80))),
                Expanded(child: _heroStat('Rate', '${(attendancePct * 100).toStringAsFixed(0)}%', Colors.white)),
              ]),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: attendancePct.clamp(0.0, 1.0),
                  minHeight: 6,
                  backgroundColor: Colors.white24,
                  valueColor: const AlwaysStoppedAnimation(Colors.white),
                ),
              ),
            ]),
          ),
          const SizedBox(height: 14),
          // ── Monthly stats grid ──────────────────────────────────────
          const _SectionLabel('This Month'),
          const SizedBox(height: 8),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 2.6,
            children: [
              _statCard('Present Days', '${s['presentDays'] ?? 0}', Icons.check_circle_outline, AppTheme.green),
              _statCard('Late Days', '${s['lateDays'] ?? 0}', Icons.schedule_outlined, AppTheme.amber),
              _statCard('Half Days', '${s['halfDays'] ?? 0}', Icons.timelapse_outlined, AppTheme.blue),
              _statCard('Total Hours', '${(s['totalHours'] ?? 0.0).toStringAsFixed(0)}h', Icons.timer_outlined, AppTheme.primary),
            ],
          ),
          const SizedBox(height: 14),
          // ── Today's records ─────────────────────────────────────────
          const _SectionLabel("Today's Records"),
          const SizedBox(height: 8),
          if (_today.isEmpty)
            _emptyCard('No attendance records for today')
          else
            ..._today.map((r) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _AttendanceRow(record: r, onCheckOut: () => _checkOut(r.employeeId)),
            )),
        ],
      ),
    );
  }

  Future<void> _checkOut(String employeeId) async {
    try {
      await _svc.checkOut(employeeId);
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Widget _heroStat(String label, String value, Color color) => Column(children: [
    Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color)),
    Text(label, style: const TextStyle(fontSize: 10, color: Colors.white60)),
  ]);

  Widget _statCard(String label, String value, IconData icon, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: AppTheme.border),
    ),
    child: Row(children: [
      Container(
        padding: const EdgeInsets.all(7),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, size: 14, color: color),
      ),
      const SizedBox(width: 10),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: color)),
        Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
      ]),
    ]),
  );
}

// ── Records Tab ───────────────────────────────────────────────────────────────

class _RecordsTab extends StatefulWidget {
  const _RecordsTab();
  @override
  State<_RecordsTab> createState() => _RecordsTabState();
}

class _RecordsTabState extends State<_RecordsTab> {
  final _svc = AttendanceService();
  final _empSvc = EmployeeService();
  List<Attendance> _records = [];
  List<Employee> _employees = [];
  bool _loading = true;
  String? _error;
  String _statusFilter = '';
  final _searchCtrl = TextEditingController();
  DateTime _start = DateTime.now().subtract(const Duration(days: 6));
  DateTime _end = DateTime.now();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([
        _svc.getByDateRange(_start, _end),
        _empSvc.getAll(),
      ]);
      if (!mounted) return;
      setState(() {
        _records = results[0] as List<Attendance>;
        _employees = results[1] as List<Employee>;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<Attendance> get _filtered {
    final q = _searchCtrl.text.toLowerCase();
    return _records.where((r) {
      final nameMatch = q.isEmpty ||
          r.employeeName.toLowerCase().contains(q) ||
          r.employeeId.toLowerCase().contains(q);
      final statusMatch = _statusFilter.isEmpty || r.status == _statusFilter;
      return nameMatch && statusMatch;
    }).toList();
  }

  Future<void> _pickRange() async {
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: DateTimeRange(start: _start, end: _end),
      builder: (c, child) => Theme(
        data: Theme.of(c).copyWith(colorScheme: const ColorScheme.light(primary: AppTheme.primary)),
        child: child!,
      ),
    );
    if (range != null) {
      setState(() { _start = range.start; _end = range.end; });
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      floatingActionButton: FloatingActionButton.small(
        backgroundColor: AppTheme.primary,
        onPressed: () => showDialog(
          context: context,
          builder: (_) => _MarkAttendanceDialog(employees: _employees, svc: _svc, onDone: _load),
        ),
        tooltip: 'Mark Attendance',
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: Column(children: [
        // ── Filters ──────────────────────────────────────────────────
        Container(
          color: Theme.of(context).cardColor,
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
          child: Column(children: [
            Row(children: [
              Expanded(
                child: GestureDetector(
                  onTap: _pickRange,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                    decoration: BoxDecoration(
                      border: Border.all(color: AppTheme.border),
                      borderRadius: BorderRadius.circular(8),
                      color: Colors.white,
                    ),
                    child: Row(children: [
                      const Icon(Icons.date_range_outlined, size: 15, color: AppTheme.textSecondary),
                      const SizedBox(width: 6),
                      Text(
                        '${AppTheme.fmtDate(_start)} – ${AppTheme.fmtDate(_end)}',
                        style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary),
                      ),
                    ]),
                  ),
                ),
              ),
            ]),
            const SizedBox(height: 8),
            TextField(
              controller: _searchCtrl,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                hintText: 'Search employee…',
                hintStyle: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                prefixIcon: const Icon(Icons.search, size: 18, color: AppTheme.textMuted),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 16, color: AppTheme.textMuted),
                        onPressed: () { _searchCtrl.clear(); setState(() {}); },
                      )
                    : null,
                filled: true,
                fillColor: Colors.white,
                contentPadding: EdgeInsets.zero,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.border)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.border)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 30,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _filterChip('All', ''),
                  _filterChip('Present', 'present'),
                  _filterChip('Late', 'late'),
                  _filterChip('Half Day', 'half-day'),
                  _filterChip('Absent', 'absent'),
                ],
              ),
            ),
          ]),
        ),
        // ── List ─────────────────────────────────────────────────────
        if (_loading)
          const Expanded(child: Center(child: CircularProgressIndicator(color: AppTheme.primary)))
        else if (_error != null)
          Expanded(child: _errorView(_error!, _load))
        else if (_filtered.isEmpty)
          const Expanded(child: Center(child: Text('No records found', style: TextStyle(color: AppTheme.textSecondary))))
        else
          Expanded(
            child: RefreshIndicator(
              onRefresh: _load,
              color: AppTheme.primary,
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 80),
                itemCount: _filtered.length,
                separatorBuilder: (context, index) => const SizedBox(height: 8),
                itemBuilder: (_, i) {
                  final r = _filtered[i];
                  return GestureDetector(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AttendanceDetailScreen(id: r.id))),
                    child: _AttendanceRow(record: r, onCheckOut: null),
                  );
                },
              ),
            ),
          ),
      ]),
    );
  }

  Widget _filterChip(String label, String value) {
    final sel = _statusFilter == value;
    final color = value == 'present' ? AppTheme.green
        : value == 'late' ? AppTheme.amber
        : value == 'half-day' ? AppTheme.blue
        : value == 'absent' ? AppTheme.red
        : AppTheme.primary;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: GestureDetector(
        onTap: () => setState(() => _statusFilter = sel ? '' : value),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: sel ? color : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: sel ? color : AppTheme.border),
          ),
          child: Text(label, style: TextStyle(
            fontSize: 11,
            fontWeight: sel ? FontWeight.w700 : FontWeight.normal,
            color: sel ? Colors.white : AppTheme.textSecondary,
          )),
        ),
      ),
    );
  }
}

// ── Insights Tab ──────────────────────────────────────────────────────────────

class _InsightsTab extends StatefulWidget {
  const _InsightsTab();
  @override
  State<_InsightsTab> createState() => _InsightsTabState();
}

class _InsightsTabState extends State<_InsightsTab> {
  final _svc = AttendanceService();
  List<Attendance> _records = [];
  Map<String, dynamic>? _stats;
  bool _loading = true;
  String? _error;
  final _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });
    try {
      // Last 30 days for heatmap + monthly stats
      final start = DateTime(_now.year, _now.month, 1);
      final results = await Future.wait([
        _svc.getByDateRange(start, _now),
        _svc.getStats(month: _now.month, year: _now.year),
      ]);
      if (!mounted) return;
      setState(() {
        _records = results[0] as List<Attendance>;
        _stats = results[1] as Map<String, dynamic>;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  // Build day-level map: date string → status
  Map<String, String> get _dayMap {
    final map = <String, String>{};
    for (final r in _records) {
      final key = r.date.toLocal().toIso8601String().split('T')[0];
      map[key] = r.status;
    }
    return map;
  }

  // Weekly trend: last 7 days, hours per day
  List<_DayBar> get _weekBars {
    final map = <String, double>{};
    for (final r in _records) {
      final key = r.date.toLocal().toIso8601String().split('T')[0];
      map[key] = (map[key] ?? 0) + r.totalHours;
    }
    final bars = <_DayBar>[];
    for (int i = 6; i >= 0; i--) {
      final d = _now.subtract(Duration(days: i));
      final key = d.toIso8601String().split('T')[0];
      bars.add(_DayBar(
        label: _weekdayShort(d.weekday),
        hours: map[key] ?? 0,
        date: d,
      ));
    }
    return bars;
  }

  String _weekdayShort(int w) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][w - 1];

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_error != null) return _errorView(_error!, _load);

    final s = _stats!;
    final totalDays = (s['totalDays'] ?? 0) as int;
    final presentDays = (s['presentDays'] ?? 0) as int;
    final avgHours = (s['averageHours'] ?? 0.0).toDouble();
    final totalHours = (s['totalHours'] ?? 0.0).toDouble();
    final bars = _weekBars;
    final maxHours = bars.map((b) => b.hours).fold(0.0, (a, b) => a > b ? a : b);

    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.primary,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Monthly summary ─────────────────────────────────────────
          const _SectionLabel('Monthly Summary'),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(child: _insightCard('Attendance Rate',
                totalDays > 0 ? '${(presentDays / totalDays * 100).toStringAsFixed(0)}%' : '—',
                Icons.percent_outlined, AppTheme.green)),
            const SizedBox(width: 10),
            Expanded(child: _insightCard('Avg Hours/Day',
                '${avgHours.toStringAsFixed(1)}h',
                Icons.timer_outlined, AppTheme.blue)),
            const SizedBox(width: 10),
            Expanded(child: _insightCard('Total Hours',
                '${totalHours.toStringAsFixed(0)}h',
                Icons.access_time_outlined, AppTheme.primary)),
          ]),
          const SizedBox(height: 16),
          // ── 7-day trend ─────────────────────────────────────────────
          const _SectionLabel('Last 7 Days — Hours Worked'),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.fromLTRB(12, 14, 12, 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: bars.map((b) {
                final frac = maxHours > 0 ? b.hours / maxHours : 0.0;
                final isToday = b.date.day == _now.day &&
                    b.date.month == _now.month &&
                    b.date.year == _now.year;
                final color = isToday ? AppTheme.primary : AppTheme.blue.withValues(alpha: 0.6);
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: Column(children: [
                      if (b.hours > 0)
                        Text(
                          b.hours.toStringAsFixed(1),
                          style: TextStyle(fontSize: 8, color: color, fontWeight: FontWeight.w700),
                        ),
                      const SizedBox(height: 2),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: Container(
                          height: 80 * frac.clamp(0.05, 1.0),
                          color: color,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(b.label, style: TextStyle(
                        fontSize: 10,
                        color: isToday ? AppTheme.primary : AppTheme.textMuted,
                        fontWeight: isToday ? FontWeight.w700 : FontWeight.normal,
                      )),
                    ]),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 16),
          // ── Monthly heatmap ─────────────────────────────────────────
          const _SectionLabel('Monthly Heatmap'),
          const SizedBox(height: 10),
          _MonthHeatmap(month: _now.month, year: _now.year, dayMap: _dayMap),
          const SizedBox(height: 16),
          // ── Status breakdown ────────────────────────────────────────
          const _SectionLabel('Status Breakdown'),
          const SizedBox(height: 8),
          _StatusBreakdown(records: _records),
        ],
      ),
    );
  }

  Widget _insightCard(String label, String value, IconData icon, Color color) => Container(
    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: AppTheme.border),
    ),
    child: Column(children: [
      Icon(icon, size: 16, color: color),
      const SizedBox(height: 6),
      FittedBox(fit: BoxFit.scaleDown, child: Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color))),
      Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textMuted), textAlign: TextAlign.center),
    ]),
  );
}

class _DayBar {
  final String label;
  final double hours;
  final DateTime date;
  const _DayBar({required this.label, required this.hours, required this.date});
}

// ── Monthly Heatmap ───────────────────────────────────────────────────────────

class _MonthHeatmap extends StatelessWidget {
  final int month, year;
  final Map<String, String> dayMap;
  const _MonthHeatmap({required this.month, required this.year, required this.dayMap});

  Color _color(String? status) => switch (status) {
    'present' => AppTheme.green,
    'late' => AppTheme.amber,
    'half-day' => AppTheme.blue,
    'absent' => AppTheme.red,
    _ => const Color(0xFFE5E7EB),
  };

  @override
  Widget build(BuildContext context) {
    final daysInMonth = DateUtils.getDaysInMonth(year, month);
    final firstWeekday = DateTime(year, month, 1).weekday; // 1=Mon
    final cells = <Widget>[];

    // Day-of-week headers
    for (final d in ['M', 'T', 'W', 'T', 'F', 'S', 'S']) {
      cells.add(Center(child: Text(d, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted))));
    }

    // Empty leading cells
    for (int i = 1; i < firstWeekday; i++) {
      cells.add(const SizedBox());
    }

    for (int day = 1; day <= daysInMonth; day++) {
      final key = '${year.toString().padLeft(4, '0')}-${month.toString().padLeft(2, '0')}-${day.toString().padLeft(2, '0')}';
      final status = dayMap[key];
      final isToday = DateTime.now().day == day && DateTime.now().month == month && DateTime.now().year == year;
      cells.add(Container(
        margin: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          color: _color(status),
          borderRadius: BorderRadius.circular(4),
          border: isToday ? Border.all(color: AppTheme.primary, width: 1.5) : null,
        ),
        child: Center(child: Text('$day', style: TextStyle(
          fontSize: 9,
          fontWeight: isToday ? FontWeight.w800 : FontWeight.normal,
          color: status != null && status != 'absent' ? Colors.white : AppTheme.textMuted,
        ))),
      ));
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(children: [
        GridView.count(
          crossAxisCount: 7,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 1,
          children: cells,
        ),
        const SizedBox(height: 10),
        // Legend
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          _legend('Present', AppTheme.green),
          const SizedBox(width: 12),
          _legend('Late', AppTheme.amber),
          const SizedBox(width: 12),
          _legend('Half Day', AppTheme.blue),
          const SizedBox(width: 12),
          _legend('Absent', AppTheme.red),
        ]),
      ]),
    );
  }

  Widget _legend(String label, Color color) => Row(mainAxisSize: MainAxisSize.min, children: [
    Container(width: 10, height: 10, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
    const SizedBox(width: 4),
    Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textMuted)),
  ]);
}

// ── Status Breakdown ──────────────────────────────────────────────────────────

class _StatusBreakdown extends StatelessWidget {
  final List<Attendance> records;
  const _StatusBreakdown({required this.records});

  @override
  Widget build(BuildContext context) {
    final counts = <String, int>{};
    for (final r in records) {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    }
    final total = records.length;
    if (total == 0) return _emptyCard('No data for this period');

    final statuses = ['present', 'late', 'half-day', 'absent'];
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: statuses.map((s) {
          final count = counts[s] ?? 0;
          final frac = count / total;
          final color = AppTheme.statusColor(s);
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(children: [
              SizedBox(width: 64, child: Text(s, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500))),
              Expanded(child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: frac,
                  minHeight: 14,
                  backgroundColor: color.withValues(alpha: 0.1),
                  valueColor: AlwaysStoppedAnimation(color),
                ),
              )),
              const SizedBox(width: 8),
              SizedBox(width: 36, child: Text('$count', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color), textAlign: TextAlign.end)),
            ]),
          );
        }).toList(),
      ),
    );
  }
}

// ── Shared Widgets ────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);
  @override
  Widget build(BuildContext context) => Text(
    text.toUpperCase(),
    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8),
  );
}

class _AttendanceRow extends StatelessWidget {
  final Attendance record;
  final VoidCallback? onCheckOut;
  const _AttendanceRow({required this.record, required this.onCheckOut});

  @override
  Widget build(BuildContext context) {
    final r = record;
    final statusColor = AppTheme.statusColor(r.status);
    final checkIn = AppTheme.fmtTime(r.checkIn);
    final checkOut = r.checkOut != null ? AppTheme.fmtTime(r.checkOut!) : '--:--';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(children: [
        Container(width: 3, height: 36, decoration: BoxDecoration(color: statusColor, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(
            r.employeeName.isNotEmpty ? r.employeeName : r.employeeId,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 2),
          Text(
            '${AppTheme.fmtDate(r.date)}  ·  In: $checkIn  Out: $checkOut  ·  ${r.totalHours.toStringAsFixed(1)}h',
            style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
          ),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
            child: Text(r.status, style: TextStyle(fontSize: 11, color: statusColor, fontWeight: FontWeight.w600)),
          ),
          if (onCheckOut != null && r.checkOut == null) ...[
            const SizedBox(height: 4),
            GestureDetector(
              onTap: onCheckOut,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
                ),
                child: const Text('Check Out', style: TextStyle(fontSize: 10, color: AppTheme.primary, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ]),
      ]),
    );
  }
}

Widget _emptyCard(String msg) => Container(
  padding: const EdgeInsets.all(20),
  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
  child: Center(child: Text(msg, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13))),
);

Widget _errorView(String error, VoidCallback onRetry) => Center(
  child: Column(mainAxisSize: MainAxisSize.min, children: [
    const Icon(Icons.error_outline, color: AppTheme.red, size: 36),
    const SizedBox(height: 8),
    Text(error, style: const TextStyle(color: AppTheme.red), textAlign: TextAlign.center),
    TextButton(onPressed: onRetry, child: const Text('Retry')),
  ]),
);

// ── Mark Attendance Dialog ────────────────────────────────────────────────────

class _MarkAttendanceDialog extends StatefulWidget {
  final List<Employee> employees;
  final AttendanceService svc;
  final VoidCallback onDone;
  const _MarkAttendanceDialog({required this.employees, required this.svc, required this.onDone});
  @override
  State<_MarkAttendanceDialog> createState() => _MarkAttendanceDialogState();
}

class _MarkAttendanceDialogState extends State<_MarkAttendanceDialog> {
  String? _empId;
  String _status = 'present';
  TimeOfDay _checkIn = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay _checkOut = const TimeOfDay(hour: 17, minute: 0);
  DateTime _date = DateTime.now();
  final _notesCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() { _notesCtrl.dispose(); super.dispose(); }

  Future<void> _pickDate() async {
    final p = await showDatePicker(
      context: context, initialDate: _date,
      firstDate: DateTime(2020), lastDate: DateTime.now(),
      builder: (c, child) => Theme(
        data: Theme.of(c).copyWith(colorScheme: const ColorScheme.light(primary: AppTheme.primary)),
        child: child!,
      ),
    );
    if (p != null) setState(() => _date = p);
  }

  Future<void> _pickTime(bool isIn) async {
    final p = await showTimePicker(context: context, initialTime: isIn ? _checkIn : _checkOut);
    if (p != null) setState(() => isIn ? _checkIn = p : _checkOut = p);
  }

  String _fmt(TimeOfDay t) => '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  Future<void> _submit() async {
    if (_empId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select an employee')));
      return;
    }
    setState(() => _loading = true);
    try {
      final dateStr = _date.toIso8601String().split('T')[0];
      await widget.svc.markAttendance({
        'employee': _empId,
        'date': dateStr,
        'status': _status,
        'checkIn': '${dateStr}T${_fmt(_checkIn)}:00',
        'checkOut': '${dateStr}T${_fmt(_checkOut)}:00',
        if (_notesCtrl.text.trim().isNotEmpty) 'notes': _notesCtrl.text.trim(),
      });
      if (mounted) Navigator.pop(context);
      widget.onDone();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Text('Mark Attendance', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
      content: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
        DropdownButtonFormField<String>(
          initialValue: _empId,
          decoration: const InputDecoration(labelText: 'Employee'),
          items: widget.employees.map((e) => DropdownMenuItem(value: e.id, child: Text(e.fullName, style: const TextStyle(fontSize: 13)))).toList(),
          onChanged: (v) => setState(() => _empId = v),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: _status,
          decoration: const InputDecoration(labelText: 'Status'),
          items: ['present', 'late', 'half-day', 'absent']
              .map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
          onChanged: (v) => setState(() => _status = v!),
        ),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: _pickDate,
          child: InputDecorator(
            decoration: const InputDecoration(labelText: 'Date', suffixIcon: Icon(Icons.calendar_today_outlined, size: 16)),
            child: Text(AppTheme.fmtDate(_date), style: const TextStyle(fontSize: 13)),
          ),
        ),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: GestureDetector(
            onTap: () => _pickTime(true),
            child: InputDecorator(
              decoration: const InputDecoration(labelText: 'Check-in', suffixIcon: Icon(Icons.access_time, size: 16)),
              child: Text(_fmt(_checkIn), style: const TextStyle(fontSize: 13)),
            ),
          )),
          const SizedBox(width: 8),
          Expanded(child: GestureDetector(
            onTap: () => _pickTime(false),
            child: InputDecorator(
              decoration: const InputDecoration(labelText: 'Check-out', suffixIcon: Icon(Icons.access_time, size: 16)),
              child: Text(_fmt(_checkOut), style: const TextStyle(fontSize: 13)),
            ),
          )),
        ]),
        const SizedBox(height: 12),
        TextField(
          controller: _notesCtrl,
          maxLines: 2,
          decoration: const InputDecoration(labelText: 'Notes (optional)'),
        ),
      ])),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
          onPressed: _loading ? null : _submit,
          child: _loading
              ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Save', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}
