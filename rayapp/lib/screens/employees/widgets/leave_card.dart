import 'package:flutter/material.dart';
import '../../../config/app_theme.dart';
import '../../../models/leave.dart';

class LeaveCard extends StatelessWidget {
  final Leave leave;
  final void Function(String status) onUpdateStatus;
  const LeaveCard({super.key, required this.leave, required this.onUpdateStatus});

  @override
  Widget build(BuildContext context) {
    final l = leave;
    final color = AppTheme.statusColor(l.status);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: IntrinsicHeight(
        child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Container(
            width: 3,
            decoration: BoxDecoration(
              color: color,
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(12), bottomLeft: Radius.circular(12)),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(6)),
                    child: Text(l.leaveType.toUpperCase(),
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.primary, letterSpacing: 0.5)),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(color: AppTheme.statusBg(l.status), borderRadius: BorderRadius.circular(20)),
                    child: Text(l.status, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w600)),
                  ),
                ]),
                const SizedBox(height: 6),
                Row(children: [
                  const Icon(Icons.date_range_outlined, size: 12, color: AppTheme.textMuted),
                  const SizedBox(width: 4),
                  Text('${AppTheme.fmtDate(l.startDate.toLocal())}  →  ${AppTheme.fmtDate(l.endDate.toLocal())}',
                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(color: const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(8)),
                    child: Text('${l.totalDays}d',
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                  ),
                ]),
                const SizedBox(height: 4),
                Text(l.reason,
                    style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary),
                    maxLines: 2, overflow: TextOverflow.ellipsis),
                if (l.rejectionReason != null && l.rejectionReason!.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text('Rejected: ${l.rejectionReason}',
                      style: const TextStyle(fontSize: 11, color: AppTheme.red)),
                ],
                if (l.status == 'pending') ...[
                  const SizedBox(height: 8),
                  Row(children: [
                    _actionBtn('Approve', AppTheme.green, () => onUpdateStatus('approved')),
                    const SizedBox(width: 8),
                    _actionBtn('Reject', AppTheme.red, () => onUpdateStatus('rejected')),
                  ]),
                ],
              ]),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _actionBtn(String label, Color color, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
          decoration: BoxDecoration(
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: color.withOpacity(0.3)),
          ),
          child: Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
        ),
      );
}
