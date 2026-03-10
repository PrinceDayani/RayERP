import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../services/analytics_service.dart';
import '../services/auth_provider.dart';
import '../services/socket_service.dart';
import 'employees/employee_list_screen.dart';
import 'attendance/attendance_list_screen.dart';
import 'projects/project_form_screen.dart';
import 'tasks/task_form_screen.dart';

class DashboardOverviewTab extends StatefulWidget {
  final void Function(int) onNavigate;
  const DashboardOverviewTab({super.key, required this.onNavigate});

  @override
  State<DashboardOverviewTab> createState() => _DashboardOverviewTabState();
}

class _DashboardOverviewTabState extends State<DashboardOverviewTab> {
  final _svc = AnalyticsService();

  Map<String, dynamic> _stats = {};
  Map<String, dynamic> _analytics = {};
  Map<String, dynamic> _trends = {};
  List<Map<String, dynamic>> _activity = [];

  bool _loading = true;
  String? _error;
  bool _revenueView = true; // true = sales, false = projects
  Timer? _timer;
  StreamSubscription? _activitySub;
  StreamSubscription? _dashSub;

  @override
  void initState() {
    super.initState();
    _load();
    _timer = Timer.periodic(const Duration(minutes: 1), (_) => _load());
    WidgetsBinding.instance.addPostFrameCallback((_) => _bindSocket());
  }

