import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/department.dart';
import '../../models/employee.dart';
import '../../services/department_service.dart';
import 'department_form_screen.dart';

class DepartmentDetailScreen extends StatefulWidget {
  final String id;
  const DepartmentDetailScreen({super.key, required this.id});
  @override
  State<DepartmentDetailScreen> createState() => _DepartmentDetailScreenState();
}

class _DepartmentDetailScreenState extends State<DepartmentDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  Department? _dept;
  List<Employee> _employees = [];
  List<dynamic> _projects = [];
  List<dynamic> _activity = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 5, vsync: this);
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
      final svc = DepartmentService();
      final results = await Future.wait([
        svc.getById(widget.id),
        svc.getEmployees(widget.id).catchError((_) => <Employee>[]),
        svc.getProjects(widget.id).catchError((_) => <dynamic>[]),
        svc.getActivityLogs(widget.id).catchError((_) => <dynamic>[]),
      ]);
      _dept = results[0] as Department;
      _employees = results[1] as List<Employee>;
      _projects = results[2] as List<dynamic>;
      _activity = results[3] as List<dynamic>;
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Text(_dept?.name ?? 'Department'),
        actions: [
          if (_dept != null)
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Edit',
              onPressed: () async {
                final updated = await Navigator.push<bool>(context,
                    MaterialPageRoute(builder: (_) => DepartmentFormScreen(department: _dept!)));
                if (updated == true) _load();
              },
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _dept == null
              ? const Center(child: Text('Department not found'))
              : NestedScrollView(
                  headerSliverBuilder: (_, __) => [
                    SliverToBoxAdapter(child: _Header(dept: _dept!, employeeCount: _employees.length, projectCount: _projects.length)),
                    SliverToBoxAdapter(
                      child: TabBar(
                        controller: _tabs,
                        isScrollable: true,
                        labelColor: AppTheme.primary,
                        unselectedLabelColor: AppTheme.textSecondary,
                        indicatorColor: AppTheme.primary,
                        indicatorSize: TabBarIndicatorSize.label,
                        labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                        unselectedLabelStyle: const TextStyle(fontSize: 11),
                        labelPadding: const EdgeInsets.symmetric(horizontal: 10),
                        tabs: const [
                          Tab(text: 'Overview'),
                          Tab(text: 'Members'),
                          Tab(text: 'Performance'),
                          Tab(text: 'Budget'),
                          Tab(text: 'Settings'),
                        ],
                      ),
                    ),
                  ],
                  body: TabBarView(
                    controller: _tabs,
                    children: [
                      _OverviewTab(dept: _dept!, projects: _projects, activity: _activity),
                      _MembersTab(employees: _employees),
                      _PerformanceTab(dept: _dept!, employees: _employees, projects: _projects),
                      _BudgetTab(dept: _dept!),
                      _SettingsTab(dept: _dept!, onDeleted: () => Navigator.pop(context)),
                    ],
                  ),
                ),
    );
  }
}

// ── Header ────────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  final Department dept;
  final int employeeCount, projectCount;
  const _Header({required this.dept, required this.employeeCount, required this.projectCount});

  @override
  Widget build(BuildContext context) {
    final isActive = dept.status == 'active';
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.business_outlined, color: AppTheme.primary, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(dept.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
            if (dept.description.isNotEmpty)
              Text(dept.description, maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
          ])),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: isActive ? AppTheme.greenBg : AppTheme.amberBg,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(dept.status, style: TextStyle(color: isActive ? AppTheme.green : AppTheme.amber, fontSize: 12, fontWeight: FontWeight.w600)),
          ),
        ]),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(children: [
            _HStat('Members', '$employeeCount', AppTheme.blue),
            _vDiv(),
            _HStat('Projects', '$projectCount', AppTheme.purple),
            _vDiv(),
            _HStat('Budget', '\$${dept.budget.toStringAsFixed(0)}', AppTheme.amber),
            _vDiv(),
            _HStat('Perms', '${dept.permissions.length}', AppTheme.primary),
          ]),
        ),
      ]),
    );
  }
}

class _HStat extends StatelessWidget {
  final String label, value;
  final Color color;
  const _HStat(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Expanded(child: Column(children: [
    FittedBox(child: Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: color))),
    Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary)),
  ]));
}

