import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/role_permission.dart';
import '../../services/user_management_service.dart';

class ActiveSessionsScreen extends StatefulWidget {
  const ActiveSessionsScreen({super.key});
  @override
  State<ActiveSessionsScreen> createState() => _ActiveSessionsScreenState();
}

class _ActiveSessionsScreenState extends State<ActiveSessionsScreen> {
  final _svc = UserManagementService();
  List<UserSession> _sessions = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });
    try {
      final s = await _svc.getActiveSessions();
      if (!mounted) return;
      setState(() { _sessions = s; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _revoke(UserSession s) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Revoke Session'),
        content: Text('Sign out from ${_deviceLabel(s)}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(style: FilledButton.styleFrom(backgroundColor: AppTheme.red), onPressed: () => Navigator.pop(context, true), child: const Text('Revoke')),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try { await _svc.revokeSession(s.id); _load(); }
    catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e'), backgroundColor: AppTheme.red)); }
  }

  String _deviceLabel(UserSession s) {
    final parts = [s.os, s.browser].where((p) => p != null && p.isNotEmpty).map((p) => p!).toList();
    return parts.isNotEmpty ? parts.join(' · ') : 'Unknown Device';
  }

  String _timeAgo(DateTime dt) {
    final d = DateTime.now().difference(dt);
    if (d.inMinutes < 1) return 'Just now';
    if (d.inMinutes < 60) return '${d.inMinutes}m ago';
    if (d.inHours < 24) return '${d.inHours}h ago';
    return '${d.inDays}d ago';
  }

  IconData _deviceIcon(UserSession s) {
    final os = (s.os ?? '').toLowerCase();
    final dev = (s.device ?? '').toLowerCase();
    if (dev.contains('mobile') || os.contains('android') || os.contains('ios')) return Icons.smartphone_outlined;
    if (dev.contains('tablet')) return Icons.tablet_outlined;
    return Icons.computer_outlined;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(title: const Text('Active Sessions'), actions: [
        IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: _load, tooltip: 'Refresh'),
      ]),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? _errView(_error!, _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppTheme.primary,
                  child: _sessions.isEmpty
                      ? _emptyView(Icons.devices_outlined, 'No active sessions')
                      : LayoutBuilder(builder: (ctx, c) {
                          final w = c.maxWidth;
                          final pad = w < 400 ? 12.0 : 16.0;
                          final isWide = w >= 700;
                          if (isWide) {
                            return GridView.builder(
                              padding: EdgeInsets.all(pad),
                              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: w >= 1100 ? 3 : 2,
                                crossAxisSpacing: 10, mainAxisSpacing: 10,
                                childAspectRatio: 2.2,
                              ),
                              itemCount: _sessions.length,
                              itemBuilder: (_, i) => _card(_sessions[i]),
                            );
                          }
                          return ListView.separated(
                            padding: EdgeInsets.all(pad),
                            itemCount: _sessions.length,
                            separatorBuilder: (_, _) => const SizedBox(height: 8),
                            itemBuilder: (_, i) => _card(_sessions[i]),
                          );
                        }),
                ),
    );
  }

  Widget _errView(String e, VoidCallback retry) => Center(child: Padding(
    padding: const EdgeInsets.all(24),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.error_outline, size: 40, color: AppTheme.red),
      const SizedBox(height: 12),
      Text(e, textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
      const SizedBox(height: 16),
      FilledButton(onPressed: retry, child: const Text('Retry')),
    ]),
  ));

  Widget _emptyView(IconData icon, String msg) => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
    Icon(icon, size: 48, color: AppTheme.textMuted),
    const SizedBox(height: 12),
    Text(msg, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
  ]));

  Widget _card(UserSession s) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: s.isCurrent ? AppTheme.primary.withOpacity(0.5) : AppTheme.border, width: s.isCurrent ? 1.5 : 1),
        ),
        padding: const EdgeInsets.all(14),
        child: Row(children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: s.isCurrent ? AppTheme.primary.withOpacity(0.08) : AppTheme.bg,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(_deviceIcon(s), size: 22, color: s.isCurrent ? AppTheme.primary : AppTheme.textSecondary),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(_deviceLabel(s), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis)),
              if (s.isCurrent)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(color: AppTheme.greenBg, borderRadius: BorderRadius.circular(20)),
                  child: const Text('Current', style: TextStyle(fontSize: 10, color: AppTheme.green, fontWeight: FontWeight.w600)),
                ),
            ]),
            const SizedBox(height: 4),
            Row(children: [
              const Icon(Icons.wifi_outlined, size: 12, color: AppTheme.textMuted),
              const SizedBox(width: 4),
              Flexible(child: Text(s.ipAddress, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted), overflow: TextOverflow.ellipsis)),
              const SizedBox(width: 8),
              const Icon(Icons.access_time_outlined, size: 12, color: AppTheme.textMuted),
              const SizedBox(width: 4),
              Text(_timeAgo(s.lastActive), style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
            ]),
            const SizedBox(height: 2),
            Text('Started ${_timeAgo(s.createdAt)}', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
          ])),
          if (!s.isCurrent)
            IconButton(
              icon: const Icon(Icons.logout, size: 18, color: AppTheme.red),
              tooltip: 'Revoke',
              onPressed: () => _revoke(s),
            ),
        ]),
      );
}
