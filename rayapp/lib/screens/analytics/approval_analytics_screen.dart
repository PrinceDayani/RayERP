import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/analytics_service.dart';

class ApprovalAnalyticsScreen extends StatefulWidget {
  const ApprovalAnalyticsScreen({super.key});
  @override
  State<ApprovalAnalyticsScreen> createState() => _State();
}

class _State extends State<ApprovalAnalyticsScreen> with SingleTickerProviderStateMixin {
  final _svc = AnalyticsService();
  late TabController _tabs;
  Map<String, dynamic> _stats = {};
  List<dynamic> _approvals = [];
  bool _loading = true;
  String? _error;
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final r = await Future.wait([
        _svc.getApprovalStats(),
        _svc.getApprovals(status: _filter == 'all' ? null : _filter),
      ]);
      if (!mounted) return;
      setState(() {
        _stats = r[0] as Map<String, dynamic>;
        _approvals = r[1] as List<dynamic>;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Approval Analytics'),
        actions: [IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: _load)],
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          indicatorSize: TabBarIndicatorSize.label,
          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          tabs: const [Tab(text: 'Analytics'), Tab(text: 'Requests')],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? _ErrView(error: _error!, onRetry: _load)
              : TabBarView(controller: _tabs, children: [
                  _StatsTab(stats: _stats),
                  _RequestsTab(
                    approvals: _approvals,
                    filter: _filter,
                    onFilterChange: (f) { setState(() => _filter = f); _load(); },
                  ),
                ]),
    );
  }
}

class _StatsTab extends StatelessWidget {
  final Map<String, dynamic> stats;
  const _StatsTab({required this.stats});

  @override
  Widget build(BuildContext context) {
    if (stats.isEmpty) return const _Empty('No approval data available');
    final total = (stats['total'] ?? stats['totalRequests'] ?? 0) as num;
    final pending = (stats['pending'] ?? stats['pendingCount'] ?? 0) as num;
    final approved = (stats['approved'] ?? stats['approvedCount'] ?? 0) as num;
    final rejected = (stats['rejected'] ?? stats['rejectedCount'] ?? 0) as num;
    final avgTime = stats['averageApprovalTime']?.toString() ?? stats['avgTime']?.toString() ?? '';
    final byType = stats['byType'] as List? ?? stats['typeBreakdown'] as List? ?? [];
    final p = _hPad(context);

    return SingleChildScrollView(
      padding: EdgeInsets.all(p),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        LayoutBuilder(builder: (_, c) {
          final cols = c.maxWidth < 360 ? 2 : c.maxWidth < 600 ? 2 : 4;
          final gap = (cols - 1) * 8.0;
          final w = (c.maxWidth - gap) / cols;
          return Wrap(spacing: 8, runSpacing: 8, children: [
            _Tile('Total', total.toString(), AppTheme.primary, Icons.approval_outlined, w),
            _Tile('Pending', pending.toString(), AppTheme.amber, Icons.hourglass_empty_outlined, w),
            _Tile('Approved', approved.toString(), AppTheme.green, Icons.check_circle_outline, w),
            _Tile('Rejected', rejected.toString(), AppTheme.red, Icons.cancel_outlined, w),
          ]);
        }),
        const SizedBox(height: 20),
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Approval Rate', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          _RateBar('Approved', approved, total, AppTheme.green),
          const SizedBox(height: 8),
          _RateBar('Pending', pending, total, AppTheme.amber),
          const SizedBox(height: 8),
          _RateBar('Rejected', rejected, total, AppTheme.red),
          if (avgTime.isNotEmpty) ...[
            const SizedBox(height: 12),
            Row(children: [
              const Icon(Icons.timer_outlined, size: 14, color: AppTheme.textSecondary),
              const SizedBox(width: 6),
              Text('Avg approval time: $avgTime',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
            ]),
          ],
        ])),
        if (byType.isNotEmpty) ...[
          const SizedBox(height: 20),
          const _SecHead('By Type'),
          const SizedBox(height: 10),
          _Card(child: Column(children: byType.map<Widget>((t) {
            final name = t['type']?.toString() ?? t['name']?.toString() ?? '';
            final count = (t['count'] ?? 0) as num;
            final pct = total > 0 ? (count / total).clamp(0.0, 1.0) : 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(children: [
                SizedBox(width: 90, child: Text(name,
                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                    maxLines: 1, overflow: TextOverflow.ellipsis)),
                Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(value: pct, minHeight: 10,
                        backgroundColor: AppTheme.border,
                        valueColor: const AlwaysStoppedAnimation(AppTheme.primary)))),
                const SizedBox(width: 8),
                Text('${count.toInt()}', style: const TextStyle(fontSize: 12,
                    fontWeight: FontWeight.w700, color: AppTheme.primary)),
              ]),
            );
          }).toList())),
        ],
        const SizedBox(height: 16),
      ]),
    );
  }
}

