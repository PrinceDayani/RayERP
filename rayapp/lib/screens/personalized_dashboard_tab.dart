import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../services/analytics_service.dart';
import '../services/auth_provider.dart';

class PersonalizedDashboardTab extends StatefulWidget {
  final void Function(int) onNavigate;
  const PersonalizedDashboardTab({super.key, required this.onNavigate});

  @override
  State<PersonalizedDashboardTab> createState() => _PersonalizedDashboardTabState();
}

class _PersonalizedDashboardTabState extends State<PersonalizedDashboardTab> {
  final _svc = AnalyticsService();

  Map<String, dynamic> _data = {};
  bool _loading = true;
  String? _error;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _load();
    _timer = Timer.periodic(const Duration(minutes: 2), (_) => _load());
  }

  Future<void> _load() async {
    if (!mounted) return;
    try {
      final result = await _svc.getUserDashboard();
      if (!mounted) return;
      setState(() {
        _data = result;
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
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final w = MediaQuery.of(context).size.width;
    final pad = w < 400 ? 12.0 : w < 600 ? 16.0 : 20.0;

    final projects = (_data['projects'] as List? ?? []).cast<Map<String, dynamic>>();
    final tasks = (_data['tasks'] as List? ?? []).cast<Map<String, dynamic>>();
    final notifications = (_data['notifications'] as List? ?? []).cast<Map<String, dynamic>>();
    final activity = (_data['projectActivity'] as List? ?? []).cast<Map<String, dynamic>>();
    final taskStats = (_data['taskStats'] as Map<String, dynamic>?) ?? {};

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
                    _Header(user: auth.user, onRefresh: _load, loading: _loading),
                    SizedBox(height: pad),
                    if (_error != null) ...[
                      _ErrorBanner(message: _error!, onRetry: _load),
                      SizedBox(height: pad),
                    ],
                    _StatsRow(taskStats: taskStats, projectCount: projects.length, notifCount: notifications.length, loading: _loading),
                    SizedBox(height: pad),
                    _ProjectsCard(projects: projects, loading: _loading, onViewAll: () => widget.onNavigate(0)),
                    SizedBox(height: pad),
                    _TasksCard(tasks: tasks, loading: _loading, onViewAll: () => widget.onNavigate(1)),
                    SizedBox(height: pad),
                    _ActivityCard(activity: activity, loading: _loading),
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
// Header
// ─────────────────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  final dynamic user;
  final VoidCallback onRefresh;
  final bool loading;
  const _Header({required this.user, required this.onRefresh, required this.loading});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final hour = DateTime.now().hour;
    final greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
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
            child: Center(child: Text(initial, style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w800, fontSize: 18))),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$greeting, ${user?.name?.split(' ').first ?? ''}!',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: isDark ? Colors.white : AppTheme.textPrimary),
                ),
                const SizedBox(height: 2),
                Text("Here's your personalized overview", style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
              ],
            ),
          ),
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
// Stats Row
// ─────────────────────────────────────────────────────────────────────────────

class _StatsRow extends StatelessWidget {
  final Map<String, dynamic> taskStats;
  final int projectCount;
  final int notifCount;
  final bool loading;

  const _StatsRow({
    required this.taskStats,
    required this.projectCount,
    required this.notifCount,
    required this.loading,
  });

  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.folder_rounded, 'Projects', '$projectCount', 'active', AppTheme.blue),
      (Icons.task_alt_rounded, 'Tasks', '${taskStats['total'] ?? 0}', '${taskStats['overdue'] ?? 0} overdue', AppTheme.green),
      (Icons.notifications_rounded, 'Alerts', '$notifCount', 'unread', AppTheme.amber),
      (Icons.play_circle_outline_rounded, 'In Progress', '${taskStats['inProgress'] ?? 0}', 'active tasks', AppTheme.purple),
    ];

    return Row(
      children: items.asMap().entries.map((e) {
        final i = e.key;
        final item = e.value;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(left: i == 0 ? 0 : 8),
            child: _MiniStatCard(
              icon: item.$1,
              title: item.$2,
              value: item.$3,
              subtitle: item.$4,
              color: item.$5,
              loading: loading,
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _MiniStatCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;
  final String subtitle;
  final Color color;
  final bool loading;

  const _MiniStatCard({
    required this.icon, required this.title, required this.value,
    required this.subtitle, required this.color, required this.loading,
  });

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
          ? Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(width: double.infinity, height: 10, decoration: BoxDecoration(color: isDark ? const Color(0xFF374151) : const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(4))),
              const SizedBox(height: 8),
              Container(width: 40, height: 20, decoration: BoxDecoration(color: isDark ? const Color(0xFF374151) : const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(4))),
            ])
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Container(width: 7, height: 7, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
                  const SizedBox(width: 4),
                  Expanded(child: Text(title, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: isDark ? const Color(0xFF9CA3AF) : AppTheme.textSecondary), overflow: TextOverflow.ellipsis)),
                ]),
                const SizedBox(height: 4),
                Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: isDark ? Colors.white : AppTheme.textPrimary)),
                const SizedBox(height: 2),
                Text(subtitle, style: TextStyle(fontSize: 10, color: isDark ? const Color(0xFF6B7280) : AppTheme.textSecondary), overflow: TextOverflow.ellipsis),
              ],
            ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Projects Card