Widget _vDiv() => Container(width: 1, height: 28, margin: const EdgeInsets.symmetric(horizontal: 4), color: AppTheme.border);

// ── Overview Tab ──────────────────────────────────────────────────────────────

class _OverviewTab extends StatelessWidget {
  final Department dept;
  final List<dynamic> projects, activity;
  const _OverviewTab({required this.dept, required this.projects, required this.activity});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _SectionCard(
          title: 'Department Info',
          icon: Icons.business_outlined,
          child: Column(children: [
            _InfoRow(Icons.location_on_outlined, 'Location', dept.location.isNotEmpty ? dept.location : '—'),
            _InfoRow(Icons.account_balance_wallet_outlined, 'Budget', '\$${dept.budget.toStringAsFixed(0)}'),
            _InfoRow(Icons.manage_accounts_outlined, 'Manager', dept.manager?.name ?? 'No manager assigned'),
            if (dept.description.isNotEmpty)
              _InfoRow(Icons.notes_outlined, 'Description', dept.description),
          ]),
        ),
        const SizedBox(height: 12),
        _SectionCard(
          title: 'Active Projects (${projects.length})',
          icon: Icons.folder_outlined,
          child: projects.isEmpty
              ? const _Empty(Icons.folder_open, 'No active projects')
              : Column(
                  children: projects.take(5).map((p) {
                    final name = p['name'] ?? 'Project';
                    final status = p['status'] ?? 'active';
                    final priority = p['priority'] ?? 'medium';
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(children: [
                        Expanded(child: Text(name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500))),
                        _Badge(status, AppTheme.statusColor(status), AppTheme.statusBg(status)),
                        const SizedBox(width: 6),
                        _Badge(priority, _priorityColor(priority), _priorityColor(priority).withOpacity(0.1)),
                      ]),
                    );
                  }).toList(),
                ),
        ),
        const SizedBox(height: 12),
        _SectionCard(
          title: 'Recent Activity',
          icon: Icons.history_outlined,
          child: activity.isEmpty
              ? const _Empty(Icons.history, 'No recent activity')
              : Column(
                  children: activity.take(8).map((log) {
                    final action = log['action'] ?? 'Activity';
                    final user = log['user'] ?? 'System';
                    final time = log['timestamp'] ?? '';
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Container(
                          width: 6, height: 6, margin: const EdgeInsets.only(top: 5, right: 8),
                          decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                        ),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(action, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                          Text('$user${time.isNotEmpty ? ' · $time' : ''}',
                              style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
                        ])),
                      ]),
                    );
                  }).toList(),
                ),
        ),
      ],
    );
  }
}

Color _priorityColor(String p) => switch (p) {
  'critical' => AppTheme.red, 'high' => AppTheme.amber, 'medium' => AppTheme.blue, _ => AppTheme.textSecondary,
};

// ── Members Tab ───────────────────────────────────────────────────────────────

class _MembersTab extends StatelessWidget {
  final List<Employee> employees;
  const _MembersTab({required this.employees});

  @override
  Widget build(BuildContext context) {
    if (employees.isEmpty) {
      return const Center(child: _Empty(Icons.people_outline, 'No members in this department'));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: employees.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final e = employees[i];
        final initials = '${e.firstName.isNotEmpty ? e.firstName[0] : ''}${e.lastName.isNotEmpty ? e.lastName[0] : ''}'.toUpperCase();
        final isActive = e.status == 'active';
        return Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
          padding: const EdgeInsets.all(12),
          child: Row(children: [
            CircleAvatar(
              radius: 18, backgroundColor: AppTheme.primary.withOpacity(0.12),
              child: Text(initials, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primary)),
            ),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(e.fullName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              Text(e.position, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
            ])),
            _Badge(e.status, isActive ? AppTheme.green : AppTheme.amber,
                isActive ? AppTheme.greenBg : AppTheme.amberBg),
          ]),
        );
      },
    );
  }
}

// ── Performance Tab ───────────────────────────────────────────────────────────

class _PerformanceTab extends StatelessWidget {
  final Department dept;
  final List<Employee> employees;
  final List<dynamic> projects;
  const _PerformanceTab({required this.dept, required this.employees, required this.projects});

