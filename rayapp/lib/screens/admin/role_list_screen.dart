import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/role_permission.dart';
import '../../services/user_management_service.dart';
import 'role_form_screen.dart';

class RoleListScreen extends StatefulWidget {
  const RoleListScreen({super.key});
  @override
  State<RoleListScreen> createState() => _RoleListScreenState();
}

class _RoleListScreenState extends State<RoleListScreen> {
  final _svc = UserManagementService();
  List<AppRole> _roles = [];
  List<AppPermission> _permissions = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([_svc.getRoles(), _svc.getPermissions()]);
      if (!mounted) return;
      setState(() { _roles = results[0] as List<AppRole>; _permissions = results[1] as List<AppPermission>; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _delete(AppRole r) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete Role'),
        content: Text('Delete "${r.name}"? Users with this role will be affected.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(style: FilledButton.styleFrom(backgroundColor: AppTheme.red), onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try { await _svc.deleteRole(r.id); _load(); }
    catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e'), backgroundColor: AppTheme.red)); }
  }

  Future<void> _toggle(AppRole r) async {
    try { await _svc.toggleRoleStatus(r.id); _load(); }
    catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e'), backgroundColor: AppTheme.red)); }
  }

  Color _levelColor(int level) {
    if (level >= 80) return AppTheme.red;
    if (level >= 60) return AppTheme.amber;
    if (level >= 40) return AppTheme.blue;
    return AppTheme.green;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.primary,
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute(builder: (_) => RoleFormScreen(permissions: _permissions)));
          _load();
        },
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('New Role', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? _errorView()
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppTheme.primary,
                  child: LayoutBuilder(builder: (ctx, constraints) {
                    final w = constraints.maxWidth;
                    final pad = w < 400 ? 12.0 : 16.0;
                    final isWide = w >= 600;
                    if (isWide) {
                      final cols = w >= 1100 ? 3 : 2;
                      return GridView.builder(
                        padding: EdgeInsets.fromLTRB(pad, pad, pad, 100),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: cols,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 10,
                          childAspectRatio: w >= 1100 ? 1.9 : 1.7,
                        ),
                        itemCount: _roles.length,
                        itemBuilder: (_, i) => _roleCard(_roles[i]),
                      );
                    }
                    return ListView.separated(
                      padding: EdgeInsets.fromLTRB(pad, pad, pad, 100),
                      itemCount: _roles.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 8),
                      itemBuilder: (_, i) => _roleCard(_roles[i]),
                    );
                  }),
                ),
    );
  }

  Widget _roleCard(AppRole r) {
    final isRoot = r.name.toLowerCase() == 'root';
    final lc = _levelColor(r.level);
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: isRoot ? null : () async {
          await Navigator.push(context, MaterialPageRoute(builder: (_) => RoleFormScreen(role: r, permissions: _permissions)));
          _load();
        },
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: r.isActive ? AppTheme.border : AppTheme.border.withOpacity(0.4)),
          ),
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: lc.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                child: Text('L${r.level}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: lc)),
              ),
              const SizedBox(width: 8),
              Expanded(child: Text(r.name, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: r.isActive ? AppTheme.textPrimary : AppTheme.textMuted), overflow: TextOverflow.ellipsis)),
              if (isRoot)
                _badge('SYSTEM', AppTheme.redBg, AppTheme.red)
              else ...[
                if (r.isDefault) _badge('DEFAULT', AppTheme.amberBg, AppTheme.amber),
                const SizedBox(width: 4),
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert, size: 18, color: AppTheme.textSecondary),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  onSelected: (v) { if (v == 'toggle') _toggle(r); if (v == 'delete') _delete(r); },
                  itemBuilder: (_) => [
                    PopupMenuItem(value: 'toggle', height: 44, child: Row(children: [
                      Icon(r.isActive ? Icons.toggle_off_outlined : Icons.toggle_on_outlined, size: 16, color: AppTheme.textSecondary),
                      const SizedBox(width: 10),
                      Text(r.isActive ? 'Deactivate' : 'Activate', style: const TextStyle(fontSize: 13)),
                    ])),
                    if (!r.isDefault)
                      const PopupMenuItem(value: 'delete', height: 44, child: Row(children: [
                        Icon(Icons.delete_outline, size: 16, color: AppTheme.red),
                        SizedBox(width: 10),
                        Text('Delete', style: TextStyle(fontSize: 13, color: AppTheme.red)),
                      ])),
                  ],
                ),
              ],
            ]),
            if (r.description.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(r.description, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary), maxLines: 2, overflow: TextOverflow.ellipsis),
            ],
            const SizedBox(height: 8),
            const Divider(height: 16),
            Row(children: [
              Icon(Icons.shield_outlined, size: 13, color: AppTheme.blue),
              const SizedBox(width: 4),
              Text('${r.permissions.length} permissions', style: const TextStyle(fontSize: 11, color: AppTheme.blue, fontWeight: FontWeight.w500)),
              const Spacer(),
              Container(
                width: 8, height: 8,
                decoration: BoxDecoration(color: r.isActive ? AppTheme.green : AppTheme.textMuted, shape: BoxShape.circle),
              ),
              const SizedBox(width: 4),
              Text(r.isActive ? 'Active' : 'Inactive', style: TextStyle(fontSize: 11, color: r.isActive ? AppTheme.green : AppTheme.textMuted, fontWeight: FontWeight.w500)),
            ]),
          ]),
        ),
      ),
    );
  }

  Widget _badge(String label, Color bg, Color fg) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
        child: Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: fg, letterSpacing: 0.3)),
      );

  Widget _errorView() => Center(child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.error_outline, color: AppTheme.red, size: 40),
          const SizedBox(height: 12),
          Text(_error!, style: const TextStyle(color: AppTheme.red), textAlign: TextAlign.center),
          const SizedBox(height: 12),
          FilledButton.icon(onPressed: _load, icon: const Icon(Icons.refresh, size: 16), label: const Text('Retry'), style: FilledButton.styleFrom(backgroundColor: AppTheme.primary)),
        ]),
      ));
}