// ─────────────────────────────────────────────────────────────────────────────

class _ProjectsCard extends StatelessWidget {
  final List<Map<String, dynamic>> projects;
  final bool loading;
  final VoidCallback onViewAll;

  const _ProjectsCard({required this.projects, required this.loading, required this.onViewAll});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return _SectionCard(
      title: 'My Projects',
      icon: Icons.folder_open_rounded,
      iconColor: AppTheme.blue,
      trailing: projects.isNotEmpty
          ? TextButton(
              onPressed: onViewAll,
              style: TextButton.styleFrom(foregroundColor: AppTheme.primary, padding: const EdgeInsets.symmetric(horizontal: 8), minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
              child: const Text('View all', style: TextStyle(fontSize: 12)),
            )
          : null,
      child: loading
          ? _listSkeleton(3, isDark)
          : projects.isEmpty
              ? _EmptyState(icon: Icons.folder_off_rounded, message: 'No projects assigned')
              : Column(
                  children: projects.take(5).map((p) {
                    final progress = (p['progress'] ?? 0) as num;
                    final status = (p['status'] ?? '').toString();
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(child: Text(p['name'] ?? '', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isDark ? Colors.white : AppTheme.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis)),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(color: AppTheme.statusBg(status), borderRadius: BorderRadius.circular(4)),
                                child: Text(status, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: AppTheme.statusColor(status))),
                              ),
                              const SizedBox(width: 4),
                              Text('${progress.toInt()}%', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: isDark ? Colors.white : AppTheme.textPrimary)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: progress.toDouble() / 100,
                              minHeight: 5,
                              backgroundColor: isDark ? const Color(0xFF374151) : const Color(0xFFF3F4F6),
                              valueColor: AlwaysStoppedAnimation(progress >= 80 ? AppTheme.green : progress >= 40 ? AppTheme.blue : AppTheme.amber),
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
// Tasks Card
// ─────────────────────────────────────────────────────────────────────────────

class _TasksCard extends StatelessWidget {
  final List<Map<String, dynamic>> tasks;
  final bool loading;
  final VoidCallback onViewAll;

  const _TasksCard({required this.tasks, required this.loading, required this.onViewAll});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return _SectionCard(
      title: 'My Tasks',
      icon: Icons.task_alt_rounded,
      iconColor: AppTheme.green,
      trailing: tasks.isNotEmpty
          ? TextButton(
              onPressed: onViewAll,
              style: TextButton.styleFrom(foregroundColor: AppTheme.primary, padding: const EdgeInsets.symmetric(horizontal: 8), minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
              child: const Text('View all', style: TextStyle(fontSize: 12)),
            )
          : null,
      child: loading
          ? _listSkeleton(4, isDark)
          : tasks.isEmpty
              ? _EmptyState(icon: Icons.check_box_outline_blank_rounded, message: 'No tasks assigned')
              : Column(
                  children: tasks.take(8).map((t) {
                    final priority = (t['priority'] ?? 'medium').toString();
                    final dueDate = t['dueDate'] != null ? DateTime.tryParse(t['dueDate'].toString()) : null;
                    final isOverdue = dueDate != null && dueDate.isBefore(DateTime.now());
                    final priorityColor = priority == 'critical' || priority == 'high' ? AppTheme.red : priority == 'medium' ? AppTheme.amber : AppTheme.green;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 32, height: 32,
                            decoration: BoxDecoration(color: priorityColor.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
                            child: Icon(Icons.task_alt_rounded, size: 16, color: priorityColor),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(t['title'] ?? '', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isDark ? Colors.white : AppTheme.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                                if (t['project'] != null)
                                  Text((t['project'] as Map?)?['name'] ?? '', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary), overflow: TextOverflow.ellipsis),
                                if (dueDate != null)
                                  Text(
                                    isOverdue ? 'Overdue · ${_fmt(dueDate)}' : 'Due ${_fmt(dueDate)}',
                                    style: TextStyle(fontSize: 10, color: isOverdue ? AppTheme.red : AppTheme.textMuted),
                                  ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: priorityColor.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                            child: Text(priority, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: priorityColor)),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
    );
  }

  String _fmt(DateTime dt) {
    final months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${dt.day} ${months[dt.month - 1]}';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Card
// ─────────────────────────────────────────────────────────────────────────────

class _ActivityCard extends StatelessWidget {
  final List<Map<String, dynamic>> activity;
  final bool loading;

  const _ActivityCard({required this.activity, required this.loading});

  IconData _icon(String type) => switch (type) {
    'project' => Icons.folder_rounded,
    'task' => Icons.task_alt_rounded,
    'file' => Icons.attach_file_rounded,
    'budget' => Icons.account_balance_wallet_rounded,
    _ => Icons.circle_notifications_rounded,
  };

  Color _color(String type) => switch (type) {
    'project' => AppTheme.purple,
    'task' => AppTheme.green,
    'file' => AppTheme.blue,
    'budget' => AppTheme.amber,
    _ => AppTheme.primary,
  };

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return _SectionCard(
      title: 'Project Activity',
      icon: Icons.bolt_rounded,
      iconColor: AppTheme.amber,
      child: loading
          ? _listSkeleton(4, isDark)
          : activity.isEmpty
              ? _EmptyState(icon: Icons.history_rounded, message: 'No recent activity')
              : Column(
                  children: activity.take(8).map((a) {
                    final type = (a['resourceType'] ?? 'system').toString();
                    final action = (a['action'] ?? '').toString();
                    final details = (a['details'] ?? '').toString();
                    final ts = a['timestamp'] != null ? DateTime.tryParse(a['timestamp'].toString()) : null;
                    final timeStr = ts != null ? _rel(ts) : '';

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 32, height: 32,
                            decoration: BoxDecoration(color: _color(type).withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
                            child: Icon(_icon(type), size: 16, color: _color(type)),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(action, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: isDark ? const Color(0xFFD1D5DB) : AppTheme.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                                if (details.isNotEmpty)
                                  Text(details, style: TextStyle(fontSize: 11, color: isDark ? const Color(0xFF9CA3AF) : AppTheme.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
                                if (timeStr.isNotEmpty)
                                  Text(timeStr, style: TextStyle(fontSize: 10, color: isDark ? const Color(0xFF6B7280) : AppTheme.textMuted)),
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

  String _rel(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Widgets
// ─────────────────────────────────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color iconColor;
  final Widget child;
  final Widget? trailing;

  const _SectionCard({required this.title, required this.icon, required this.iconColor, required this.child, this.trailing});

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
                Expanded(child: Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isDark ? Colors.white : AppTheme.textPrimary))),
                if (trailing != null) trailing!,
              ],
            ),
          ),
          Divider(height: 1, color: isDark ? const Color(0xFF374151) : const Color(0xFFE5E7EB)),
          Padding(padding: const EdgeInsets.all(14), child: child),
        ],
      ),
    );
  }
}

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
            Text(message, style: TextStyle(fontSize: 13, color: isDark ? const Color(0xFF6B7280) : AppTheme.textMuted)),
          ],
        ),
      ),
    );
  }
}

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
          const Expanded(child: Text('Failed to load dashboard', style: TextStyle(color: AppTheme.red, fontSize: 13))),
          TextButton(
            onPressed: onRetry,
            style: TextButton.styleFrom(foregroundColor: AppTheme.red, padding: const EdgeInsets.symmetric(horizontal: 8), minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
            child: const Text('Retry', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

Widget _listSkeleton(int count, bool isDark) {
  final bg = isDark ? const Color(0xFF374151) : const Color(0xFFF3F4F6);
  return Column(
    children: List.generate(count, (i) => Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(children: [
        Container(width: 32, height: 32, decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8))),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(width: double.infinity, height: 12, decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(4))),
          const SizedBox(height: 4),
          Container(width: 80, height: 10, decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(4))),
        ])),
      ]),
    )),
  );
}