class _RequestsTab extends StatelessWidget {
  final List<dynamic> approvals;
  final String filter;
  final ValueChanged<String> onFilterChange;
  const _RequestsTab({required this.approvals, required this.filter, required this.onFilterChange});

  @override
  Widget build(BuildContext context) {
    final p = _hPad(context);
    return Column(children: [
      Container(
        color: Theme.of(context).cardColor,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: ['all', 'pending', 'approved', 'rejected'].map((s) {
            final active = filter == s;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: GestureDetector(
                onTap: () => onFilterChange(s),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: active ? AppTheme.primary : AppTheme.primary.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: active ? AppTheme.primary : AppTheme.primary.withOpacity(0.2)),
                  ),
                  child: Text(s[0].toUpperCase() + s.substring(1),
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                          color: active ? Colors.white : AppTheme.primary)),
                ),
              ),
            );
          }).toList()),
        ),
      ),
      Expanded(child: approvals.isEmpty
          ? const _Empty('No approval requests found')
          : ListView.separated(
              padding: EdgeInsets.all(p),
              itemCount: approvals.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final a = approvals[i] as Map;
                final title = a['title']?.toString() ?? a['requestType']?.toString() ?? 'Request';
                final requester = a['requesterName']?.toString() ?? a['requestedBy']?.toString() ?? '';
                final status = a['status']?.toString() ?? '';
                final type = a['type']?.toString() ?? a['requestType']?.toString() ?? '';
                final date = a['createdAt']?.toString() ?? a['requestDate']?.toString() ?? '';
                final color = AppTheme.statusColor(status.toLowerCase());
                final bg = AppTheme.statusBg(status.toLowerCase());
                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.border)),
                  child: Row(children: [
                    Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                      child: Icon(Icons.approval_outlined, size: 20, color: color),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                      if (requester.isNotEmpty)
                        Text(requester, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                      if (type.isNotEmpty)
                        Text(type, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                    ])),
                    Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
                        child: Text(status.toUpperCase(),
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
                      ),
                      if (date.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(date.length > 10 ? date.substring(0, 10) : date,
                            style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                      ],
                    ]),
                  ]),
                );
              },
            )),
    ]);
  }
}

class _RateBar extends StatelessWidget {
  final String label;
  final num value, total;
  final Color color;
  const _RateBar(this.label, this.value, this.total, this.color);
  @override
  Widget build(BuildContext context) {
    final pct = total > 0 ? (value / total).clamp(0.0, 1.0) : 0.0;
    return Row(children: [
      SizedBox(width: 70, child: Text(label,
          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
      Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(value: pct, minHeight: 10,
              backgroundColor: AppTheme.border, valueColor: AlwaysStoppedAnimation(color)))),
      const SizedBox(width: 8),
      Text('${value.toInt()} (${(pct * 100).toStringAsFixed(0)}%)',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
    ]);
  }
}

class _Tile extends StatelessWidget {
  final String label, value;
  final Color color;
  final IconData icon;
  final double width;
  const _Tile(this.label, this.value, this.color, this.icon, this.width);
  @override
  Widget build(BuildContext context) => SizedBox(width: width, child: Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: color.withOpacity(0.06), borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.18))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(icon, size: 16, color: color),
      const SizedBox(height: 8),
      FittedBox(child: Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color))),
      Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
          maxLines: 1, overflow: TextOverflow.ellipsis),
    ]),
  ));
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity, padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border)),
    child: child,
  );
}

class _SecHead extends StatelessWidget {
  final String title;
  const _SecHead(this.title);
  @override
  Widget build(BuildContext context) => Text(title,
      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary));
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

double _hPad(BuildContext context) {
  final w = MediaQuery.of(context).size.width;
  return w < 400 ? 12 : w < 768 ? 16 : 24;
}
