import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../services/project_service.dart';
import 'project_detail_screen.dart';

class ProjectListScreen extends StatefulWidget {
  const ProjectListScreen({super.key});

  @override
  State<ProjectListScreen> createState() => _ProjectListScreenState();
}

class _ProjectListScreenState extends State<ProjectListScreen> {
  late Future<List<Project>> _future;

  @override
  void initState() {
    super.initState();
    _future = ProjectService().getAll();
  }

  Color _statusColor(String s) => switch (s) {
        'active' => const Color(0xFF16A34A),
        'planning' => const Color(0xFF2563EB),
        'on-hold' => const Color(0xFFD97706),
        'completed' => const Color(0xFF0891B2),
        _ => const Color(0xFFDC2626),
      };

  Color _statusBg(String s) => switch (s) {
        'active' => const Color(0xFFF0FDF4),
        'planning' => const Color(0xFFEFF6FF),
        'on-hold' => const Color(0xFFFFFBEB),
        'completed' => const Color(0xFFECFEFF),
        _ => const Color(0xFFFEF2F2),
      };

  Color _priorityColor(String p) => switch (p) {
        'critical' => const Color(0xFFDC2626),
        'high' => const Color(0xFFD97706),
        'medium' => const Color(0xFF2563EB),
        _ => const Color(0xFF6B7280),
      };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: FutureBuilder<List<Project>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
          }
          if (snap.hasError) return Center(child: Text('Error: ${snap.error}'));
          final projects = snap.data ?? [];
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: projects.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final p = projects[i];
              return Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProjectDetailScreen(id: p.id))),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(p.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: Color(0xFF1A1A1A))),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: _statusBg(p.status),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(p.status, style: TextStyle(color: _statusColor(p.status), fontSize: 11, fontWeight: FontWeight.w500)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(p.description, maxLines: 1, overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: _priorityColor(p.priority).withOpacity(0.08),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(p.priority, style: TextStyle(color: _priorityColor(p.priority), fontSize: 11, fontWeight: FontWeight.w500)),
                            ),
                            const Spacer(),
                            Text('${p.progress}%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
                            const SizedBox(width: 8),
                            SizedBox(
                              width: 80,
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: p.progress / 100,
                                  minHeight: 6,
                                  backgroundColor: const Color(0xFFE5E7EB),
                                  valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
