import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../services/project_service.dart';

class ProjectDetailScreen extends StatelessWidget {
  final String id;
  const ProjectDetailScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(title: const Text('Project')),
      body: FutureBuilder<Project>(
        future: ProjectService().getById(id),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
          }
          if (snap.hasError) return Center(child: Text('Error: ${snap.error}'));
          final p = snap.data!;
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF1A1A1A))),
                      const SizedBox(height: 6),
                      Text(p.description, style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
                      const SizedBox(height: 16),
                      // Progress
                      Row(
                        children: [
                          const Text('Progress', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF374151))),
                          const Spacer(),
                          Text('${p.progress}%', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.primary)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: p.progress / 100,
                          minHeight: 8,
                          backgroundColor: const Color(0xFFE5E7EB),
                          valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                // Details
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Column(
                    children: [
                      _tile('Status', p.status, Icons.info_outline),
                      _divider(),
                      _tile('Priority', p.priority, Icons.flag_outlined),
                      _divider(),
                      _tile('Client', p.client ?? '-', Icons.business_outlined),
                      _divider(),
                      _tile('Budget', '${p.currency} ${p.budget.toStringAsFixed(2)}', Icons.account_balance_wallet_outlined),
                      _divider(),
                      _tile('Spent', '${p.currency} ${p.spentBudget.toStringAsFixed(2)}', Icons.payments_outlined),
                      _divider(),
                      _tile('Start', p.startDate.toLocal().toString().split(' ')[0], Icons.calendar_today_outlined),
                      _divider(),
                      _tile('End', p.endDate.toLocal().toString().split(' ')[0], Icons.event_outlined),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _tile(String label, String value, IconData icon) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 18, color: AppTheme.primary),
            const SizedBox(width: 12),
            SizedBox(width: 80, child: Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)))),
            Expanded(child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF1A1A1A)))),
          ],
        ),
      );

  Widget _divider() => const Divider(height: 1, indent: 16, endIndent: 16, color: Color(0xFFE5E7EB));
}
