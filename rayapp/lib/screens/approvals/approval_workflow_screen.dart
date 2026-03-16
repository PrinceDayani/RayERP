import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/approval.dart';
import '../../services/approval_service.dart';

class ApprovalWorkflowScreen extends StatefulWidget {
  const ApprovalWorkflowScreen({super.key});
  @override
  State<ApprovalWorkflowScreen> createState() => _State();
}

class _State extends State<ApprovalWorkflowScreen> with SingleTickerProviderStateMixin {
  final _svc = ApprovalService();
  late TabController _tabs;

  ApprovalStats? _stats;
  bool _statsLoading = true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _loadStats();
  }

  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  Future<void> _loadStats() async {
    setState(() => _statsLoading = true);
    try {
      final s = await _svc.getStats();
      if (mounted) setState(() { _stats = s; _statsLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _statsLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Approvals'),
        actions: [IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: _loadStats)],
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          indicatorSize: TabBarIndicatorSize.label,
          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          tabs: [
            Tab(text: _stats != null && _stats!.pending > 0 ? 'Pending (${_stats!.pending})' : 'Pending'),
            const Tab(text: 'All'),
            const Tab(text: 'History'),
          ],
        ),
      ),
      body: Column(children: [
        _StatsBar(stats: _stats, loading: _statsLoading, isDark: isDark),
        Expanded(
          child: TabBarView(controller: _tabs, children: [
            _PendingTab(svc: _svc, onAction: _loadStats),
            const _AllTab(),
            const _HistoryTab(),
          ]),
        ),
      ]),
    );
  }
}

// ── Stats Bar ────────────────────────────────────────────────────────────────

class _StatsBar extends StatelessWidget {
  final ApprovalStats? stats;
  final bool loading;
  final bool isDark;
  const _StatsBar({required this.stats, required this.loading, required this.isDark});

  @override
  Widget build(BuildContext context) {
    if (loading) return const LinearProgressIndicator(color: AppTheme.primary, minHeight: 2);
    if (stats == null) return const SizedBox.shrink();
    final s = stats!;
    return Container(
      color: isDark ? const Color(0xFF1F2937) : Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(children: [
        _StatChip('Pending', s.pending.toString(), AppTheme.amber),
        const SizedBox(width: 8),
        _StatChip('In Review', s.underReview.toString(), AppTheme.blue),
        const SizedBox(width: 8),
        _StatChip('Approved Today', s.approvedToday.toString(), AppTheme.green),
        const SizedBox(width: 8),
        _StatChip('Total Amt', '₹${_fmt(s.totalAmount)}', AppTheme.primary),
      ]),
    );
  }

  String _fmt(double v) {
    if (v >= 100000) return '${(v / 100000).toStringAsFixed(1)}L';
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
    return v.toStringAsFixed(0);
  }
}

class _StatChip extends StatelessWidget {
  final String label, value;
  final Color color;
  const _StatChip(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(children: [
        Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: color)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary),
            maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center),
      ]),
    ),
  );
}

// ── Pending Tab ──────────────────────────────────────────────────────────────

class _PendingTab extends StatefulWidget {
  final ApprovalService svc;
  final VoidCallback onAction;
  const _PendingTab({required this.svc, required this.onAction});
  @override
  State<_PendingTab> createState() => _PendingTabState();
}