  void _bindSocket() {
    if (!mounted) return;
    final socket = context.read<SocketService>();
    _activitySub = socket.onActivityLog.listen((data) {
      if (!mounted) return;
      setState(() {
        _activity.insert(0, {
          'id': data['id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
          'type': data['type'] ?? 'system',
          'description': data['message'] ?? data['description'] ?? '',
          'time': data['timestamp'] != null
              ? DateTime.tryParse(data['timestamp'].toString())?.toLocal().toString() ?? ''
              : DateTime.now().toLocal().toString(),
        });
        if (_activity.length > 20) _activity = _activity.sublist(0, 20);
      });
    });
    _dashSub = socket.onDashboardUpdate.listen((_) => _load());
  }

  Future<void> _load() async {
    if (!mounted) return;
    try {
      final results = await Future.wait([
        _svc.getDashboardStats().catchError((_) => <String, dynamic>{}),
        _svc.getDashboardAnalytics().catchError((_) => <String, dynamic>{}),
        _svc.getTrends().catchError((_) => <String, dynamic>{}),
      ]);
      if (!mounted) return;
      setState(() {
        _stats = results[0];
        _analytics = results[1];
        _trends = results[2];
        final raw = _analytics['recentActivity'];
        if (raw is List && _activity.isEmpty) {
          _activity = raw.map((e) => Map<String, dynamic>.from(e)).toList();
        }
        _loading = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _activitySub?.cancel();
    _dashSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final socket = context.watch<SocketService>();
    final auth = context.watch<AuthProvider>();
    final w = MediaQuery.of(context).size.width;
    final pad = w < 400 ? 12.0 : w < 600 ? 16.0 : 20.0;
    final isWide = w >= 768;

    final projects = (_analytics['projectProgress'] as List? ?? [])
        .map((e) => Map<String, dynamic>.from(e))
        .toList();

    final leftCol = [
      _StatsGrid(stats: _stats, trends: _trends, loading: _loading),
      SizedBox(height: pad),
      _FinancialCard(
        stats: _stats,
        loading: _loading,
        isSalesView: _revenueView,
        onToggle: (v) => setState(() => _revenueView = v),
      ),
    ];

    final rightCol = [
      _ActiveProjectsCard(
        projects: projects,
        loading: _loading,
        onViewAll: () => widget.onNavigate(0),
      ),
      SizedBox(height: pad),
      _ActivityFeedCard(activity: _activity, loading: _loading),
      SizedBox(height: pad),
      _QuickActionsRow(onNavigate: widget.onNavigate),
    ];

    return RefreshIndicator(
      color: AppTheme.primary,
      onRefresh: _load,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverPadding(
            padding: EdgeInsets.all(pad),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                AppTheme.constrain(Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _CompactHeader(
                      user: auth.user,
                      socketConnected: socket.isConnected,
                      onRefresh: _load,
                      loading: _loading,
                    ),
                    SizedBox(height: pad),
                    if (_error != null) ...[
                      _ErrorBanner(message: _error!, onRetry: _load),
                      SizedBox(height: pad),
                    ],
                    if (isWide)
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(flex: 5, child: Column(children: leftCol)),
                          SizedBox(width: pad),
                          Expanded(flex: 4, child: Column(children: rightCol)),
                        ],
                      )
                    else ...[
                      ...leftCol,
                      SizedBox(height: pad),
                      ...rightCol,
                    ],
                    const SizedBox(height: 24),
                  ],
                )),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact Header
// ─────────────────────────────────────────────────────────────────────────────

class _CompactHeader extends StatelessWidget {
  final dynamic user;
  final bool socketConnected;
  final VoidCallback onRefresh;
  final bool loading;

  const _CompactHeader({
    required this.user,
    required this.socketConnected,
    required this.onRefresh,
    required this.loading,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final role = (user?.role ?? '').toString().replaceAll('_', ' ');
    final hour = DateTime.now().hour;
    final greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    final now = DateTime.now();
    final weekdays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    final months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    final dateStr = '${weekdays[now.weekday - 1]}, ${now.day} ${months[now.month - 1]}';
    final initial = user?.name?.isNotEmpty == true ? user!.name[0].toUpperCase() : '?';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2937) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? const Color(0xFF374151) : const Color(0xFFE5E7EB)),
        boxShadow: isDark ? [] : [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.primary.withOpacity(0.25)),
            ),
            child: Center(
              child: Text(initial, style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w800, fontSize: 18)),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$greeting, ${user?.name?.split(' ').first ?? ''}',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: isDark ? Colors.white : AppTheme.textPrimary),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    if (role.isNotEmpty) ...[
                      Text(role, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                      const Text('  ·  ', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                    ],
                    Text(dateStr, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: socketConnected ? AppTheme.green.withOpacity(0.1) : AppTheme.amber.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: socketConnected ? AppTheme.green.withOpacity(0.3) : AppTheme.amber.withOpacity(0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(width: 6, height: 6,
                  decoration: BoxDecoration(color: socketConnected ? AppTheme.green : AppTheme.amber, shape: BoxShape.circle)),
                const SizedBox(width: 4),
                Text(
                  socketConnected ? 'Live' : 'Polling',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: socketConnected ? AppTheme.green : AppTheme.amber),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          loading
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary))
              : IconButton(
                  icon: const Icon(Icons.refresh_rounded, size: 20),
                  onPressed: onRefresh,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  color: AppTheme.textSecondary,
                ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Banner
// ─────────────────────────────────────────────────────────────────────────────

class _ErrorBanner extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorBanner({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.redBg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.red.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: AppTheme.red, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Failed to load dashboard data',
              style: const TextStyle(color: AppTheme.red, fontSize: 13),
            ),
          ),
          TextButton(
            onPressed: onRetry,
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.red,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text('Retry', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats Grid
// ─────────────────────────────────────────────────────────────────────────────

class _StatsGrid extends StatelessWidget {
  final Map<String, dynamic> stats;
  final Map<String, dynamic> trends;
  final bool loading;

  const _StatsGrid({
    required this.stats,
    required this.trends,
    required this.loading,
  });

  @override
  Widget build(BuildContext context) {
    final totalTasks = (stats['totalTasks'] ?? 0) as num;
    final completedTasks = (stats['completedTasks'] ?? 0) as num;
    final rate = totalTasks > 0 ? (completedTasks / totalTasks * 100).round() : 0;

    final items = [
      _StatItem(
        title: 'Employees',
        value: '${stats['totalEmployees'] ?? 0}',
        subtitle: '${stats['activeEmployees'] ?? 0} active',
        icon: Icons.people_rounded,
        color: AppTheme.blue,
        trend: trends['employees'],
      ),
      _StatItem(
        title: 'Projects',
        value: '${stats['totalProjects'] ?? 0}',
        subtitle: '${stats['completedProjects'] ?? 0} completed',
        icon: Icons.folder_rounded,
        color: AppTheme.purple,
        trend: trends['projects'],
      ),
      _StatItem(
        title: 'Tasks',
        value: '${stats['totalTasks'] ?? 0}',
        subtitle: '${stats['completedTasks'] ?? 0} done',
        icon: Icons.task_alt_rounded,
        color: AppTheme.green,
        trend: trends['tasks'],
      ),
      _StatItem(
        title: 'Completion',
        value: '$rate%',
        subtitle: 'Overall rate',
        icon: Icons.track_changes_rounded,
        color: AppTheme.amber,
        trend: null,
        progress: rate / 100,
      ),
    ];

    return LayoutBuilder(builder: (context, constraints) {
      const gap = 10.0;
      final cardW = (constraints.maxWidth - gap * 3) / 4;
      return Row(
        children: items.map((item) => Expanded(
          child: Padding(
            padding: EdgeInsets.only(left: item == items.first ? 0 : gap),
            child: _StatCard(item: item, loading: loading),
          ),
        )).toList(),
      );
    });
  }
}

class _StatItem {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color color;
  final dynamic trend;
  final double? progress;

  const _StatItem({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.trend,
    this.progress,
  });
}

class _StatCard extends StatelessWidget {
  final _StatItem item;
  final bool loading;
  const _StatCard({required this.item, required this.loading});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2937) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? const Color(0xFF374151) : const Color(0xFFE5E7EB)),
        boxShadow: isDark ? [] : [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: loading
          ? _Skeleton.card()
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Container(
                    width: 8, height: 8,
                    decoration: BoxDecoration(color: item.color, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 5),
                  Expanded(child: Text(item.title, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: isDark ? const Color(0xFF9CA3AF) : AppTheme.textSecondary), overflow: TextOverflow.ellipsis)),
                ]),
                const SizedBox(height: 4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(child: Text(item.value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: isDark ? Colors.white : AppTheme.textPrimary))),
                    if (item.trend != null) _TrendBadge(trend: item.trend),
                  ],
                ),
                const SizedBox(height: 2),
                Text(item.subtitle, style: TextStyle(fontSize: 10, color: isDark ? const Color(0xFF6B7280) : AppTheme.textSecondary), overflow: TextOverflow.ellipsis),
                if (item.progress != null) ...[
                  const SizedBox(height: 8),
                  ClipRRect(borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(value: item.progress, minHeight: 4, backgroundColor: item.color.withOpacity(0.15), valueColor: AlwaysStoppedAnimation(item.color))),
                ],
              ],
            ),
    );
  }
}

