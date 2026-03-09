import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/employee.dart';
import '../../services/employee_service.dart';
import '../../services/attendance_service.dart';
import '../../services/leave_service.dart';
import 'employee_detail_screen.dart';
import 'employee_form_screen.dart';
import 'widgets/org_attendance_screen.dart';
import 'widgets/org_leaves_screen.dart';

// ── Tab shell: Directory / Attendance / Leaves ────────────────────────────────

class EmployeeListScreen extends StatefulWidget {
  const EmployeeListScreen({super.key});
  @override
  State<EmployeeListScreen> createState() => _EmployeeListScreenState();
}

class _EmployeeListScreenState extends State<EmployeeListScreen>
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
            Tab(icon: Icon(Icons.people_outline, size: 16), text: 'Directory'),
            Tab(icon: Icon(Icons.access_time_outlined, size: 16), text: 'Attendance'),
            Tab(icon: Icon(Icons.event_note_outlined, size: 16), text: 'Leaves'),
          ],
        ),
      ),
      Expanded(
        child: TabBarView(controller: _tabs, children: const [
          _EmployeeDirectoryScreen(),
          OrgAttendanceScreen(),
          OrgLeavesScreen(),
        ]),
      ),
    ]);
  }
}

// ── Employee Directory ────────────────────────────────────────────────────────

class _EmployeeDirectoryScreen extends StatefulWidget {
  const _EmployeeDirectoryScreen();
  @override
  State<_EmployeeDirectoryScreen> createState() => _EmployeeDirectoryScreenState();
}

class _EmployeeDirectoryScreenState extends State<_EmployeeDirectoryScreen> {
  final _service = EmployeeService();
  final _attSvc = AttendanceService();
  final _lvSvc = LeaveService();
  int _active = 0, _inactive = 0, _terminated = 0;
  int _presentToday = 0, _onLeaveToday = 0;
  final _searchCtrl = TextEditingController();
  List<Employee> _all = [], _filtered = [];
  String _statusFilter = '', _yearFilter = '', _deptFilter = '', _positionFilter = '';
  bool _loading = true;
  String? _error;

  static const _avatarColors = [
    AppTheme.primary, AppTheme.blue, AppTheme.purple,
    AppTheme.cyan, AppTheme.teal, AppTheme.amber,
  ];
  Color _avatarColor(String n) => _avatarColors[n.codeUnitAt(0) % _avatarColors.length];

  @override
  void initState() { super.initState(); _load(); }

  @override
  void dispose() { _searchCtrl.dispose(); super.dispose(); }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([
        _service.getAll(),
        _attSvc.getTodayStats(),
        _lvSvc.getToday(),
      ]);
      if (!mounted) return;
      final data = results[0] as List<Employee>;
      final todayAtt = results[1] as Map<String, int>;
      final todayLeaves = results[2] as List;
      _all = data;
      _active = data.where((e) => e.status == 'active').length;
      _inactive = data.where((e) => e.status == 'inactive').length;
      _terminated = data.where((e) => e.status == 'terminated').length;
      _presentToday = todayAtt['present']! + todayAtt['late']!;
      _onLeaveToday = todayLeaves.length;
      setState(() { _filtered = _filter(_all); _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<Employee> _filter(List<Employee> src) {
    final q = _searchCtrl.text.toLowerCase();
    return src.where((e) {
      final match = q.isEmpty || e.fullName.toLowerCase().contains(q) ||
          e.email.toLowerCase().contains(q) ||
          e.employeeId.toLowerCase().contains(q) ||
          (e.department ?? '').toLowerCase().contains(q);
      final yearMatch = _yearFilter.isEmpty ||
          (e.hireDate != null && e.hireDate!.year.toString() == _yearFilter);
      final deptMatch = _deptFilter.isEmpty ||
          (e.department ?? '').toLowerCase() == _deptFilter.toLowerCase() ||
          e.departments.any((d) => d.toLowerCase() == _deptFilter.toLowerCase());
      final posMatch = _positionFilter.isEmpty ||
          e.position.toLowerCase().contains(_positionFilter.toLowerCase());
      return match && (_statusFilter.isEmpty || e.status == _statusFilter) && yearMatch && deptMatch && posMatch;
    }).toList();
  }

  void _applyFilter() => setState(() => _filtered = _filter(_all));

  Future<void> _delete(Employee e) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: const Text('Delete Employee'),
        content: Text('Delete ${e.fullName}? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await _service.deleteEmployee(e.id);
      _load();
    } catch (err) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$err')));
    }
  }