class _PendingTabState extends State<_PendingTab> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  List<ApprovalRequest> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final items = await widget.svc.getPending();
      if (mounted) setState(() { _items = items; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _approve(ApprovalRequest req) async {
    final comment = await _commentDialog(context, 'Approve', optional: true);
    if (comment == null) return;
    try {
      await widget.svc.approve(req.id, comments: comment);
      widget.onAction();
      _load();
    } catch (e) {
      if (mounted) _showErr(e.toString());
    }
  }

  Future<void> _reject(ApprovalRequest req) async {
    final reason = await _commentDialog(context, 'Reject', optional: false);
    if (reason == null || reason.trim().isEmpty) return;
    try {
      await widget.svc.reject(req.id, reason: reason);
      widget.onAction();
      _load();
    } catch (e) {
      if (mounted) _showErr(e.toString());
    }
  }

  void _showErr(String msg) => ScaffoldMessenger.of(context)
      .showSnackBar(SnackBar(content: Text(msg), backgroundColor: AppTheme.red));

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_error != null) return _ErrView(error: _error!, onRetry: _load);
    if (_items.isEmpty) return const _Empty('No pending approvals');
    final p = AppTheme.hPad(context);
    return RefreshIndicator(
      color: AppTheme.primary,
      onRefresh: _load,
      child: AppTheme.constrain(ListView.separated(
        padding: EdgeInsets.all(p),
        itemCount: _items.length,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (_, i) => _PendingCard(
          req: _items[i],
          onApprove: () => _approve(_items[i]),
          onReject: () => _reject(_items[i]),
        ),
      )),
    );
  }
}

