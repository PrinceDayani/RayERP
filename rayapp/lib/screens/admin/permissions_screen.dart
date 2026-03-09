import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/role_permission.dart';
import '../../services/user_management_service.dart';

class PermissionsScreen extends StatefulWidget {
  const PermissionsScreen({super.key});
  @override
  State<PermissionsScreen> createState() => _PermissionsScreenState();
}

class _PermissionsScreenState extends State<PermissionsScreen> {
  final _svc = UserManagementService();
  List<AppPermission> _all = [];
  bool _loading = true;
  String? _error;
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void initState() { super.initState(); _load(); }
  @override
  void dispose() { _searchCtrl.dispose(); super.dispose(); }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _svc.getPermissions();
      if (!mounted) return;
      setState(() { _all = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Map<String, List<AppPermission>> get _grouped {
    final filtered = _query.isEmpty ? _all : _all.where((p) =>
        p.name.toLowerCase().contains(_query) ||
        p.description.toLowerCase().contains(_query) ||
        p.category.toLowerCase().contains(_query)).toList();
    final map = <String, List<AppPermission>>{};
    for (final p in filtered) { map.putIfAbsent(p.category, () => []).add(p); }
    return Map.fromEntries(map.entries.toList()..sort((a, b) => a.key.compareTo(b.key)));
  }

  @override
  Widget build(BuildContext context) {
    final grouped = _grouped;
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? _errView(_error!, _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppTheme.primary,
                  child: LayoutBuilder(builder: (ctx, constraints) {
                    final w = constraints.maxWidth;
                    final pad = w < 400 ? 12.0 : 16.0;
                    final isWide = w >= 700;
                    final entries = grouped.entries.toList();
                    return CustomScrollView(slivers: [
                      SliverToBoxAdapter(child: Padding(
                        padding: EdgeInsets.fromLTRB(pad, pad, pad, 8),
                        child: Column(children: [
                          Wrap(spacing: 8, runSpacing: 8, children: [
                            _statChip('${_all.length} Total', AppTheme.primary),
                            _statChip('${_all.where((p) => p.isActive).length} Active', AppTheme.green),
                            _statChip('${grouped.length} Categories', AppTheme.blue),
                          ]),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _searchCtrl,
                            onChanged: (v) => setState(() => _query = v.toLowerCase()),
                            decoration: InputDecoration(
                              hintText: 'Search permissions…',
                              hintStyle: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                              prefixIcon: const Icon(Icons.search, size: 18, color: AppTheme.textMuted),
                              suffixIcon: _query.isNotEmpty
                                  ? IconButton(icon: const Icon(Icons.clear, size: 16, color: AppTheme.textMuted), onPressed: () => setState(() { _searchCtrl.clear(); _query = ''; }))
                                  : null,
                              filled: true, fillColor: Colors.white,
                              contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 4),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
                              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
                            ),
                          ),
                        ]),
                      )),
                      grouped.isEmpty
                          ? SliverFillRemaining(child: _emptyView(Icons.search_off_outlined, 'No permissions found'))
                          : isWide
                              ? SliverPadding(
                                  padding: EdgeInsets.fromLTRB(pad, 0, pad, 32),
                                  sliver: SliverList(
                                    delegate: SliverChildBuilderDelegate((_, i) {
                                      final left = entries[i * 2];
                                      final hasRight = i * 2 + 1 < entries.length;
                                      return Padding(
                                        padding: const EdgeInsets.only(bottom: 8),
                                        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                          Expanded(child: _categoryCard(left.key, left.value)),
                                          const SizedBox(width: 8),
                                          hasRight
                                              ? Expanded(child: _categoryCard(entries[i * 2 + 1].key, entries[i * 2 + 1].value))
                                              : const Expanded(child: SizedBox()),
                                        ]),
                                      );
                                    }, childCount: (entries.length / 2).ceil()),
                                  ),
                                )
                              : SliverPadding(
                                  padding: EdgeInsets.fromLTRB(pad, 0, pad, 32),
                                  sliver: SliverList(
                                    delegate: SliverChildBuilderDelegate((_, i) => Padding(
                                      padding: const EdgeInsets.only(bottom: 8),
                                      child: _categoryCard(entries[i].key, entries[i].value),
                                    ), childCount: entries.length),
                                  ),
                                ),
                    ]);
                  }),
                ),
    );
  }

  Widget _statChip(String label, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(8), border: Border.all(color: color.withOpacity(0.2))),
        child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
      );

  Widget _categoryCard(String category, List<AppPermission> perms) => Container(
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
        child: Theme(
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
          child: ExpansionTile(
            tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
            title: Text(category, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
            subtitle: Text('${perms.length} permission${perms.length == 1 ? '' : 's'}', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: AppTheme.blueBg, borderRadius: BorderRadius.circular(6)),
              child: Text('${perms.length}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.blue)),
            ),
            children: perms.map((p) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(
                  margin: const EdgeInsets.only(top: 3),
                  width: 7, height: 7,
                  decoration: BoxDecoration(color: p.isActive ? AppTheme.green : AppTheme.textMuted, shape: BoxShape.circle),
                ),
                const SizedBox(width: 10),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(p.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textPrimary, fontFamily: 'monospace')),
                  if (p.description.isNotEmpty)
                    Text(p.description, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                ])),
                if (!p.isActive)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: AppTheme.redBg, borderRadius: BorderRadius.circular(4)),
                    child: const Text('Inactive', style: TextStyle(fontSize: 9, color: AppTheme.red, fontWeight: FontWeight.w600)),
                  ),
              ]),
            )).toList(),
          ),
        ),
      );
}
