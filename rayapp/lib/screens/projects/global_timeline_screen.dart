import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/project.dart';
import '../../services/project_service.dart';

class GlobalTimelineScreen extends StatefulWidget {
  const GlobalTimelineScreen({super.key});
  @override
  State<GlobalTimelineScreen> createState() => _GlobalTimelineScreenState();
}

class _GlobalTimelineScreenState extends State<GlobalTimelineScreen> {
  List<Project> _all = [];
  bool _loading = true;
  String _search = '';
  String _status = 'all';

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try { _all = await ProjectService().getAll(); } catch (_) {}
    setState(() => _loading = false);
  }

  List<Project> get _filtered => _all.where((p) {
    final q = _search.toLowerCase();
    return (_status == 'all' || p.status == _status) &&
        (q.isEmpty || p.name.toLowerCase().contains(q));
  }).toList()..sort((a, b) => a.startDate.compareTo(b.startDate));

  void _exportCsv() {
    final lines = ['Project,Status,Priority,Start,End,Progress'];
    for (final p in _filtered) {
      lines.add('"${p.name}","${p.status}","${p.priority}","${AppTheme.fmtDate(p.startDate)}","${AppTheme.fmtDate(p.endDate)}","${p.progress}%"');
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('CSV ready (${lines.length - 1} rows) — integrate with file_saver to save')));
  }

  Color _sc(String s) => switch (s) {
    'active' => AppTheme.green, 'planning' => AppTheme.blue,
    'on-hold' => AppTheme.amber, 'completed' => AppTheme.cyan, _ => AppTheme.red,
  };

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    final pad = AppTheme.hPad(context);
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Timeline Overview'),
        actions: [
          IconButton(icon: const Icon(Icons.download_outlined), tooltip: 'Export CSV', onPressed: _exportCsv),
          IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : Column(children: [
              Padding(
                padding: EdgeInsets.fromLTRB(pad, 10, pad, 0),
                child: TextField(
                  onChanged: (v) => setState(() => _search = v),
                  decoration: InputDecoration(
                    hintText: 'Search projects…',
                    prefixIcon: const Icon(Icons.search, size: 18),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
                    filled: true, fillColor: Colors.white,
                  ),
                ),
              ),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: EdgeInsets.fromLTRB(pad, 8, pad, 4),
                child: Row(children: ['all', 'active', 'planning', 'on-hold', 'completed'].map((s) {
                  final sel = _status == s;
                  return GestureDetector(
                    onTap: () => setState(() => _status = s),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: sel ? AppTheme.primary : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: sel ? AppTheme.primary : AppTheme.border),
                      ),
                      child: Text(s == 'all' ? 'All' : s,
                          style: TextStyle(fontSize: 12, color: sel ? Colors.white : AppTheme.textSecondary)),
                    ),
                  );
                }).toList()),
              ),
              Padding(
                padding: EdgeInsets.fromLTRB(pad, 0, pad, 8),
                child: Row(children: [
                  _StatChip('Showing', '${filtered.length}', AppTheme.primary),
                  const SizedBox(width: 8),
                  _StatChip('Active', '${filtered.where((p) => p.status == 'active').length}', AppTheme.green),
                  const SizedBox(width: 8),
                  _StatChip('At Risk', '${filtered.where((p) {
                    final now = DateTime.now();
                    final totalDays = p.endDate.difference(p.startDate).inDays.clamp(1, 99999);
                    final elapsed = now.difference(p.startDate).inDays.clamp(0, totalDays);
                    final tp = elapsed / totalDays;
                    return tp > 0 && (p.progress / 100) / tp < 0.8 && p.status != 'completed';
                  }).length}', AppTheme.red),
                ]),
              ),
              Expanded(child: filtered.isEmpty
                  ? Center(child: Text('No projects', style: TextStyle(color: AppTheme.textSecondary)))
                  : _GlobalGantt(projects: filtered, statusColor: _sc)),
            ]),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label, value; final Color color;
  const _StatChip(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(20)),
    child: Text('$label: $value', style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
  );
}

class _GlobalGantt extends StatelessWidget {
  final List<Project> projects;
  final Color Function(String) statusColor;
  const _GlobalGantt({required this.projects, required this.statusColor});