class _PendingCard extends StatelessWidget {
  final ApprovalRequest req;
  final VoidCallback onApprove, onReject;
  const _PendingCard({required this.req, required this.onApprove, required this.onReject});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final priorityColor = _priorityColor(req.priority);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2937) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? const Color(0xFF374151) : AppTheme.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(req.title,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
              maxLines: 2, overflow: TextOverflow.ellipsis)),
          const SizedBox(width: 8),
          _Badge(req.priority.toUpperCase(), priorityColor),
        ]),
        if (req.description.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(req.description, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
              maxLines: 2, overflow: TextOverflow.ellipsis),
        ],
        const SizedBox(height: 10),
        Row(children: [
          if (req.requestedBy != null) ...[
            const Icon(Icons.person_outline, size: 13, color: AppTheme.textMuted),
            const SizedBox(width: 4),
            Text(req.requestedBy!.name, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
            const SizedBox(width: 12),
          ],
          if (req.amount > 0) ...[
            const Icon(Icons.currency_rupee, size: 13, color: AppTheme.textMuted),
            Text(req.amount.toStringAsFixed(0),
                style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
            const SizedBox(width: 12),
          ],
          const Icon(Icons.layers_outlined, size: 13, color: AppTheme.textMuted),
          const SizedBox(width: 4),
          Text('Level ${req.currentLevel}/${req.totalLevels}',
              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
          const Spacer(),
          Text(AppTheme.fmtDate(req.requestedAt),
              style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: onReject,
              icon: const Icon(Icons.close, size: 14),
              label: const Text('Reject', style: TextStyle(fontSize: 13)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.red,
                side: const BorderSide(color: AppTheme.red),
                padding: const EdgeInsets.symmetric(vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: onApprove,
              icon: const Icon(Icons.check, size: 14),
              label: const Text('Approve', style: TextStyle(fontSize: 13)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.green,
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ),
        ]),
      ]),
    );
  }

  Color _priorityColor(String p) => switch (p.toLowerCase()) {
    'critical' => AppTheme.red,
    'high'     => const Color(0xFFEA580C),
    'medium'   => AppTheme.blue,
    _          => AppTheme.green,
  };
}

// ── All Tab ──────────────────────────────────────────────────────────────────

class _AllTab extends StatefulWidget {
  const _AllTab();
  @override
  State<_AllTab> createState() => _AllTabState();
}

class _AllTabState extends State<_AllTab> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  final _svc = ApprovalService();
  List<ApprovalRequest> _items = [];
  bool _loading = true;
  String? _error;
  String _status = 'all';
  int _page = 1, _pages = 1;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load({bool reset = true}) async {
    if (reset) _page = 1;
    setState(() { _loading = true; _error = null; });
    try {
      final r = await _svc.getAll(status: _status, page: _page);
      if (mounted) setState(() { _items = r.items; _pages = r.pages; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final p = AppTheme.hPad(context);
    return Column(children: [
      _FilterBar(selected: _status, onSelect: (s) { setState(() => _status = s); _load(); }),
      if (_loading) const LinearProgressIndicator(color: AppTheme.primary, minHeight: 2),
      if (_error != null) Expanded(child: _ErrView(error: _error!, onRetry: _load)),
      if (!_loading && _error == null) ...[
        if (_items.isEmpty) const Expanded(child: _Empty('No approval requests found')),
        if (_items.isNotEmpty) Expanded(
          child: RefreshIndicator(
            color: AppTheme.primary,
            onRefresh: _load,
            child: AppTheme.constrain(ListView.separated(
              padding: EdgeInsets.all(p),
              itemCount: _items.length + (_pages > _page ? 1 : 0),
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                if (i == _items.length) {
                  return TextButton(
                    onPressed: () { _page++; _load(reset: false); },
                    child: const Text('Load more'),
                  );
                }
                return _RequestTile(req: _items[i]);
              },
            )),
          ),
        ),
      ],
    ]);
  }
}

// ── History Tab ──────────────────────────────────────────────────────────────

class _HistoryTab extends StatefulWidget {
  const _HistoryTab();
  @override
  State<_HistoryTab> createState() => _HistoryTabState();
}

class _HistoryTabState extends State<_HistoryTab> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  final _svc = ApprovalService();
  List<ApprovalRequest> _items = [];
  bool _loading = true;
  String? _error;
  int _page = 1, _pages = 1;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load({bool reset = true}) async {
    if (reset) _page = 1;
    setState(() { _loading = true; _error = null; });
    try {
      final r = await _svc.getHistory(page: _page);
      if (mounted) setState(() { _items = r.items; _pages = r.pages; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_error != null) return _ErrView(error: _error!, onRetry: _load);
    if (_items.isEmpty) return const _Empty('No approval history');
    final p = AppTheme.hPad(context);
    return RefreshIndicator(
      color: AppTheme.primary,
      onRefresh: _load,
      child: AppTheme.constrain(ListView.separated(
        padding: EdgeInsets.all(p),
        itemCount: _items.length + (_pages > _page ? 1 : 0),
        separatorBuilder: (_, _) => const SizedBox(height: 8),
        itemBuilder: (_, i) {
          if (i == _items.length) {
            return TextButton(
              onPressed: () { _page++; _load(reset: false); },
              child: const Text('Load more'),
            );
          }
          return _RequestTile(req: _items[i], showAudit: true);
        },
      )),
    );
  }
}

// ── Shared Widgets ───────────────────────────────────────────────────────────

class _FilterBar extends StatelessWidget {
  final String selected;
  final ValueChanged<String> onSelect;
  const _FilterBar({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) => Container(
    color: Theme.of(context).colorScheme.surface,
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    child: SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(children: ['all', 'pending', 'approved', 'rejected', 'under_review'].map((s) {
        final active = selected == s;
        final label = s == 'under_review' ? 'In Review' : s[0].toUpperCase() + s.substring(1);
        return Padding(
          padding: const EdgeInsets.only(right: 8),
          child: GestureDetector(
            onTap: () => onSelect(s),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: active ? AppTheme.primary : AppTheme.primary.withOpacity(0.06),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: active ? AppTheme.primary : AppTheme.primary.withOpacity(0.2)),
              ),
              child: Text(label, style: TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w600,
                  color: active ? Colors.white : AppTheme.primary)),
            ),
          ),
        );
      }).toList()),
    ),
  );
}

