import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../config/app_theme.dart';
import '../../models/notification_models.dart';
import '../../services/activity_service.dart';

class ActivityFeedScreen extends StatefulWidget {
  const ActivityFeedScreen({super.key});

  @override
  State<ActivityFeedScreen> createState() => _ActivityFeedScreenState();
}

class _ActivityFeedScreenState extends State<ActivityFeedScreen> {
  final _service = ActivityService();
  final _scrollCtrl = ScrollController();
  List<ActivityLog> _logs = [];
  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = true;
  String? _error;
  String _typeFilter = '';
  String _statusFilter = '';
  int _page = 1;

  static const _typeOptions = ['', 'project', 'task', 'employee', 'user', 'budget', 'department', 'auth', 'system'];
  static const _statusOptions = ['', 'success', 'error', 'warning'];

  @override
  void initState() {
    super.initState();
    _load(reset: true);
    _scrollCtrl.addListener(_onScroll);
  }

  @override
  void dispose() { _scrollCtrl.dispose(); super.dispose(); }

  void _onScroll() {
    if (_scrollCtrl.position.pixels >= _scrollCtrl.position.maxScrollExtent - 200 && !_loadingMore && _hasMore) {
      _loadMore();
    }
  }

  Future<void> _load({bool reset = false}) async {
    if (!mounted) return;
    if (reset) { _page = 1; _hasMore = true; }
    setState(() { _loading = reset; _error = null; });
    try {
      final list = await _service.getActivities(
        page: 1,
        limit: 30,
        resourceType: _typeFilter.isEmpty ? null : _typeFilter,
        status: _statusFilter.isEmpty ? null : _statusFilter,
      );
      if (mounted) setState(() { _logs = list; _loading = false; _hasMore = list.length == 30; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore) return;
    setState(() => _loadingMore = true);
    try {
      final list = await _service.getActivities(
        page: ++_page,
        limit: 30,
        resourceType: _typeFilter.isEmpty ? null : _typeFilter,
        status: _statusFilter.isEmpty ? null : _statusFilter,
      );
      if (mounted) {
        setState(() {
        _logs.addAll(list);
        _loadingMore = false;
        _hasMore = list.length == 30;
      });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Column(
        children: [
          _FilterBar(
            typeFilter: _typeFilter,
            statusFilter: _statusFilter,
            typeOptions: _typeOptions,
            statusOptions: _statusOptions,
            onTypeChanged: (v) { setState(() => _typeFilter = v); _load(reset: true); },
            onStatusChanged: (v) { setState(() => _statusFilter = v); _load(reset: true); },
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : _error != null
                    ? _ErrorRetry(message: _error!, onRetry: () => _load(reset: true))
                    : _logs.isEmpty
                        ? const _EmptyActivity()
                        : RefreshIndicator(
                            onRefresh: () => _load(reset: true),
                            color: AppTheme.primary,
                            child: ListView.builder(
                              controller: _scrollCtrl,
                              padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                              itemCount: _logs.length + (_loadingMore ? 1 : 0),
                              itemBuilder: (_, i) {
                                if (i == _logs.length) {
                                  return const Padding(
                                    padding: EdgeInsets.all(16),
                                    child: Center(child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2)),
                                  );
                                }
                                final log = _logs[i];
                                final showDate = i == 0 || !_sameDay(_logs[i - 1].timestamp, log.timestamp);
                                return Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (showDate) _DateHeader(date: log.timestamp),
                                    _ActivityCard(log: log),
                                  ],
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;
}

class _DateHeader extends StatelessWidget {
  final DateTime date;
  const _DateHeader({required this.date});

  String _label() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final d = DateTime(date.year, date.month, date.day);
    if (d == today) return 'Today';
    if (d == today.subtract(const Duration(days: 1))) return 'Yesterday';
    return AppTheme.fmtDate(date);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: Row(
        children: [
          Expanded(child: Divider(color: AppTheme.border)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Text(_label(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textMuted)),
          ),
          Expanded(child: Divider(color: AppTheme.border)),
        ],
      ),
    );
  }
}

class _ActivityCard extends StatelessWidget {
  final ActivityLog log;
  const _ActivityCard({required this.log});

  static const _typeIcons = <String, IconData>{
    'project': Icons.folder_outlined,
    'task': Icons.task_outlined,
    'employee': Icons.person_outline,
    'user': Icons.manage_accounts_outlined,
    'budget': Icons.account_balance_wallet_outlined,
    'department': Icons.business_outlined,
    'auth': Icons.lock_outline,
    'system': Icons.settings_outlined,
    'file': Icons.attach_file_outlined,
    'report': Icons.bar_chart_outlined,
    'other': Icons.circle_outlined,
  };

  static const _typeColors = <String, Color>{
    'project': AppTheme.purple,
    'task': AppTheme.cyan,
    'employee': AppTheme.blue,
    'user': AppTheme.primary,
    'budget': AppTheme.teal,
    'department': AppTheme.amber,
    'auth': AppTheme.red,
    'system': AppTheme.textSecondary,
    'file': AppTheme.green,
    'report': AppTheme.blue,
    'other': AppTheme.textMuted,
  };

  Color get _color => _typeColors[log.resourceType] ?? AppTheme.textMuted;
  IconData get _icon => _typeIcons[log.resourceType] ?? Icons.circle_outlined;

  Color get _statusColor => switch (log.status) {
    'success' => AppTheme.green,
    'error' => AppTheme.red,
    'warning' => AppTheme.amber,
    _ => AppTheme.textMuted,
  };

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1F2937) : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isDark ? const Color(0xFF374151) : AppTheme.border),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: _color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(_icon, color: _color, size: 16),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          log.action,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Container(
                        width: 7,
                        height: 7,
                        margin: const EdgeInsets.only(left: 6),
                        decoration: BoxDecoration(color: _statusColor, shape: BoxShape.circle),
                      ),
                    ],
                  ),
                  if (log.details.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      log.details,
                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.person_outline, size: 11, color: AppTheme.textMuted),
                      const SizedBox(width: 3),
                      Text(log.userName, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                      if (log.projectName != null) ...[
                        const SizedBox(width: 8),
                        const Icon(Icons.folder_outlined, size: 11, color: AppTheme.textMuted),
                        const SizedBox(width: 3),
                        Flexible(
                          child: Text(
                            log.projectName!,
                            style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                      const Spacer(),
                      Text(timeago.format(log.timestamp), style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterBar extends StatelessWidget {
  final String typeFilter;
  final String statusFilter;
  final List<String> typeOptions;
  final List<String> statusOptions;
  final ValueChanged<String> onTypeChanged;
  final ValueChanged<String> onStatusChanged;

  const _FilterBar({
    required this.typeFilter,
    required this.statusFilter,
    required this.typeOptions,
    required this.statusOptions,
    required this.onTypeChanged,
    required this.onStatusChanged,
  });

  static const _typeLabels = <String, String>{
    '': 'All Types',
    'project': 'Projects',
    'task': 'Tasks',
    'employee': 'Employees',
    'user': 'Users',
    'budget': 'Budget',
    'department': 'Departments',
    'auth': 'Auth',
    'system': 'System',
  };

  static const _statusLabels = <String, String>{
    '': 'All',
    'success': 'Success',
    'error': 'Error',
    'warning': 'Warning',
  };

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      color: isDark ? const Color(0xFF1F2937) : Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            height: 32,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: typeOptions.map((t) => Padding(
                padding: const EdgeInsets.only(right: 6),
                child: _Chip(
                  label: _typeLabels[t] ?? t,
                  selected: typeFilter == t,
                  onTap: () => onTypeChanged(t),
                  color: AppTheme.primary,
                ),
              )).toList(),
            ),
          ),
          const SizedBox(height: 6),
          SizedBox(
            height: 32,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: statusOptions.map((s) => Padding(
                padding: const EdgeInsets.only(right: 6),
                child: _Chip(
                  label: _statusLabels[s] ?? s,
                  selected: statusFilter == s,
                  onTap: () => onStatusChanged(s),
                  color: switch (s) {
                    'success' => AppTheme.green,
                    'error' => AppTheme.red,
                    'warning' => AppTheme.amber,
                    _ => AppTheme.blue,
                  },
                ),
              )).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color color;

  const _Chip({required this.label, required this.selected, required this.onTap, required this.color});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: selected ? color : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? color : AppTheme.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
            color: selected ? Colors.white : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _EmptyActivity extends StatelessWidget {
  const _EmptyActivity();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.history_outlined, size: 52, color: AppTheme.textMuted),
          SizedBox(height: 12),
          Text('No activity found', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
          SizedBox(height: 4),
          Text('Activity will appear here as actions are taken', style: TextStyle(fontSize: 13, color: AppTheme.textMuted)),
        ],
      ),
    );
  }
}

class _ErrorRetry extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorRetry({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: AppTheme.red, size: 40),
            const SizedBox(height: 8),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.red, fontSize: 13)),
            const SizedBox(height: 12),
            TextButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
