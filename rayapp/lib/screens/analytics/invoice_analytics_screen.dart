import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/analytics_service.dart';

class InvoiceAnalyticsScreen extends StatefulWidget {
  const InvoiceAnalyticsScreen({super.key});
  @override
  State<InvoiceAnalyticsScreen> createState() => _State();
}

class _State extends State<InvoiceAnalyticsScreen> with SingleTickerProviderStateMixin {
  final _svc = AnalyticsService();
  late TabController _tabs;
  Map<String, dynamic> _analytics = {};
  List<dynamic> _invoices = [];
  bool _loading = true;
  String? _error;
  String _statusFilter = 'all';

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
        _svc.getInvoiceAnalytics(),
        _svc.getInvoices(status: _statusFilter == 'all' ? null : _statusFilter),
      ]);
      if (!mounted) return;
      setState(() {
        _analytics = r[0] as Map<String, dynamic>;
        _invoices = r[1] as List<dynamic>;
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
        title: const Text('Invoice Analytics'),
        actions: [IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: _load)],
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          indicatorSize: TabBarIndicatorSize.label,
          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          tabs: const [Tab(text: 'Analytics'), Tab(text: 'Invoices')],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? _ErrView(error: _error!, onRetry: _load)
              : TabBarView(controller: _tabs, children: [
                  _AnalyticsTab(data: _analytics),
                  _InvoicesTab(
                    invoices: _invoices,
                    statusFilter: _statusFilter,
                    onFilterChange: (s) { setState(() => _statusFilter = s); _load(); },
                  ),
                ]),
    );
  }
}

class _AnalyticsTab extends StatelessWidget {
  final Map<String, dynamic> data;
  const _AnalyticsTab({required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return const _Empty('No invoice analytics available');
    final total = (data['totalInvoices'] ?? data['total'] ?? 0) as num;
    final totalAmount = (data['totalAmount'] ?? data['revenue'] ?? 0) as num;
    final paid = (data['paidAmount'] ?? data['collected'] ?? 0) as num;
    final outstanding = (data['outstandingAmount'] ?? data['pending'] ?? totalAmount - paid) as num;
    final overdue = (data['overdueAmount'] ?? data['overdue'] ?? 0) as num;
    final overdueCount = (data['overdueCount'] ?? 0) as num;
    final collectionRate = totalAmount > 0 ? (paid / totalAmount).clamp(0.0, 1.0) : 0.0;
    final byStatus = data['byStatus'] as List? ?? data['statusBreakdown'] as List? ?? [];
    final p = _hPad(context);

    return SingleChildScrollView(
      padding: EdgeInsets.all(p),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        LayoutBuilder(builder: (_, c) {
          final cols = c.maxWidth < 360 ? 2 : c.maxWidth < 600 ? 3 : 4;
          final gap = (cols - 1) * 8.0;
          final w = (c.maxWidth - gap) / cols;
          final tiles = [
            _Tile('Total', total.toString(), AppTheme.primary, Icons.receipt_outlined, w),
            _Tile('Revenue', _fmt(totalAmount), AppTheme.blue, Icons.attach_money_outlined, w),
            _Tile('Collected', _fmt(paid), AppTheme.green, Icons.check_circle_outline, w),
            _Tile('Overdue', overdueCount.toString(), AppTheme.red, Icons.warning_amber_outlined, w),
          ];
          return Wrap(spacing: 8, runSpacing: 8, children: tiles);
        }),
        const SizedBox(height: 20),
        const _SecHead('Collection Rate'),
        const SizedBox(height: 10),
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('${(collectionRate * 100).toStringAsFixed(1)}% collected',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            Text('${_fmt(paid)} / ${_fmt(totalAmount)}',
                style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
          ]),
          const SizedBox(height: 8),
          ClipRRect(borderRadius: BorderRadius.circular(5),
              child: LinearProgressIndicator(value: collectionRate, minHeight: 12,
                  backgroundColor: AppTheme.border,
                  valueColor: AlwaysStoppedAnimation(
                      collectionRate >= 0.8 ? AppTheme.green : collectionRate >= 0.5 ? AppTheme.amber : AppTheme.red))),
          const SizedBox(height: 12),
          Row(children: [
            _LegendDot(AppTheme.green, 'Paid: ${_fmt(paid)}'),
            const SizedBox(width: 16),
            _LegendDot(AppTheme.amber, 'Outstanding: ${_fmt(outstanding)}'),
            const SizedBox(width: 16),
            _LegendDot(AppTheme.red, 'Overdue: ${_fmt(overdue)}'),
          ]),
        ])),
        if (byStatus.isNotEmpty) ...[
          const SizedBox(height: 20),
          const _SecHead('By Status'),
          const SizedBox(height: 10),
          _Card(child: Column(children: byStatus.map<Widget>((s) {
            final name = s['status']?.toString() ?? s['name']?.toString() ?? '';
            final count = (s['count'] ?? 0) as num;
            final amount = (s['amount'] ?? s['total'] ?? 0) as num;
            final pct = total > 0 ? (count / total).clamp(0.0, 1.0) : 0.0;
            final color = AppTheme.statusColor(name.toLowerCase());
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(children: [
                SizedBox(width: 80, child: Text(name,
                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                    maxLines: 1, overflow: TextOverflow.ellipsis)),
                Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(value: pct, minHeight: 10,
                        backgroundColor: AppTheme.border,
                        valueColor: AlwaysStoppedAnimation(color)))),
                const SizedBox(width: 8),
                SizedBox(width: 70, child: Text('${count.toInt()} · ${_fmt(amount)}',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color),
                    textAlign: TextAlign.right)),
              ]),
            );
          }).toList())),
        ],
        const SizedBox(height: 16),
      ]),
    );
  }
}

