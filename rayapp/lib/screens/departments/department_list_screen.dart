import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/department.dart';
import '../../services/department_service.dart';
import 'department_detail_screen.dart';
import 'department_form_screen.dart';

class DepartmentListScreen extends StatefulWidget {
  const DepartmentListScreen({super.key});
  @override
  State<DepartmentListScreen> createState() => _DepartmentListScreenState();
}

class _DepartmentListScreenState extends State<DepartmentListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<Department> _all = [];
  DepartmentStats? _stats;
  bool _loading = true;
  String _search = '';
  String _status = 'all';

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        DepartmentService().getAll(search: _search, status: _status),
        DepartmentService().getStats().catchError((_) => DepartmentStats(
            total: 0, active: 0, totalEmployees: 0, totalBudget: 0, avgTeamSize: 0)),
      ]);
      _all = results[0] as List<Department>;
      _stats = results[1] as DepartmentStats;
    } catch (_) {}
    setState(() => _loading = false);
  }

  List<Department> get _filtered => _all.where((d) {
        final q = _search.toLowerCase();
        return (q.isEmpty || d.name.toLowerCase().contains(q) || d.location.toLowerCase().contains(q)) &&
            (_status == 'all' || d.status == _status);
      }).toList();

  Future<void> _delete(Department d) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Department'),
        content: Text('Delete "${d.name}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: AppTheme.red)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await DepartmentService().deleteDepartment(d.id);
      setState(() => _all.removeWhere((x) => x.id == d.id));
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Department deleted')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _goDetail(Department d) async {
    await Navigator.push(context, MaterialPageRoute(builder: (_) => DepartmentDetailScreen(id: d.id)));
    _load();
  }

  void _goEdit(Department d) async {
    final updated = await Navigator.push<bool>(context,
        MaterialPageRoute(builder: (_) => DepartmentFormScreen(department: d)));
    if (updated == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    final active = _filtered.where((d) => d.status == 'active').toList();
    final inactive = _filtered.where((d) => d.status == 'inactive').toList();

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Departments'),
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          indicatorSize: TabBarIndicatorSize.label,
          tabs: [
            Tab(text: 'All (${_filtered.length})'),
            Tab(text: 'Active (${active.length})'),
            Tab(text: 'Inactive (${inactive.length})'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        onPressed: () async {
          final created = await Navigator.push<bool>(
              context, MaterialPageRoute(builder: (_) => const DepartmentFormScreen()));
          if (created == true) _load();
        },
        child: const Icon(Icons.add),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _DeptTab(loading: _loading, departments: _filtered, stats: _stats,
              search: _search, status: _status, onRefresh: _load,
              onSearch: (v) { setState(() => _search = v); _load(); },
              onStatus: (v) { setState(() => _status = v); _load(); },
              onTap: _goDetail, onEdit: _goEdit, onDelete: _delete),
          _DeptTab(loading: _loading, departments: active, stats: null,
              search: _search, status: 'active', onRefresh: _load,
              onSearch: (v) { setState(() => _search = v); _load(); },
              onStatus: (_) {}, onTap: _goDetail, onEdit: _goEdit, onDelete: _delete),
          _DeptTab(loading: _loading, departments: inactive, stats: null,
              search: _search, status: 'inactive', onRefresh: _load,
              onSearch: (v) { setState(() => _search = v); _load(); },
              onStatus: (_) {}, onTap: _goDetail, onEdit: _goEdit, onDelete: _delete),
        ],
      ),
    );
  }
}

// ── Dept Tab ──────────────────────────────────────────────────────────────────

class _DeptTab extends StatelessWidget {
  final bool loading;
  final List<Department> departments;
  final DepartmentStats? stats;
  final String search, status;
  final Future<void> Function() onRefresh;
  final ValueChanged<String> onSearch, onStatus;
  final void Function(Department) onTap, onEdit, onDelete;

  const _DeptTab({
    required this.loading, required this.departments, required this.stats,
    required this.search, required this.status, required this.onRefresh,
    required this.onSearch, required this.onStatus,
    required this.onTap, required this.onEdit, required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppTheme.primary,
      child: CustomScrollView(
        slivers: [
          if (stats != null) _StatsBar(stats: stats!),
          _SearchBar(search: search, status: status, onSearch: onSearch, onStatus: onStatus),
          departments.isEmpty
              ? SliverFillRemaining(
                  child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.business_outlined, size: 48, color: AppTheme.textMuted),
                    const SizedBox(height: 12),
                    const Text('No departments found', style: TextStyle(color: AppTheme.textSecondary)),
                  ])),
                )
              : SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (_, i) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _DeptCard(
                          dept: departments[i],
                          onTap: () => onTap(departments[i]),
                          onEdit: () => onEdit(departments[i]),
                          onDelete: () => onDelete(departments[i]),
                        ),
                      ),
                      childCount: departments.length,
                    ),
                  ),
                ),
        ],
      ),
    );
  }
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────