  List<String> _deptOptions() {
    final depts = <String>{};
    for (final e in _all) {
      if ((e.department ?? '').isNotEmpty) depts.add(e.department!);
      depts.addAll(e.departments);
    }
    return depts.toList()..sort();
  }

  List<String> _positionOptions() =>
      _all.map((e) => e.position).where((p) => p.isNotEmpty).toSet().toList()..sort();

  List<String> _yearOptions() => _all
      .where((e) => e.hireDate != null)
      .map((e) => e.hireDate!.year.toString())
      .toSet()
      .toList()
        ..sort((a, b) => b.compareTo(a));

  Color _sc(String s) => AppTheme.statusColor(s);
  Color _sb(String s) => AppTheme.statusBg(s);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      floatingActionButton: FloatingActionButton(
        heroTag: 'emp_list_fab',
        backgroundColor: AppTheme.primary,
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute(builder: (_) => const EmployeeFormScreen()));
          _load();
        },
        child: const Icon(Icons.person_add_outlined, color: Colors.white),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 36),
                  const SizedBox(height: 8),
                  Text(_error!, style: const TextStyle(color: Color(0xFFDC2626)), textAlign: TextAlign.center),
                  TextButton(onPressed: _load, child: const Text('Retry')),
                ]))
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppTheme.primary,
                  child: CustomScrollView(
                    slivers: [
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                          child: Column(children: [
                            LayoutBuilder(builder: (ctx, c) {
                              final cols = c.maxWidth < 340 ? 2 : 4;
                              final spacing = 8.0 * (cols - 1);
                              final tileW = (c.maxWidth - spacing) / cols;
                              return GridView.count(
                                crossAxisCount: cols,
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                crossAxisSpacing: 8,
                                childAspectRatio: tileW / 64,
                                children: [
                                  _statTile('Total', _all.length, AppTheme.primary),
                                  _statTile('Active', _active, const Color(0xFF16A34A)),
                                  _statTile('Inactive', _inactive, const Color(0xFFD97706)),
                                  _statTile('Left', _terminated, const Color(0xFFDC2626)),
                                ],
                              );
                            }),
                            const SizedBox(height: 8),
                            Row(children: [
                              Expanded(child: _actionStatTile('Present Today', _presentToday, const Color(0xFF0891B2), Icons.login_outlined)),
                              const SizedBox(width: 8),
                              Expanded(child: _actionStatTile('On Leave', _onLeaveToday, const Color(0xFF7C3AED), Icons.event_busy_outlined)),
                            ]),
                          ]),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: _FilterBar(
                          searchCtrl: _searchCtrl,
                          deptFilter: _deptFilter,
                          positionFilter: _positionFilter,
                          statusFilter: _statusFilter,
                          yearFilter: _yearFilter,
                          deptOptions: _deptOptions(),
                          positionOptions: _positionOptions(),
                          yearOptions: _yearOptions(),
                          onSearch: (_) => _applyFilter(),
                          onClearSearch: () { _searchCtrl.clear(); _applyFilter(); },
                          onDeptChanged: (v) { _deptFilter = v ?? ''; _applyFilter(); },
                          onPositionChanged: (v) { _positionFilter = v ?? ''; _applyFilter(); },
                          onStatusChanged: (v) { setState(() => _statusFilter = v); },
                          onYearChanged: (v) { setState(() => _yearFilter = v); },
                        ),
                      ),
                      _filtered.isEmpty
                          ? SliverFillRemaining(
                              child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                                Icon(Icons.people_outline, size: 44, color: Colors.grey.shade300),
                                const SizedBox(height: 8),
                                const Text('No employees found', style: TextStyle(color: Color(0xFF6B7280))),
                              ])),
                            )
                          : SliverPadding(
                              padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                              sliver: SliverList(
                                delegate: SliverChildBuilderDelegate(
                                  (_, i) => _card(_filtered[i]),
                                  childCount: _filtered.length,
                                ),
                              ),
                            ),
                    ],
                  ),
                ),
    );
  }

  Widget _statTile(String label, int count, Color color) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          FittedBox(fit: BoxFit.scaleDown, child: Text('$count', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: color))),
          const SizedBox(height: 2),
          FittedBox(fit: BoxFit.scaleDown, child: Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF6B7280), fontWeight: FontWeight.w500))),
        ]),
      );

  Widget _actionStatTile(String label, int count, Color color, IconData icon) =>
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.07),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Row(children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('$count', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: color)),
            Text(label, style: TextStyle(fontSize: 9, color: color.withValues(alpha: 0.8), fontWeight: FontWeight.w500)),
          ])),
        ]),
      );

  Widget _card(Employee e) {
    final color = _avatarColor(e.firstName);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () async {
            await Navigator.push(context, MaterialPageRoute(builder: (_) => EmployeeDetailScreen(id: e.id)));
            _load();
          },
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Row(children: [
              Container(width: 3, color: _sc(e.status)),
              const SizedBox(width: 10),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                  child: Center(child: Text(
                    e.firstName[0].toUpperCase() + (e.lastName.isNotEmpty ? e.lastName[0].toUpperCase() : ''),
                    style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 13),
                  )),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text(e.fullName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF111827))),
                    const SizedBox(height: 1),
                    Text(e.position, style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280))),
                    const SizedBox(height: 3),
                    Row(children: [
                      const Icon(Icons.badge_outlined, size: 9, color: Color(0xFF9CA3AF)),
                      const SizedBox(width: 2),
                      Text(e.employeeId, style: const TextStyle(fontSize: 9, color: Color(0xFF9CA3AF))),
                      if ((e.department ?? '').isNotEmpty || e.departments.isNotEmpty) ...[
                        const SizedBox(width: 5),
                        const Icon(Icons.business_outlined, size: 9, color: Color(0xFF9CA3AF)),
                        const SizedBox(width: 2),
                        Flexible(child: Text(
                          e.departments.isNotEmpty ? e.departments.join(', ') : e.department!,
                          style: const TextStyle(fontSize: 9, color: Color(0xFF9CA3AF)),
                          overflow: TextOverflow.ellipsis,
                        )),
                      ],
                    ]),
                  ]),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(0, 8, 8, 8),
                child: Column(mainAxisAlignment: MainAxisAlignment.spaceBetween, crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(color: _sb(e.status), borderRadius: BorderRadius.circular(20)),
                    child: Text(e.status, style: TextStyle(color: _sc(e.status), fontSize: 10, fontWeight: FontWeight.w600)),
                  ),
                  Row(children: [
                    _iconBtn(Icons.edit_outlined, const Color(0xFF6B7280), () async {
                      await Navigator.push(context, MaterialPageRoute(builder: (_) => EmployeeFormScreen(employee: e)));
                      _load();
                    }),
                    const SizedBox(width: 4),
                    _iconBtn(Icons.delete_outline, const Color(0xFFDC2626), () => _delete(e)),
                  ]),
                ]),
              ),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _iconBtn(IconData icon, Color color, VoidCallback onTap) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(6),
        child: Padding(
          padding: const EdgeInsets.all(4),
          child: Icon(icon, size: 16, color: color),
        ),
      );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