class _InvoicesTab extends StatelessWidget {
  final List<dynamic> invoices;
  final String statusFilter;
  final ValueChanged<String> onFilterChange;
  const _InvoicesTab({required this.invoices, required this.statusFilter, required this.onFilterChange});

  @override
  Widget build(BuildContext context) {
    final p = _hPad(context);
    return Column(children: [
      Container(
        color: Theme.of(context).cardColor,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: ['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map((s) {
            final active = statusFilter == s;
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
      Expanded(child: invoices.isEmpty
          ? const _Empty('No invoices found')
          : ListView.separated(
              padding: EdgeInsets.all(p),
              itemCount: invoices.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final inv = invoices[i] as Map;
                final number = inv['invoiceNumber']?.toString() ?? inv['number']?.toString() ?? '#${i + 1}';
                final client = inv['clientName']?.toString() ?? inv['customer']?.toString() ?? '';
                final amount = (inv['totalAmount'] ?? inv['amount'] ?? 0) as num;
                final paid = (inv['paidAmount'] ?? inv['paid'] ?? 0) as num;
                final status = inv['status']?.toString() ?? '';
                final due = inv['dueDate']?.toString() ?? '';
                final balance = amount - paid;
                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.border)),
                  child: Row(children: [
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Text(number, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                        const SizedBox(width: 8),
                        _StatusBadge(status),
                      ]),
                      if (client.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(client, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                      ],
                      if (due.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text('Due: $due', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                      ],
                    ])),
                    Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                      Text(_fmt(amount), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                      if (balance > 0)
                        Text('Balance: ${_fmt(balance)}',
                            style: const TextStyle(fontSize: 11, color: AppTheme.red)),
                    ]),
                  ]),
                );
              },
            )),
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

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendDot(this.color, this.label);
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
    Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
    const SizedBox(width: 4),
    Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
  ]);
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge(this.status);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
    decoration: BoxDecoration(color: AppTheme.statusBg(status), borderRadius: BorderRadius.circular(4)),
    child: Text(status.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700,
        color: AppTheme.statusColor(status))),
  );
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
    const Icon(Icons.receipt_long_outlined, size: 40, color: AppTheme.textMuted),
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

String _fmt(num v) {
  if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(1)}M';
  if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
  return v.toStringAsFixed(0);
}

double _hPad(BuildContext context) {
  final w = MediaQuery.of(context).size.width;
  return w < 400 ? 12 : w < 768 ? 16 : 24;
}