class _StatsBar extends StatelessWidget {
  final DepartmentStats stats;
  const _StatsBar({required this.stats});

  @override
  Widget build(BuildContext context) => SliverToBoxAdapter(
    child: SizedBox(
      height: 60,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        children: [
          _StatTile('Total', '${stats.total}', Icons.business_outlined, AppTheme.primary),
          _StatTile('Active', '${stats.active}', Icons.check_circle_outline, AppTheme.green),
          _StatTile('Employees', '${stats.totalEmployees}', Icons.people_outline, AppTheme.blue),
          _StatTile('Avg Size', stats.avgTeamSize.toStringAsFixed(1), Icons.group_outlined, AppTheme.purple),
        ],
      ),
    ),
  );
}

class _StatTile extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  const _StatTile(this.label, this.value, this.icon, this.color);

  @override
  Widget build(BuildContext context) => Container(
    width: 96,
    margin: const EdgeInsets.only(right: 8),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppTheme.border)),
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
    child: Row(children: [
      Container(
        width: 24, height: 24,
        decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(5)),
        child: Icon(icon, color: color, size: 13),
      ),
      const SizedBox(width: 6),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
        FittedBox(child: Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: color))),
        Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary)),
      ])),
    ]),
  );
}

// ── Search Bar ────────────────────────────────────────────────────────────────

class _SearchBar extends StatelessWidget {
  final String search, status;
  final ValueChanged<String> onSearch, onStatus;
  const _SearchBar({required this.search, required this.status, required this.onSearch, required this.onStatus});

  @override
  Widget build(BuildContext context) => SliverToBoxAdapter(
    child: Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Column(children: [
        TextField(
          onChanged: onSearch,
          decoration: InputDecoration(
            hintText: 'Search departments…',
            prefixIcon: const Icon(Icons.search, size: 20),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
            filled: true, fillColor: Colors.white,
          ),
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: [
            _Chip('All', status == 'all', () => onStatus('all')),
            _Chip('Active', status == 'active', () => onStatus('active'), color: AppTheme.green),
            _Chip('Inactive', status == 'inactive', () => onStatus('inactive'), color: AppTheme.amber),
          ]),
        ),
      ]),
    ),
  );
}

class _Chip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color? color;
  const _Chip(this.label, this.selected, this.onTap, {this.color});

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppTheme.primary;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 6),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? c : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? c : AppTheme.border),
        ),
        child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500,
            color: selected ? Colors.white : AppTheme.textSecondary)),
      ),
    );
  }
}

// ── Dept Card ─────────────────────────────────────────────────────────────────

class _DeptCard extends StatelessWidget {
  final Department dept;
  final VoidCallback onTap, onEdit, onDelete;
  const _DeptCard({required this.dept, required this.onTap, required this.onEdit, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final isActive = dept.status == 'active';
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
          padding: const EdgeInsets.all(12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.business_outlined, color: AppTheme.primary, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(child: Text(dept.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.textPrimary))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isActive ? AppTheme.greenBg : AppTheme.amberBg,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(dept.status, style: TextStyle(color: isActive ? AppTheme.green : AppTheme.amber, fontSize: 11, fontWeight: FontWeight.w500)),
              ),
              const SizedBox(width: 4),
              GestureDetector(onTap: onEdit, child: const Icon(Icons.edit_outlined, size: 18, color: AppTheme.textSecondary)),
              const SizedBox(width: 4),
              GestureDetector(onTap: onDelete, child: const Icon(Icons.delete_outline, size: 18, color: AppTheme.red)),
            ]),
            if (dept.description.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(dept.description, maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
            ],
            const SizedBox(height: 8),
            Row(children: [
              const Icon(Icons.location_on_outlined, size: 12, color: AppTheme.textSecondary),
              const SizedBox(width: 3),
              Text(dept.location.isNotEmpty ? dept.location : '—',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
              const Spacer(),
              const Icon(Icons.people_outline, size: 12, color: AppTheme.textSecondary),
              const SizedBox(width: 3),
              Text('${dept.employeeCount}', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
              const SizedBox(width: 10),
              const Icon(Icons.account_balance_wallet_outlined, size: 12, color: AppTheme.textSecondary),
              const SizedBox(width: 3),
              Text('\$${dept.budget.toStringAsFixed(0)}', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
            ]),
            if (dept.manager != null) ...[
              const SizedBox(height: 4),
              Row(children: [
                const Icon(Icons.manage_accounts_outlined, size: 12, color: AppTheme.textSecondary),
                const SizedBox(width: 3),
                Text(dept.manager!.name, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
              ]),
            ],
          ]),
        ),
      ),
    );
  }
}