class _FilterBar extends StatelessWidget {
  final TextEditingController searchCtrl;
  final String deptFilter, positionFilter, statusFilter, yearFilter;
  final List<String> deptOptions, positionOptions, yearOptions;
  final ValueChanged<String> onSearch;
  final VoidCallback onClearSearch;
  final ValueChanged<String?> onDeptChanged, onPositionChanged;
  final ValueChanged<String> onStatusChanged, onYearChanged;

  const _FilterBar({
    required this.searchCtrl,
    required this.deptFilter,
    required this.positionFilter,
    required this.statusFilter,
    required this.yearFilter,
    required this.deptOptions,
    required this.positionOptions,
    required this.yearOptions,
    required this.onSearch,
    required this.onClearSearch,
    required this.onDeptChanged,
    required this.onPositionChanged,
    required this.onStatusChanged,
    required this.onYearChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF8F9FA),
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 8),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(
          controller: searchCtrl,
          onChanged: onSearch,
          decoration: InputDecoration(
            hintText: 'Search name, ID, department…',
            hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
            prefixIcon: const Icon(Icons.search, size: 18, color: Color(0xFF9CA3AF)),
            suffixIcon: searchCtrl.text.isNotEmpty
                ? IconButton(icon: const Icon(Icons.clear, size: 16, color: Color(0xFF9CA3AF)), onPressed: onClearSearch)
                : null,
            filled: true, fillColor: Colors.white,
            contentPadding: EdgeInsets.zero,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
          ),
        ),
        const SizedBox(height: 6),
        Row(children: [
          Expanded(child: _dropdown('Department', deptFilter, deptOptions, onDeptChanged)),
          const SizedBox(width: 8),
          Expanded(child: _dropdown('Position', positionFilter, positionOptions, onPositionChanged)),
        ]),
        const SizedBox(height: 6),
        SizedBox(
          height: 32,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _chip('All', '', statusFilter, AppTheme.primary, onStatusChanged),
              _chip('Active', 'active', statusFilter, AppTheme.primary, onStatusChanged),
              _chip('Inactive', 'inactive', statusFilter, AppTheme.primary, onStatusChanged),
              _chip('Terminated', 'terminated', statusFilter, AppTheme.primary, onStatusChanged),
              const SizedBox(width: 8),
              Container(width: 1, height: 20, margin: const EdgeInsets.symmetric(vertical: 6), color: const Color(0xFFE5E7EB)),
              const SizedBox(width: 8),
              _chip('All Years', '', yearFilter, AppTheme.blue, onYearChanged),
              ...yearOptions.map((y) => _chip(y, y, yearFilter, AppTheme.blue, onYearChanged)),
            ],
          ),
        ),
      ]),
    );
  }

  Widget _dropdown(String hint, String value, List<String> options, ValueChanged<String?> onChange) =>
      DropdownButtonFormField<String>(
        initialValue: value.isEmpty ? null : value,
        isDense: true,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
          filled: true, fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
        ),
        items: [
          DropdownMenuItem<String>(value: null, child: Text('All $hint', style: const TextStyle(fontSize: 12))),
          ...options.map((o) => DropdownMenuItem(value: o, child: Text(o, style: const TextStyle(fontSize: 12), overflow: TextOverflow.ellipsis))),
        ],
        onChanged: (v) => onChange(v),
      );

  Widget _chip(String label, String value, String current, Color color, ValueChanged<String> onTap) {
    final sel = current == value;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: GestureDetector(
        onTap: () => onTap(sel ? '' : value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
          decoration: BoxDecoration(
            color: sel ? color : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: sel ? color : const Color(0xFFE5E7EB)),
          ),
          child: Text(label, style: TextStyle(
            fontSize: 12, fontWeight: sel ? FontWeight.w600 : FontWeight.normal,
            color: sel ? Colors.white : const Color(0xFF6B7280),
          )),
        ),
      ),
    );
  }
}