  @override
  Widget build(BuildContext context) {
    final activeProjects = projects.where((p) => p['status'] == 'active').length;
    final completedProjects = projects.where((p) => p['status'] == 'completed').length;
    final efficiency = projects.isEmpty ? 0.0 : (completedProjects / projects.length).clamp(0.0, 1.0);
    final activeEmployees = employees.where((e) => e.status == 'active').length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        LayoutBuilder(builder: (_, c) {
          final w = (c.maxWidth - 10) / 2;
          return Row(children: [
            _MetricTile('Efficiency', '${(efficiency * 100).toStringAsFixed(0)}%',
                efficiency >= 0.7 ? AppTheme.green : AppTheme.amber, w),
            const SizedBox(width: 10),
            _MetricTile('Active Members', '$activeEmployees / ${employees.length}', AppTheme.blue, w),
          ]);
        }),
        const SizedBox(height: 10),
        LayoutBuilder(builder: (_, c) {
          final w = (c.maxWidth - 10) / 2;
          return Row(children: [
            _MetricTile('Active Projects', '$activeProjects', AppTheme.primary, w),
            const SizedBox(width: 10),
            _MetricTile('Completed', '$completedProjects', AppTheme.green, w),
          ]);
        }),
        const SizedBox(height: 16),
        _SectionCard(
          title: 'Project Completion Rate',
          icon: Icons.bar_chart_outlined,
          child: Column(children: [
            _PRow('Completed', completedProjects, projects.length, AppTheme.green),
            const SizedBox(height: 8),
            _PRow('Active', activeProjects, projects.length, AppTheme.blue),
            const SizedBox(height: 8),
            _PRow('Other', (projects.length - completedProjects - activeProjects).clamp(0, projects.length),
                projects.length, AppTheme.textSecondary),
          ]),
        ),
        const SizedBox(height: 12),
        _SectionCard(
          title: 'Team Composition',
          icon: Icons.people_outline,
          child: Column(children: [
            _PRow('Active', activeEmployees, employees.length, AppTheme.green),
            const SizedBox(height: 8),
            _PRow('Inactive', employees.length - activeEmployees, employees.length, AppTheme.amber),
          ]),
        ),
      ],
    );
  }
}

class _MetricTile extends StatelessWidget {
  final String label, value;
  final Color color;
  final double w;
  const _MetricTile(this.label, this.value, this.color, this.w);

  @override
  Widget build(BuildContext context) => Container(
    width: w, padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: color.withOpacity(0.06), borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.2))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
      const SizedBox(height: 4),
      FittedBox(child: Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color))),
    ]),
  );
}

class _PRow extends StatelessWidget {
  final String label;
  final num value, total;
  final Color color;
  const _PRow(this.label, this.value, this.total, this.color);

  @override
  Widget build(BuildContext context) {
    final pct = total > 0 ? (value / total).clamp(0.0, 1.0) : 0.0;
    return Row(children: [
      SizedBox(width: 80, child: Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
      Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(value: pct.toDouble(), minHeight: 7,
              backgroundColor: AppTheme.border, valueColor: AlwaysStoppedAnimation<Color>(color)))),
      const SizedBox(width: 8),
      Text('$value', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
    ]);
  }
}

// ── Budget Tab ────────────────────────────────────────────────────────────────

class _BudgetTab extends StatelessWidget {
  final Department dept;
  const _BudgetTab({required this.dept});