class _TrendBadge extends StatelessWidget {
  final dynamic trend;
  const _TrendBadge({required this.trend});

  @override
  Widget build(BuildContext context) {
    final dir = trend is Map ? (trend['direction'] ?? 'up') : 'up';
    final val = trend is Map ? (trend['value'] ?? 0) : 0;
    final isUp = dir == 'up';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      decoration: BoxDecoration(
        color: isUp ? AppTheme.greenBg : AppTheme.redBg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isUp ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
            size: 10,
            color: isUp ? AppTheme.green : AppTheme.red,
          ),
          const SizedBox(width: 2),
          Text(
            '$val%',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: isUp ? AppTheme.green : AppTheme.red,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Financial Overview Card
// ─────────────────────────────────────────────────────────────────────────────

class _FinancialCard extends StatelessWidget {
  final Map<String, dynamic> stats;
  final bool loading;
  final bool isSalesView;
  final void Function(bool) onToggle;

  const _FinancialCard({
    required this.stats,
    required this.loading,
    required this.isSalesView,
    required this.onToggle,
  });

  String _fmt(num v) {
    if (v >= 10000000) return '₹${(v / 10000000).toStringAsFixed(2)}Cr';
    if (v >= 100000) return '₹${(v / 100000).toStringAsFixed(2)}L';
    if (v >= 1000) return '₹${(v / 1000).toStringAsFixed(1)}K';
    return '₹${v.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final w = MediaQuery.of(context).size.width;

    final salesRevenue = (stats['salesRevenue'] ?? 0) as num;
    final salesPaid = (stats['salesPaid'] ?? 0) as num;
    final salesPending = (stats['salesPending'] ?? 0) as num;
    final salesCount = (stats['salesCount'] ?? 0) as num;
    final collectedPct = salesRevenue > 0 ? (salesPaid / salesRevenue * 100).toStringAsFixed(1) : '0';
    final pendingPct = salesRevenue > 0 ? (salesPending / salesRevenue * 100).toStringAsFixed(1) : '0';

    final projectRevenue = (stats['projectRevenue'] ?? 0) as num;
    final projectExpenses = (stats['projectExpenses'] ?? 0) as num;
    final projectProfit = (stats['projectProfit'] ?? 0) as num;
    final totalProjects = (stats['totalProjects'] ?? 0) as num;

    final tiles = isSalesView
        ? [
            _FinTile(label: 'Sales Revenue', value: _fmt(salesRevenue), sub: '${salesCount.toInt()} invoices', color: AppTheme.green, icon: Icons.trending_up_rounded),
            _FinTile(label: 'Received', value: _fmt(salesPaid), sub: '$collectedPct% collected', color: AppTheme.blue, icon: Icons.check_circle_outline_rounded),
            _FinTile(label: 'Pending', value: _fmt(salesPending), sub: '$pendingPct% pending', color: AppTheme.amber, icon: Icons.schedule_rounded),
          ]
        : [
            _FinTile(label: 'Project Revenue', value: _fmt(projectRevenue), sub: '${totalProjects.toInt()} projects', color: AppTheme.purple, icon: Icons.folder_rounded),
            _FinTile(label: 'Expenses', value: _fmt(projectExpenses), sub: 'Spent budget', color: AppTheme.red, icon: Icons.trending_down_rounded),
            _FinTile(label: 'Profit', value: _fmt(projectProfit), sub: 'Budget − Spent', color: AppTheme.green, icon: Icons.account_balance_wallet_rounded),
          ];

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2937) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? const Color(0xFF374151) : const Color(0xFFE5E7EB)),
        boxShadow: isDark ? [] : [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Financial Overview',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : AppTheme.textPrimary,
                  ),
                ),
                _ToggleSwitch(
                  leftLabel: 'Sales',
                  rightLabel: 'Projects',
                  isLeft: isSalesView,
                  onChanged: onToggle,
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (loading)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: _Skeleton.finCard(),
            )
          else
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 14),
              child: Row(
                children: tiles.map((t) => Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: _FinTileWidget(tile: t),
                  ),
                )).toList(),
              ),
            ),
        ],
      ),
    );
  }
}

