import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/resource_service.dart';

class SkillAnalyticsScreen extends StatefulWidget {
  const SkillAnalyticsScreen({super.key});

  @override
  State<SkillAnalyticsScreen> createState() => _SkillAnalyticsScreenState();
}

class _SkillAnalyticsScreenState extends State<SkillAnalyticsScreen>
    with SingleTickerProviderStateMixin {
  final _svc = ResourceService();
  late TabController _tabs;

  List<SkillDistribution> _distribution = [];
  Map<String, dynamic> _strength = {};
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([
        _svc.getSkillDistribution(),
        _svc.getSkillStrength(),
      ]);
      if (!mounted) return;
      setState(() {
        _distribution = results[0] as List<SkillDistribution>;
        _strength = results[1] as Map<String, dynamic>;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppTheme.primary));
    if (_error != null) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      Text(_error!, style: const TextStyle(color: AppTheme.red), textAlign: TextAlign.center),
      const SizedBox(height: 8),
      TextButton(onPressed: _load, child: const Text('Retry')),
    ]));
    }

    return Column(children: [
      Container(
        color: Theme.of(context).cardColor,
        child: TabBar(
          controller: _tabs,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          tabs: const [Tab(text: 'Distribution'), Tab(text: 'Team Strength')],
        ),
      ),
      Expanded(
        child: TabBarView(controller: _tabs, children: [
          _buildDistribution(),
          _buildStrength(),
        ]),
      ),
    ]);
  }

  Widget _buildDistribution() {
    if (_distribution.isEmpty) {
      return const Center(child: Text('No skill data available', style: TextStyle(color: AppTheme.textSecondary)));
    }
    // Sort by total employees descending
    final sorted = [..._distribution]..sort((a, b) => b.total.compareTo(a.total));
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: sorted.length,
        itemBuilder: (_, i) => _distributionCard(sorted[i]),
      ),
    );
  }

  Widget _distributionCard(SkillDistribution d) {
    final total = d.total == 0 ? 1 : d.total;
    final levels = [
      ('Expert', d.expert, AppTheme.green),
      ('Advanced', d.advanced, AppTheme.blue),
      ('Intermediate', d.intermediate, AppTheme.amber),
      ('Beginner', d.beginner, AppTheme.red),
    ];
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(d.skill, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14))),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: AppTheme.blueBg, borderRadius: BorderRadius.circular(10)),
              child: Text('${d.total} employees', style: const TextStyle(fontSize: 11, color: AppTheme.blue, fontWeight: FontWeight.w600)),
            ),
          ]),
          const SizedBox(height: 10),
          // Stacked bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: Row(
              children: levels.where((l) => l.$2 > 0).map((l) => Flexible(
                flex: l.$2,
                child: Tooltip(
                  message: '${l.$1}: ${l.$2}',
                  child: Container(height: 10, color: l.$3),
                ),
              )).toList(),
            ),
          ),
          const SizedBox(height: 8),
          Wrap(spacing: 12, runSpacing: 4, children: levels.map((l) => Row(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 10, height: 10, decoration: BoxDecoration(color: l.$3, borderRadius: BorderRadius.circular(2))),
            const SizedBox(width: 4),
            Text('${l.$1} ${l.$2} (${(l.$2 / total * 100).toStringAsFixed(0)}%)',
                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
          ])).toList()),
        ]),
      ),
    );
  }

  Widget _buildStrength() {
    final teamStrength = (_strength['teamStrength'] as List? ?? []);
    final deptStrength = (_strength['departmentStrength'] as List? ?? []);

    if (teamStrength.isEmpty) {
      return const Center(child: Text('No strength data available', style: TextStyle(color: AppTheme.textSecondary)));
    }

    // Sort by strength % descending
    final sorted = [...teamStrength]..sort((a, b) =>
        ((b['strengthPercentage'] ?? 0) as num).compareTo((a['strengthPercentage'] ?? 0) as num));

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('TEAM-WIDE SKILL STRENGTH', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8)),
          const SizedBox(height: 10),
          ...sorted.take(15).map((s) => _strengthRow(s)),
          if (deptStrength.isNotEmpty) ...[
            const SizedBox(height: 20),
            const Text('BY DEPARTMENT', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 0.8)),
            const SizedBox(height: 10),
            ...deptStrength.map((dept) => _deptSection(dept)),
          ],
        ],
      ),
    );
  }

  Widget _strengthRow(Map<String, dynamic> s) {
    final pct = ((s['strengthPercentage'] ?? 0) as num).toDouble();
    final count = (s['employeeCount'] ?? 0).toInt();
    final color = pct >= 75 ? AppTheme.green : pct >= 50 ? AppTheme.blue : pct >= 25 ? AppTheme.amber : AppTheme.red;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(s['skill'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
          Text('${pct.toStringAsFixed(0)}%', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
          const SizedBox(width: 8),
          Text('$count emp', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
        ]),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: pct / 100,
            minHeight: 6,
            backgroundColor: const Color(0xFFF3F4F6),
            valueColor: AlwaysStoppedAnimation(color),
          ),
        ),
      ]),
    );
  }

  Widget _deptSection(Map<String, dynamic> dept) {
    final skills = (dept['skills'] as List? ?? []);
    if (skills.isEmpty) return const SizedBox.shrink();
    final sorted = [...skills]..sort((a, b) =>
        ((b['strengthPercentage'] ?? 0) as num).compareTo((a['strengthPercentage'] ?? 0) as num));
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(dept['department'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
          const SizedBox(height: 8),
          ...sorted.take(5).map((s) => _strengthRow(s)),
        ]),
      ),
    );
  }
}
