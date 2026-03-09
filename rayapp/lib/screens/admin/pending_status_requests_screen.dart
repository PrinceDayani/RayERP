import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/user_management_service.dart';

class PendingStatusRequestsScreen extends StatefulWidget {
  const PendingStatusRequestsScreen({super.key});
  @override
  State<PendingStatusRequestsScreen> createState() => _PendingStatusRequestsScreenState();
}

class _PendingStatusRequestsScreenState extends State<PendingStatusRequestsScreen> {
  final _svc = UserManagementService();
  List<dynamic> _requests = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _svc.getPendingStatusRequests();
      if (!mounted) return;
      setState(() { _requests = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _approve(dynamic req) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Approve Request'),
        content: Text('Approve status change for ${_userName(req)} to "${_fmt(req['requestedStatus'])}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(style: FilledButton.styleFrom(backgroundColor: AppTheme.green), onPressed: () => Navigator.pop(context, true), child: const Text('Approve')),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await _svc.approveStatusRequest(req['_id']);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request approved')));
      _load();
    } catch (e) { if (mounted) _showErr('$e'); }
  }

  Future<void> _reject(dynamic req) async {
    final ctrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Reject Request'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('Reject status change for ${_userName(req)}?'),
          const SizedBox(height: 12),
          TextField(controller: ctrl, decoration: const InputDecoration(labelText: 'Reason (optional)', isDense: true)),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(style: FilledButton.styleFrom(backgroundColor: AppTheme.red), onPressed: () => Navigator.pop(context, true), child: const Text('Reject')),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await _svc.rejectStatusRequest(req['_id'], reason: ctrl.text.trim());
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request rejected')));
      _load();
    } catch (e) { if (mounted) _showErr('$e'); }
    ctrl.dispose();
  }

  void _showErr(String msg) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: AppTheme.red));
  String _userName(dynamic req) { final u = req['user']; return u is Map ? (u['name'] ?? u['email'] ?? 'Unknown') : 'Unknown'; }
  String _requestedBy(dynamic req) { final b = req['requestedBy']; return b is Map ? (b['name'] ?? b['email'] ?? '') : ''; }
  String _fmt(String? s) { if (s == null) return ''; return s.replaceAll('_', ' ').split(' ').map((w) => w.isEmpty ? '' : '${w[0].toUpperCase()}${w.substring(1)}').join(' '); }
  String _timeAgo(String? iso) {
    if (iso == null) return '';
    final dt = DateTime.tryParse(iso); if (dt == null) return '';
    final d = DateTime.now().difference(dt);
    if (d.inMinutes < 1) return 'Just now';
    if (d.inMinutes < 60) return '${d.inMinutes}m ago';
    if (d.inHours < 24) return '${d.inHours}h ago';
    return '${d.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Row(children: [
          const Text('Status Requests'),
          if (_requests.isNotEmpty) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: AppTheme.amber, borderRadius: BorderRadius.circular(20)),
              child: Text('${_requests.length}', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
            ),
          ],
        ]),
        actions: [IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: _load)],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? _errView(_error!, _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppTheme.primary,
                  child: _requests.isEmpty
                      ? _emptyView(Icons.check_circle_outline, 'No pending requests', subtitle: 'All status change requests have been processed')
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
                                childAspectRatio: w >= 1100 ? 1.6 : 1.5,
                              ),
                              itemCount: _requests.length,
                              itemBuilder: (_, i) => _card(_requests[i]),
                            );
                          }
                          return ListView.separated(
                            padding: EdgeInsets.all(pad),
                            itemCount: _requests.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 8),
                            itemBuilder: (_, i) => _card(_requests[i]),
                          );
                        }),
                ),
    );
  }

  Widget _card(dynamic req) {
    final current = req['currentStatus'] ?? '';
    final requested = req['requestedStatus'] ?? '';
    final reason = req['reason'] ?? '';
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
      padding: const EdgeInsets.all(14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(_userName(req), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis)),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: AppTheme.amberBg, borderRadius: BorderRadius.circular(20)),
            child: const Text('Pending', style: TextStyle(fontSize: 10, color: AppTheme.amber, fontWeight: FontWeight.w600)),
          ),
        ]),
        const SizedBox(height: 10),
        Row(children: [
          _statusBadge(current),
          const Padding(padding: EdgeInsets.symmetric(horizontal: 8), child: Icon(Icons.arrow_forward, size: 14, color: AppTheme.textMuted)),
          _statusBadge(requested),
        ]),
        if (reason.isNotEmpty && reason != 'No reason provided') ...[
          const SizedBox(height: 8),
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Icon(Icons.notes_outlined, size: 13, color: AppTheme.textMuted),
            const SizedBox(width: 4),
            Expanded(child: Text(reason, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary), maxLines: 2, overflow: TextOverflow.ellipsis)),
          ]),
        ],
        const SizedBox(height: 8),
        Row(children: [
          const Icon(Icons.person_outline, size: 12, color: AppTheme.textMuted),
          const SizedBox(width: 4),
          Expanded(child: Text('By ${_requestedBy(req)}', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted), overflow: TextOverflow.ellipsis)),
          Text(_timeAgo(req['createdAt']), style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
        ]),
        const Spacer(),
        const SizedBox(height: 10),
        Row(children: [
          Expanded(child: OutlinedButton(
            style: OutlinedButton.styleFrom(foregroundColor: AppTheme.red, side: const BorderSide(color: AppTheme.red), padding: const EdgeInsets.symmetric(vertical: 10), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
            onPressed: () => _reject(req),
            child: const Text('Reject', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          )),
          const SizedBox(width: 10),
          Expanded(child: FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppTheme.green, padding: const EdgeInsets.symmetric(vertical: 10), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
            onPressed: () => _approve(req),
            child: const Text('Approve', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          )),
        ]),
      ]),
    );
  }

  Widget _statusBadge(String s) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: AppTheme.statusBg(s), borderRadius: BorderRadius.circular(6)),
        child: Text(_fmt(s), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.statusColor(s))),
      );
}