  @override
  Widget build(BuildContext context) {
    if (projects.isEmpty || projects.every((p) => p.startDate == p.endDate)) {
      return const Center(child: Text('No timeline data'));
    }
    final labelW = AppTheme.isWide(context) ? 180.0 : 130.0;
    // Compute global date range
    final allStarts = projects.map((p) => p.startDate);
    final allEnds = projects.map((p) => p.endDate);
    final globalStart = allStarts.reduce((a, b) => a.isBefore(b) ? a : b);
    final globalEnd = allEnds.reduce((a, b) => a.isAfter(b) ? a : b);
    final totalDays = globalEnd.difference(globalStart).inDays.clamp(1, 99999).toDouble();
    final now = DateTime.now();
    final todayOffset = now.difference(globalStart).inDays.clamp(0, totalDays.toInt()).toDouble();
    final pad = AppTheme.hPad(context);

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(pad, 0, pad, 16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          SizedBox(width: labelW),
          Expanded(child: LayoutBuilder(builder: (_, c) {
            final w = c.maxWidth;
            return Stack(children: [
              Container(height: 20),
              Positioned(left: 0, child: Text(AppTheme.fmtDate(globalStart), style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary))),
              Positioned(right: 0, child: Text(AppTheme.fmtDate(globalEnd), style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary))),
              if (todayOffset >= 0 && todayOffset <= totalDays)
                Positioned(
                  left: (todayOffset / totalDays * w).clamp(0, w - 30),
                  child: const Text('Today', style: TextStyle(fontSize: 9, color: AppTheme.red, fontWeight: FontWeight.w600)),
                ),
            ]);
          })),
        ]),
        const SizedBox(height: 4),
        ...projects.map((p) {
          final barStart = p.startDate.difference(globalStart).inDays.clamp(0, totalDays.toInt()).toDouble();
          final barEnd = p.endDate.difference(globalStart).inDays.clamp(0, totalDays.toInt()).toDouble();
          final color = statusColor(p.status);
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(children: [
              SizedBox(width: labelW, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500)),
                Text('${p.progress}%', style: const TextStyle(fontSize: 9, color: AppTheme.textSecondary)),
              ])),
              Expanded(child: LayoutBuilder(builder: (_, c) {
                final w = c.maxWidth;
                final left = barStart / totalDays * w;
                final barW = ((barEnd - barStart) / totalDays * w).clamp(8.0, w - left);
                final todayX = todayOffset / totalDays * w;
                return SizedBox(height: 30, child: Stack(children: [
                  Positioned.fill(child: Container(
                      decoration: BoxDecoration(color: AppTheme.border.withOpacity(0.3), borderRadius: BorderRadius.circular(4)))),
                  Positioned(left: left, width: barW, top: 3, bottom: 3,
                    child: Stack(children: [
                      Container(decoration: BoxDecoration(color: color.withOpacity(0.25), borderRadius: BorderRadius.circular(4))),
                      FractionallySizedBox(
                        widthFactor: p.progress / 100,
                        child: Container(decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4))),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Align(alignment: Alignment.centerLeft,
                            child: Text(p.status, style: const TextStyle(fontSize: 8, color: Colors.white, fontWeight: FontWeight.w600),
                                overflow: TextOverflow.clip, maxLines: 1)),
                      ),
                    ]),
                  ),
                  if (todayOffset >= 0 && todayOffset <= totalDays)
                    Positioned(left: todayX, top: 0, bottom: 0,
                        child: Container(width: 1.5, color: AppTheme.red)),
                ]));
              })),
            ]),
          );
        }),
        const SizedBox(height: 8),
        Wrap(spacing: 12, runSpacing: 6, children: [
          _Legend('Active', AppTheme.green),
          _Legend('Planning', AppTheme.blue),
          _Legend('On Hold', AppTheme.amber),
          _Legend('Completed', AppTheme.cyan),
          Row(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 2, height: 12, color: AppTheme.red),
            const SizedBox(width: 4),
            const Text('Today', style: TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
          ]),
        ]),
      ]),
    );
  }
}

class _Legend extends StatelessWidget {
  final String label; final Color color;
  const _Legend(this.label, this.color);
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
    Container(width: 12, height: 8, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
    const SizedBox(width: 4),
    Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
  ]);
}
