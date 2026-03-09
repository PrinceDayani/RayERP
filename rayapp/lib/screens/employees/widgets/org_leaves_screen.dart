import 'package:flutter/material.dart';
import '../../../config/app_theme.dart';
import '../../../models/leave.dart';
import '../../../services/leave_service.dart';

class OrgLeavesScreen extends StatefulWidget {
  const OrgLeavesScreen({super.key});
  @override
  State<OrgLeavesScreen> createState() => _OrgLeavesScreenState();
}

class _OrgLeavesScreenState extends State<OrgLeavesScreen> {
  final _svc = LeaveService();
  List<Leave> _all = [];
  bool _loading = true;
  String? _error;
  String _statusFilter = '';

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _svc.getAll();
      if (mounted) setState(() { _all = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<Leave> get _filtered => _statusFilter.isEmpty
      ? _all
      : _all.where((l) => l.status == _statusFilter).toList();

  Future<void> _updateStatus(String id, String status) async {
    try {
      await _svc.updateStatus(id, status);
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final pending = _all.where((l) => l.status == 'pending').length;
    final approved = _all.where((l) => l.status == 'approved').length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('Leave Management'),
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _load)],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 36),
                  const SizedBox(height: 8),
                  Text(_error!, style: const TextStyle(color: Color(0xFFDC2626))),
                  TextButton(onPressed: _load, child: const Text('Retry')),
                ]))
              : Column(children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(children: [
                        _chip('All', '', _all.length),
                        const SizedBox(width: 8),
                        _chip('Pending', 'pending', pending),
                        const SizedBox(width: 8),
                        _chip('Approved', 'approved', approved),
                        const SizedBox(width: 8),
                        _chip('Rejected', 'rejected', _all.where((l) => l.status == 'rejected').length),
                      ]),
                    ),
                  ),
                  Expanded(
                    child: _filtered.isEmpty
                        ? const Center(child: Text('No leave requests', style: TextStyle(color: Color(0xFF6B7280))))
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                            itemCount: _filtered.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 8),
                            itemBuilder: (_, i) => _card(_filtered[i]),
                          ),
                  ),
                ]),
    );
  }

  Widget _chip(String label, String value, int count) {
    final sel = _statusFilter == value;
    final color = value == 'pending' ? const Color(0xFFD97706)
        : value == 'approved' ? const Color(0xFF16A34A)
        : value == 'rejected' ? const Color(0xFFDC2626)
        : AppTheme.primary;
    return GestureDetector(
      onTap: () => setState(() => _statusFilter = sel ? '' : value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: sel ? color.withOpacity(0.1) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: sel ? color : const Color(0xFFE5E7EB)),
        ),
        child: Text('$label ($count)', style: TextStyle(fontSize: 12, color: sel ? color : const Color(0xFF6B7280), fontWeight: sel ? FontWeight.w700 : FontWeight.normal)),
      ),
    );
  }

  Widget _card(Leave l) {
    final statusColor = l.status == 'approved' ? const Color(0xFF16A34A)
        : l.status == 'rejected' ? const Color(0xFFDC2626)
        : const Color(0xFFD97706);
    final start = l.startDate.toIso8601String().split('T')[0];
    final end = l.endDate.toIso8601String().split('T')[0];

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFE5E7EB))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(l.leaveType.toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF6B7280), letterSpacing: 0.5))),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Text(l.status, style: TextStyle(fontSize: 11, color: statusColor, fontWeight: FontWeight.w600)),
          ),
        ]),
        const SizedBox(height: 6),
        Text('$start → $end  ·  ${l.totalDays} day${l.totalDays != 1 ? 's' : ''}',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF111827))),
        if (l.reason.isNotEmpty) ...[ const SizedBox(height: 4), Text(l.reason, style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)), maxLines: 2, overflow: TextOverflow.ellipsis) ],
        if (l.status == 'pending') ...[ const SizedBox(height: 10), Row(children: [
          Expanded(child: OutlinedButton(
            style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFFDC2626), side: const BorderSide(color: Color(0xFFDC2626)), padding: const EdgeInsets.symmetric(vertical: 6)),
            onPressed: () => _updateStatus(l.id, 'rejected'),
            child: const Text('Reject', style: TextStyle(fontSize: 12)),
          )),
          const SizedBox(width: 8),
          Expanded(child: ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), padding: const EdgeInsets.symmetric(vertical: 6)),
            onPressed: () => _updateStatus(l.id, 'approved'),
            child: const Text('Approve', style: TextStyle(fontSize: 12, color: Colors.white)),
          )),
        ])],
      ]),
    );
  }
}
