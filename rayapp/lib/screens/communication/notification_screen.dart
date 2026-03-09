import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../config/app_theme.dart';
import '../../models/notification_models.dart';
import '../../services/notification_service.dart';
import '../../services/socket_service.dart';
import 'notification_settings_screen.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  final _service = NotificationService();
  List<AppNotification> _all = [];
  String _filter = 'all'; // all | unread
  bool _loading = true;
  String? _error;
  late StreamSubscription _sub;

  @override
  void initState() {
    super.initState();
    _load();
    _sub = context.read<SocketService>().onNotification.listen((data) {
      final n = AppNotification.fromJson(data);
      if (mounted) { setState(() => _all.insert(0, n)); }
    });
  }

  @override
  void dispose() { _sub.cancel(); super.dispose(); }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _loading = _all.isEmpty; _error = null; });
    try {
      final list = await _service.getNotifications();
      if (mounted) setState(() { _all = list; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<AppNotification> get _displayed =>
      _filter == 'unread' ? _all.where((n) => !n.read).toList() : _all;

  int get _unreadCount => _all.where((n) => !n.read).length;

  Future<void> _markRead(AppNotification n) async {
    if (n.read) return;
    setState(() => _all = _all.map((x) => x.id == n.id ? x.copyWith(read: true) : x).toList());
    try { await _service.markAsRead(n.id); } catch (_) {}
  }

  Future<void> _markAllRead() async {
    setState(() => _all = _all.map((n) => n.copyWith(read: true)).toList());
    try { await _service.markAllAsRead(); } catch (_) {}
  }

  Future<void> _delete(String id) async {
    setState(() => _all.removeWhere((n) => n.id == id));
    try { await _service.deleteNotification(id); } catch (_) {}
  }

  Future<void> _deleteAll() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: const Text('Clear All Notifications'),
        content: const Text('This will permanently delete all notifications.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppTheme.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Clear All'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _all.clear());
    try { await _service.deleteAll(); } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Row(
          children: [
            const Text('Notifications'),
            if (_unreadCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(10)),
                child: Text('$_unreadCount', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
              ),
            ],
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, size: 20),
            tooltip: 'Notification Settings',
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationSettingsScreen())),
          ),
          if (_all.isNotEmpty)
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert, size: 20),
              onSelected: (v) {
                if (v == 'mark_all') _markAllRead();
                if (v == 'clear_all') _deleteAll();
              },
              itemBuilder: (_) => [
                const PopupMenuItem(value: 'mark_all', child: Row(children: [
                  Icon(Icons.done_all, size: 16, color: AppTheme.textSecondary),
                  SizedBox(width: 10),
                  Text('Mark all as read', style: TextStyle(fontSize: 13)),
                ])),
                const PopupMenuItem(value: 'clear_all', child: Row(children: [
                  Icon(Icons.delete_sweep_outlined, size: 16, color: AppTheme.red),
                  SizedBox(width: 10),
                  Text('Clear all', style: TextStyle(fontSize: 13, color: AppTheme.red)),
                ])),
              ],
            ),
        ],
      ),
      body: Column(
        children: [
          // Filter chips
          Container(
            color: Theme.of(context).cardColor,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _FilterChip(label: 'All', value: 'all', current: _filter, onTap: (v) => setState(() => _filter = v)),
                const SizedBox(width: 8),
                _FilterChip(
                  label: 'Unread${_unreadCount > 0 ? ' ($_unreadCount)' : ''}',
                  value: 'unread',
                  current: _filter,
                  onTap: (v) => setState(() => _filter = v),
                ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : _error != null
                    ? _ErrorRetry(message: _error!, onRetry: _load)
                    : _displayed.isEmpty
                        ? _EmptyNotifications(filter: _filter)
                        : RefreshIndicator(
                            onRefresh: _load,
                            color: AppTheme.primary,
                            child: ListView.separated(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              itemCount: _displayed.length,
                              separatorBuilder: (_, __) => const Divider(height: 1, indent: 16),
                              itemBuilder: (_, i) => _NotificationTile(
                                notification: _displayed[i],
                                onTap: () => _markRead(_displayed[i]),
                                onDelete: () => _delete(_displayed[i].id),
                              ),
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _NotificationTile({required this.notification, required this.onTap, required this.onDelete});

  static const _typeIcons = <String, IconData>{
    'info': Icons.info_outline,
    'success': Icons.check_circle_outline,
    'warning': Icons.warning_amber_outlined,
    'error': Icons.error_outline,
    'project': Icons.folder_outlined,
    'task': Icons.task_outlined,
    'budget': Icons.account_balance_wallet_outlined,
    'system': Icons.settings_outlined,
    'order': Icons.shopping_cart_outlined,
    'inventory': Icons.inventory_2_outlined,
  };

  static const _typeColors = <String, Color>{
    'info': AppTheme.blue,
    'success': AppTheme.green,
    'warning': AppTheme.amber,
    'error': AppTheme.red,
    'project': AppTheme.purple,
    'task': AppTheme.cyan,
    'budget': AppTheme.teal,
    'system': AppTheme.textSecondary,
    'order': AppTheme.primary,
    'inventory': AppTheme.amber,
  };

  Color get _color => _typeColors[notification.type] ?? AppTheme.blue;
  IconData get _icon => _typeIcons[notification.type] ?? Icons.notifications_outlined;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Dismissible(
      key: Key(notification.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: AppTheme.red,
        child: const Icon(Icons.delete_outline, color: Colors.white),
      ),
      onDismissed: (_) => onDelete(),
      child: InkWell(
        onTap: onTap,
        child: Container(
          color: notification.read
              ? Colors.transparent
              : (isDark ? AppTheme.primary.withOpacity(0.06) : AppTheme.primary.withOpacity(0.04)),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: _color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(_icon, color: _color, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: notification.read ? FontWeight.w500 : FontWeight.w700,
                              color: Theme.of(context).colorScheme.onSurface,
                            ),
                          ),
                        ),
                        if (!notification.read)
                          Container(
                            width: 7,
                            height: 7,
                            margin: const EdgeInsets.only(left: 6),
                            decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                          ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      notification.message,
                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Text(
                          timeago.format(notification.createdAt),
                          style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                        ),
                        const SizedBox(width: 8),
                        _PriorityBadge(priority: notification.priority),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PriorityBadge extends StatelessWidget {
  final String priority;
  const _PriorityBadge({required this.priority});

  @override
  Widget build(BuildContext context) {
    final color = switch (priority) {
      'urgent' => AppTheme.red,
      'high' => AppTheme.amber,
      'medium' => AppTheme.blue,
      _ => AppTheme.textMuted,
    };
    if (priority == 'low') return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
      child: Text(priority, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final String value;
  final String current;
  final ValueChanged<String> onTap;

  const _FilterChip({required this.label, required this.value, required this.current, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final sel = current == value;
    return GestureDetector(
      onTap: () => onTap(value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: sel ? AppTheme.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: sel ? AppTheme.primary : AppTheme.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: sel ? FontWeight.w600 : FontWeight.normal,
            color: sel ? Colors.white : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _EmptyNotifications extends StatelessWidget {
  final String filter;
  const _EmptyNotifications({required this.filter});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.notifications_none_outlined, size: 52, color: AppTheme.textMuted),
          const SizedBox(height: 12),
          Text(
            filter == 'unread' ? 'All caught up!' : 'No notifications',
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 4),
          Text(
            filter == 'unread' ? 'No unread notifications' : 'You\'re all up to date',
            style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
          ),
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
