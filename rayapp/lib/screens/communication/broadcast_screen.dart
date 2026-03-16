import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../config/app_theme.dart';
import '../../models/notification_models.dart';
import '../../services/auth_provider.dart';
import '../../services/broadcast_service.dart';
import '../../services/socket_service.dart';

class BroadcastScreen extends StatefulWidget {
  const BroadcastScreen({super.key});

  @override
  State<BroadcastScreen> createState() => _BroadcastScreenState();
}

class _BroadcastScreenState extends State<BroadcastScreen> {
  final _service = BroadcastService();
  List<Broadcast> _broadcasts = [];
  bool _loading = true;
  String? _error;
  late StreamSubscription _sub;

  @override
  void initState() {
    super.initState();
    _load();
    _sub = context.read<SocketService>().onBroadcast.listen((_) {
      if (mounted) _load();
    });
  }

  @override
  void dispose() { _sub.cancel(); super.dispose(); }

  Future<void> _load() async {
    final userId = context.read<AuthProvider>().user?.id ?? '';
    if (!mounted) return;
    setState(() { _loading = _broadcasts.isEmpty; _error = null; });
    try {
      final list = await _service.getBroadcasts(userId);
      if (mounted) setState(() { _broadcasts = list; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _markRead(Broadcast b) async {
    if (b.isRead) return;
    setState(() {
      final idx = _broadcasts.indexWhere((x) => x.id == b.id);
      if (idx != -1) {
        _broadcasts[idx] = Broadcast(
          id: b.id, senderName: b.senderName, content: b.content,
          type: b.type, departmentName: b.departmentName,
          timestamp: b.timestamp, isRead: true,
        );
      }
    });
    try { await _service.markAsRead(b.id); } catch (_) {}
  }

  bool _canSend(String role) {
    final r = role.toLowerCase();
    return r == 'admin' || r == 'manager' || r == 'super admin';
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    final canSend = _canSend(auth.user?.role ?? '');
    final unread = _broadcasts.where((b) => !b.isRead).length;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      floatingActionButton: canSend
          ? FloatingActionButton(
              heroTag: 'broadcast_fab',
              backgroundColor: AppTheme.primary,
              onPressed: () => _showSendDialog(),
              child: const Icon(Icons.campaign_outlined, color: Colors.white),
            )
          : null,
      body: Column(
        children: [
          if (unread > 0)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.campaign_outlined, color: AppTheme.primary, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '$unread unread broadcast${unread > 1 ? 's' : ''}',
                      style: const TextStyle(fontSize: 13, color: AppTheme.primary, fontWeight: FontWeight.w600),
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      for (final b in _broadcasts.where((b) => !b.isRead)) {
                        _markRead(b);
                      }
                    },
                    child: const Text('Mark all read', style: TextStyle(fontSize: 12, color: AppTheme.primary, decoration: TextDecoration.underline)),
                  ),
                ],
              ),
            ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : _error != null
                    ? _ErrorRetry(message: _error!, onRetry: _load)
                    : _broadcasts.isEmpty
                        ? const _EmptyBroadcast()
                        : RefreshIndicator(
                            onRefresh: _load,
                            color: AppTheme.primary,
                            child: ListView.separated(
                              padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                              itemCount: _broadcasts.length,
                              separatorBuilder: (_, _) => const SizedBox(height: 8),
                              itemBuilder: (_, i) => _BroadcastCard(
                                broadcast: _broadcasts[i],
                                onTap: () => _markRead(_broadcasts[i]),
                              ),
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Future<void> _showSendDialog() async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _SendBroadcastSheet(
        onSend: (content, type) async {
          Navigator.pop(context);
          try {
            await _service.sendBroadcast(content: content, type: type);
            _load();
          } catch (e) {
            if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
          }
        },
      ),
    );
  }
}

class _BroadcastCard extends StatelessWidget {
  final Broadcast broadcast;
  final VoidCallback onTap;

  const _BroadcastCard({required this.broadcast, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: broadcast.isRead
              ? (isDark ? const Color(0xFF1F2937) : Colors.white)
              : (isDark ? AppTheme.primary.withOpacity(0.1) : AppTheme.primary.withOpacity(0.05)),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: broadcast.isRead
                ? (isDark ? const Color(0xFF374151) : AppTheme.border)
                : AppTheme.primary.withOpacity(0.3),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.campaign_outlined, color: AppTheme.primary, size: 16),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        broadcast.senderName,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                      Row(
                        children: [
                          Text(
                            timeago.format(broadcast.timestamp),
                            style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                          ),
                          if (broadcast.departmentName != null) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(
                                color: AppTheme.blue.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                broadcast.departmentName!,
                                style: const TextStyle(fontSize: 10, color: AppTheme.blue, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                if (!broadcast.isRead)
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              broadcast.content,
              style: TextStyle(
                fontSize: 14,
                color: isDark ? Colors.white : AppTheme.textPrimary,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SendBroadcastSheet extends StatefulWidget {
  final Future<void> Function(String content, String type) onSend;
  const _SendBroadcastSheet({required this.onSend});

  @override
  State<_SendBroadcastSheet> createState() => _SendBroadcastSheetState();
}

class _SendBroadcastSheetState extends State<_SendBroadcastSheet> {
  final _ctrl = TextEditingController();
  String _type = 'webapp';
  bool _sending = false;

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.campaign_outlined, color: AppTheme.primary, size: 20),
                const SizedBox(width: 8),
                const Text('Send Broadcast', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const Spacer(),
                IconButton(icon: const Icon(Icons.close, size: 20), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _ctrl,
              maxLines: 4,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Write your broadcast message…',
                hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 14),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Text('Type:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                const SizedBox(width: 12),
                _TypeChip(label: 'All Users', value: 'webapp', current: _type, onTap: (v) => setState(() => _type = v)),
                const SizedBox(width: 8),
                _TypeChip(label: 'Department', value: 'department', current: _type, onTap: (v) => setState(() => _type = v)),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _sending
                    ? null
                    : () async {
                        final text = _ctrl.text.trim();
                        if (text.isEmpty) return;
                        setState(() => _sending = true);
                        await widget.onSend(text, _type);
                      },
                icon: _sending
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.send_rounded, size: 16),
                label: Text(_sending ? 'Sending…' : 'Send Broadcast'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class _TypeChip extends StatelessWidget {
  final String label;
  final String value;
  final String current;
  final ValueChanged<String> onTap;

  const _TypeChip({required this.label, required this.value, required this.current, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final sel = current == value;
    return GestureDetector(
      onTap: () => onTap(value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: sel ? AppTheme.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: sel ? AppTheme.primary : AppTheme.border),
        ),
        child: Text(label, style: TextStyle(fontSize: 12, color: sel ? Colors.white : AppTheme.textSecondary, fontWeight: sel ? FontWeight.w600 : FontWeight.normal)),
      ),
    );
  }
}

class _EmptyBroadcast extends StatelessWidget {
  const _EmptyBroadcast();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.campaign_outlined, size: 52, color: AppTheme.textMuted),
          SizedBox(height: 12),
          Text('No broadcasts yet', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
          SizedBox(height: 4),
          Text('Announcements will appear here', style: TextStyle(fontSize: 13, color: AppTheme.textMuted)),
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