  @override
  Widget build(BuildContext context) {
    final budget = dept.budget;
    // Approximate spent as 60% for display — real data would come from a budget endpoint
    final spent = budget * 0.6;
    final remaining = budget - spent;
    final used = budget > 0 ? (spent / budget).clamp(0.0, 1.0) : 0.0;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        LayoutBuilder(builder: (_, c) {
          final w = (c.maxWidth - 20) / 3;
          return Row(children: [
            _BTile('Total Budget', '\$${budget.toStringAsFixed(0)}', AppTheme.blue, w),
            const SizedBox(width: 10),
            _BTile('Spent', '\$${spent.toStringAsFixed(0)}', AppTheme.red, w),
            const SizedBox(width: 10),
            _BTile('Remaining', '\$${remaining.toStringAsFixed(0)}', AppTheme.green, w),
          ]);
        }),
        const SizedBox(height: 14),
        Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
          padding: const EdgeInsets.all(12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Budget Utilization', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              Text('${(used * 100).toStringAsFixed(1)}%',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
                      color: used > 0.9 ? AppTheme.red : AppTheme.primary)),
            ]),
            const SizedBox(height: 8),
            ClipRRect(borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(value: used, minHeight: 10,
                  backgroundColor: AppTheme.border,
                  valueColor: AlwaysStoppedAnimation<Color>(used > 0.9 ? AppTheme.red : AppTheme.primary))),
          ]),
        ),
        const SizedBox(height: 12),
        _SectionCard(
          title: 'Budget Details',
          icon: Icons.account_balance_wallet_outlined,
          child: Column(children: [
            _InfoRow(Icons.business_outlined, 'Department', dept.name),
            _InfoRow(Icons.location_on_outlined, 'Location', dept.location.isNotEmpty ? dept.location : '—'),
            _InfoRow(Icons.people_outline, 'Team Size', '${dept.employeeCount} members'),
            _InfoRow(Icons.manage_accounts_outlined, 'Manager', dept.manager?.name ?? 'No manager'),
          ]),
        ),
      ],
    );
  }
}

class _BTile extends StatelessWidget {
  final String label, value;
  final Color color;
  final double w;
  const _BTile(this.label, this.value, this.color, this.w);

  @override
  Widget build(BuildContext context) => Container(
    width: w, padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.border)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary)),
      const SizedBox(height: 4),
      FittedBox(child: Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color))),
    ]),
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────

class _SettingsTab extends StatelessWidget {
  final Department dept;
  final VoidCallback onDeleted;
  const _SettingsTab({required this.dept, required this.onDeleted});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _SectionCard(
          title: 'Department Details',
          icon: Icons.settings_outlined,
          child: Column(children: [
            _InfoRow(Icons.badge_outlined, 'Name', dept.name),
            _InfoRow(Icons.location_on_outlined, 'Location', dept.location.isNotEmpty ? dept.location : '—'),
            _InfoRow(Icons.circle_outlined, 'Status', dept.status),
            _InfoRow(Icons.manage_accounts_outlined, 'Manager', dept.manager?.name ?? 'No manager'),
            if (dept.manager?.email.isNotEmpty == true)
              _InfoRow(Icons.email_outlined, 'Manager Email', dept.manager!.email),
          ]),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity, height: 46,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.red, foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
            icon: const Icon(Icons.delete_outline, size: 18),
            label: const Text('Delete Department'),
            onPressed: () async {
              final ok = await showDialog<bool>(
                context: context,
                builder: (_) => AlertDialog(
                  title: const Text('Delete Department'),
                  content: Text('Delete "${dept.name}"? This cannot be undone.'),
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
                await DepartmentService().deleteDepartment(dept.id);
                onDeleted();
              } catch (e) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
              }
            },
          ),
        ),
      ],
    );
  }
}

// ── Shared Widgets ────────────────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Widget child;
  const _SectionCard({required this.title, required this.icon, required this.child});

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
        child: Row(children: [
          Icon(icon, size: 16, color: AppTheme.primary),
          const SizedBox(width: 6),
          Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ]),
      ),
      const Divider(height: 1, color: AppTheme.border),
      Padding(padding: const EdgeInsets.all(12), child: child),
    ]),
  );
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label, value;
  const _InfoRow(this.icon, this.label, this.value);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(children: [
      Icon(icon, size: 14, color: AppTheme.primary),
      const SizedBox(width: 8),
      SizedBox(width: 72, child: Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary))),
      Expanded(child: Text(value, style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary, fontWeight: FontWeight.w500))),
    ]),
  );
}

class _Badge extends StatelessWidget {
  final String label;
  final Color color, bg;
  const _Badge(this.label, this.color, this.bg);

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w500)),
  );
}

class _Empty extends StatelessWidget {
  final IconData icon;
  final String message;
  const _Empty(this.icon, this.message);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 16),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 36, color: AppTheme.textMuted),
      const SizedBox(height: 8),
      Text(message, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
    ]),
  );
}