class _RequestTile extends StatelessWidget {
  final ApprovalRequest req;
  final bool showAudit;
  const _RequestTile({required this.req, this.showAudit = false});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final statusColor = AppTheme.statusColor(req.status.toLowerCase());
    final statusBg = AppTheme.statusBg(req.status.toLowerCase());
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2937) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? const Color(0xFF374151) : AppTheme.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(req.title,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
              maxLines: 1, overflow: TextOverflow.ellipsis)),
          const SizedBox(width: 8),
          _Badge(req.status.toUpperCase(), statusColor, bg: statusBg),
        ]),
        const SizedBox(height: 6),
        Row(children: [
          if (req.requestedBy != null) ...[
            const Icon(Icons.person_outline, size: 12, color: AppTheme.textMuted),
            const SizedBox(width: 3),
            Text(req.requestedBy!.name,
                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
            const SizedBox(width: 10),
          ],
          Text(req.entityType, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
          if (req.amount > 0) ...[
            const SizedBox(width: 10),
            const Icon(Icons.currency_rupee, size: 11, color: AppTheme.textMuted),
            Text(req.amount.toStringAsFixed(0),
                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
          ],
          const Spacer(),
          Text(AppTheme.fmtDate(req.requestedAt),
              style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
        ]),
        if (showAudit && req.approvalLevels.isNotEmpty) ...[
          const SizedBox(height: 10),
          const Divider(height: 1),
          const SizedBox(height: 8),
          ...req.approvalLevels.where((l) => l.approvedBy != null).map((l) => Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(children: [
              Icon(
                l.status.toLowerCase() == 'approved'
                    ? Icons.check_circle_outline
                    : Icons.cancel_outlined,
                size: 13,
                color: l.status.toLowerCase() == 'approved' ? AppTheme.green : AppTheme.red,
              ),
              const SizedBox(width: 6),
              Text('L${l.level} · ${l.approvedBy!.name}',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
              if (l.comments != null && l.comments!.isNotEmpty) ...[
                const SizedBox(width: 6),
                Expanded(child: Text('— ${l.comments}',
                    style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    maxLines: 1, overflow: TextOverflow.ellipsis)),
              ],
              if (l.approvedAt != null) ...[
                const Spacer(),
                Text(AppTheme.fmtDate(l.approvedAt!),
                    style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
              ],
            ]),
          )),
        ],
      ]),
    );
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color color;
  final Color? bg;
  const _Badge(this.label, this.color, {this.bg});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: bg ?? color.withOpacity(0.1),
      borderRadius: BorderRadius.circular(6),
    ),
    child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
  );
}

class _Empty extends StatelessWidget {
  final String message;
  const _Empty(this.message);
  @override
  Widget build(BuildContext context) => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
    const Icon(Icons.approval_outlined, size: 40, color: AppTheme.textMuted),
    const SizedBox(height: 10),
    Text(message, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
  ]));
}

class _ErrView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _ErrView({required this.error, required this.onRetry});
  @override
  Widget build(BuildContext context) => Center(child: Padding(
    padding: const EdgeInsets.all(24),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.error_outline, color: AppTheme.red, size: 44),
      const SizedBox(height: 12),
      Text(error, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
          textAlign: TextAlign.center),
      const SizedBox(height: 16),
      ElevatedButton.icon(onPressed: onRetry,
          icon: const Icon(Icons.refresh, size: 16), label: const Text('Retry')),
    ]),
  ));
}

// ── Comment / Reason Dialog ──────────────────────────────────────────────────

Future<String?> _commentDialog(BuildContext context, String action, {required bool optional}) async {
  final ctrl = TextEditingController();
  return showDialog<String>(
    context: context,
    builder: (_) => AlertDialog(
      title: Text('$action Request'),
      content: TextField(
        controller: ctrl,
        maxLines: 3,
        decoration: InputDecoration(
          hintText: optional ? 'Comments (optional)' : 'Reason (required)',
          border: const OutlineInputBorder(),
        ),
        autofocus: true,
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: () {
            if (!optional && ctrl.text.trim().isEmpty) return;
            Navigator.pop(context, ctrl.text.trim());
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: action == 'Approve' ? AppTheme.green : AppTheme.red,
            foregroundColor: Colors.white,
          ),
          child: Text(action),
        ),
      ],
    ),
  );
}