class _FinTile {
  final String label;
  final String value;
  final String sub;
  final Color color;
  final IconData icon;
  const _FinTile({required this.label, required this.value, required this.sub, required this.color, required this.icon});
}

class _FinTileWidget extends StatelessWidget {
  final _FinTile tile;
  const _FinTileWidget({required this.tile});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: tile.color.withOpacity(isDark ? 0.08 : 0.05),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: tile.color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(tile.icon, color: tile.color, size: 20),
          const SizedBox(height: 8),
          Text(tile.label, style: TextStyle(fontSize: 11, color: isDark ? const Color(0xFF9CA3AF) : AppTheme.textSecondary), overflow: TextOverflow.ellipsis),
          const SizedBox(height: 2),
          Text(tile.value, style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: isDark ? Colors.white : AppTheme.textPrimary), overflow: TextOverflow.ellipsis),
          Text(tile.sub, style: TextStyle(fontSize: 10, color: isDark ? const Color(0xFF6B7280) : AppTheme.textMuted), overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}

class _ToggleSwitch extends StatelessWidget {
  final String leftLabel;
  final String rightLabel;
  final bool isLeft;
  final void Function(bool) onChanged;

  const _ToggleSwitch({
    required this.leftLabel,
    required this.rightLabel,
    required this.isLeft,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF374151) : const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ToggleBtn(label: leftLabel, active: isLeft, onTap: () => onChanged(true)),
          _ToggleBtn(label: rightLabel, active: !isLeft, onTap: () => onChanged(false)),
        ],
      ),
    );
  }
}

class _ToggleBtn extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _ToggleBtn({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: active ? AppTheme.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: active ? Colors.white : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Active Projects Card
// ─────────────────────────────────────────────────────────────────────────────

class _ActiveProjectsCard extends StatelessWidget {
  final List<Map<String, dynamic>> projects;
  final bool loading;
  final VoidCallback onViewAll;

  const _ActiveProjectsCard({
    required this.projects,
    required this.loading,
    required this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return _SectionCard(
      title: 'Active Projects',
      icon: Icons.folder_open_rounded,
      iconColor: AppTheme.purple,
      trailing: projects.isNotEmpty
          ? TextButton(
              onPressed: onViewAll,
              style: TextButton.styleFrom(
                foregroundColor: AppTheme.primary,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text('View all', style: TextStyle(fontSize: 12)),
            )
          : null,
      child: loading
          ? _Skeleton.list(3)
          : projects.isEmpty
              ? _EmptyState(
                  icon: Icons.folder_off_rounded,
                  message: 'No active projects',
                )
              : Column(
                  children: projects.take(5).map((p) {
                    final progress = (p['progress'] ?? 0) as num;
                    final status = (p['status'] ?? '').toString();
                    final endDate = p['endDate'] != null
                        ? DateTime.tryParse(p['endDate'].toString())
                        : null;
                    final daysLeft = endDate != null
                        ? endDate.difference(DateTime.now()).inDays
                        : null;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  p['name'] ?? '',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? Colors.white : AppTheme.textPrimary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.statusBg(status),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  status,
                                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: AppTheme.statusColor(status)),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.statusBg(status),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  '${progress.toInt()}%',
                                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppTheme.statusColor(status)),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          if (daysLeft != null)
                            Text(
                              daysLeft < 0
                                  ? '${daysLeft.abs()}d overdue'
                                  : '$daysLeft days left',
                              style: TextStyle(
                                fontSize: 10,
                                color: daysLeft < 0
                                    ? AppTheme.red
                                    : daysLeft <= 7
                                        ? AppTheme.amber
                                        : AppTheme.textMuted,
                              ),
                            ),
                          const SizedBox(height: 6),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: progress.toDouble() / 100,
                              minHeight: 5,
                              backgroundColor: isDark ? const Color(0xFF374151) : const Color(0xFFF3F4F6),
                              valueColor: AlwaysStoppedAnimation(
                                progress >= 80 ? AppTheme.green : progress >= 40 ? AppTheme.blue : AppTheme.amber,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Feed Card
// ─────────────────────────────────────────────────────────────────────────────

class _ActivityFeedCard extends StatelessWidget {
  final List<Map<String, dynamic>> activity;
  final bool loading;

  const _ActivityFeedCard({required this.activity, required this.loading});

  IconData _icon(String type) => switch (type) {
    'project' => Icons.folder_rounded,
    'task' => Icons.task_alt_rounded,
    'employee' => Icons.person_rounded,
    'finance' => Icons.account_balance_wallet_rounded,
    _ => Icons.circle_notifications_rounded,
  };

  Color _color(String type) => switch (type) {
    'project' => AppTheme.purple,
    'task' => AppTheme.green,
    'employee' => AppTheme.blue,
    'finance' => AppTheme.amber,
    _ => AppTheme.primary,
  };

  String _relativeTime(String? timeStr) {
    if (timeStr == null || timeStr.isEmpty) return '';
    final dt = DateTime.tryParse(timeStr);
    if (dt == null) return timeStr;
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return _SectionCard(
      title: 'Recent Activity',
      icon: Icons.bolt_rounded,
      iconColor: AppTheme.amber,
      child: loading
          ? _Skeleton.list(4)
          : activity.isEmpty
              ? _EmptyState(
                  icon: Icons.history_rounded,
                  message: 'No recent activity',
                )
              : Column(
                  children: activity.take(8).map((a) {
                    final type = (a['type'] ?? 'system').toString();
                    final desc = (a['description'] ?? '').toString();
                    final time = _relativeTime(a['time']?.toString());
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: _color(type).withOpacity(0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(_icon(type), size: 16, color: _color(type)),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  desc,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isDark ? const Color(0xFFD1D5DB) : AppTheme.textPrimary,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                if (time.isNotEmpty) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    time,
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: isDark ? const Color(0xFF6B7280) : AppTheme.textMuted,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Actions Row
// ─────────────────────────────────────────────────────────────────────────────

class _QuickActionsRow extends StatelessWidget {
  final void Function(int) onNavigate;
  const _QuickActionsRow({required this.onNavigate});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final actions = [
      (Icons.add_circle_outline_rounded, 'New Project', AppTheme.purple, () =>
          Navigator.push(context, MaterialPageRoute(builder: (_) => const ProjectFormScreen()))),
      (Icons.playlist_add_rounded, 'New Task', AppTheme.green, () =>
          Navigator.push(context, MaterialPageRoute(builder: (_) => const TaskFormScreen()))),
      (Icons.people_rounded, 'Employees', AppTheme.blue, () =>
          Navigator.push(context, MaterialPageRoute(builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('Employees')),
            body: const EmployeeListScreen(),
          )))),
      (Icons.access_time_rounded, 'Attendance', AppTheme.amber, () =>
          Navigator.push(context, MaterialPageRoute(builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('Attendance')),
            body: const AttendanceListScreen(),
          )))),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: isDark ? const Color(0xFF9CA3AF) : AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 10),
        LayoutBuilder(builder: (context, constraints) {
          final gap = 8.0;
          final itemW = (constraints.maxWidth - gap * 3) / 4;
          return Wrap(
            spacing: gap,
            runSpacing: gap,
            children: actions.map((a) => SizedBox(
              width: itemW,
              child: _QuickActionTile(icon: a.$1, label: a.$2, color: a.$3, onTap: a.$4),
            )).toList(),
          );
        }),
      ],
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionTile({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: isDark ? const Color(0xFF1F2937) : Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isDark ? const Color(0xFF374151) : const Color(0xFFE5E7EB)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isDark ? const Color(0xFFD1D5DB) : AppTheme.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared: Section Card
// ─────────────────────────────────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color iconColor;
  final Widget child;
  final Widget? trailing;

  const _SectionCard({
    required this.title,
    required this.icon,
    required this.iconColor,
    required this.child,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2937) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? const Color(0xFF374151) : const Color(0xFFE5E7EB)),
        boxShadow: isDark ? [] : [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 12, 12),
            child: Row(
              children: [
                Icon(icon, size: 16, color: iconColor),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : AppTheme.textPrimary,
                    ),
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
          ),
          Divider(height: 1, color: isDark ? const Color(0xFF374151) : const Color(0xFFE5E7EB)),
          Padding(
            padding: const EdgeInsets.all(14),
            child: child,
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared: Empty State
// ─────────────────────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  const _EmptyState({required this.icon, required this.message});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Center(
        child: Column(
          children: [
            Icon(icon, size: 36, color: isDark ? const Color(0xFF4B5563) : const Color(0xFFD1D5DB)),
            const SizedBox(height: 8),
            Text(
              message,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? const Color(0xFF6B7280) : AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared: Skeleton Loaders
// ─────────────────────────────────────────────────────────────────────────────

class _Skeleton extends StatelessWidget {
  final double width;
  final double height;
  final double radius;

  const _Skeleton({this.width = double.infinity, required this.height, this.radius = 6});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF374151) : const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }

  static Widget card() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        const _Skeleton(width: 70, height: 12),
        const _Skeleton(width: 28, height: 28, radius: 8),
      ]),
      const SizedBox(height: 10),
      const _Skeleton(width: 60, height: 26),
      const SizedBox(height: 6),
      const _Skeleton(width: 100, height: 10),
    ],
  );

  static Widget finCard() => Column(
    children: [
      const _Skeleton(height: 60, radius: 10),
      const SizedBox(height: 8),
      const _Skeleton(height: 60, radius: 10),
      const SizedBox(height: 8),
      const _Skeleton(height: 60, radius: 10),
    ],
  );

  static Widget list(int count) => Column(
    children: List.generate(count, (i) => Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(children: [
        const _Skeleton(width: 32, height: 32, radius: 8),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _Skeleton(height: 12),
          const SizedBox(height: 4),
          _Skeleton(width: 80, height: 10),
        ])),
      ]),
    )),
  );
}
