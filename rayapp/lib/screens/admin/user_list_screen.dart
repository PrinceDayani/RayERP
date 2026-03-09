import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/role_permission.dart';
import '../../services/user_management_service.dart';
import 'user_form_screen.dart';

class UserListScreen extends StatefulWidget {
  const UserListScreen({super.key});
  @override
  State<UserListScreen> createState() => _UserListScreenState();
}

class _UserListScreenState extends State<UserListScreen> {
  final _svc = UserManagementService();
  List<ManagedUser> _all = [], _filtered = [];
  List<AppRole> _roles = [];
  bool _loading = true;
  String? _error;
  final _searchCtrl = TextEditingController();
  String _statusFilter = '';

  static const _statusOptions = ['active', 'inactive', 'disabled', 'pending_approval'];

  @override
  void initState() { super.initState(); _load(); }
  @override
  void dispose() { _searchCtrl.dispose(); super.dispose(); }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([_svc.getUsers(), _svc.getRoles()]);
      if (!mounted) return;
      _all = results[0] as List<ManagedUser>;
      _roles = results[1] as List<AppRole>;
      setState(() { _filtered = _applyFilter(_all); _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<ManagedUser> _applyFilter(List<ManagedUser> src) {
    final q = _searchCtrl.text.toLowerCase();
    return src.where((u) {
      final matchQ = q.isEmpty || u.name.toLowerCase().contains(q) || u.email.toLowerCase().contains(q) || u.roleName.toLowerCase().contains(q);
      return matchQ && (_statusFilter.isEmpty || u.status == _statusFilter);
    }).toList();
  }

  void _filter() => setState(() => _filtered = _applyFilter(_all));

  Future<void> _delete(ManagedUser u) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete User'),
        content: Text('Delete ${u.name}? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(style: FilledButton.styleFrom(backgroundColor: AppTheme.red), onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try { await _svc.deleteUser(u.id); _load(); }
    catch (e) { if (mounted) _showErr('$e'); }
  }

  Future<void> _changeStatus(ManagedUser u) async {
    String? selected = u.status;
    final reasonCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Change Status'),
          content: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
            ..._statusOptions.map((s) => RadioListTile<String>(
              value: s, groupValue: selected,
              title: Text(_fmtStatus(s), style: const TextStyle(fontSize: 14)),
              activeColor: AppTheme.primary,
              contentPadding: EdgeInsets.zero,
              onChanged: (v) => setSt(() => selected = v),
            )),
            const SizedBox(height: 8),
            TextField(controller: reasonCtrl, decoration: const InputDecoration(labelText: 'Reason (optional)', isDense: true)),
          ])),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            FilledButton(style: FilledButton.styleFrom(backgroundColor: AppTheme.primary), onPressed: () => Navigator.pop(ctx, true), child: const Text('Apply')),
          ],
        ),
      ),
    );
    if (ok != true || selected == null || !mounted) return;
    try {
      final res = await _svc.updateUserStatus(u.id, selected!, reason: reasonCtrl.text.trim());
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(res['requiresApproval'] == true ? 'Status change submitted for approval' : 'Status updated to ${_fmtStatus(selected!)}'),
      ));
      _load();
    } catch (e) { if (mounted) _showErr('$e'); }
    reasonCtrl.dispose();
  }

  Future<void> _assignRole(ManagedUser u) async {
    final assignable = _roles.where((r) => r.name.toLowerCase() != 'root').toList();
    String? selectedId = u.roleId.isNotEmpty ? u.roleId : null;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text('Assign Role — ${u.name}', style: const TextStyle(fontSize: 16)),
          content: SizedBox(
            width: double.maxFinite,
            child: ListView(shrinkWrap: true, children: assignable.map((r) => RadioListTile<String>(
              value: r.id, groupValue: selectedId,
              title: Text(r.name, style: const TextStyle(fontSize: 14)),
              subtitle: Text('Level ${r.level}', style: const TextStyle(fontSize: 11)),
              activeColor: AppTheme.primary,
              contentPadding: EdgeInsets.zero,
              onChanged: (v) => setSt(() => selectedId = v),
            )).toList()),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            FilledButton(style: FilledButton.styleFrom(backgroundColor: AppTheme.primary), onPressed: () => Navigator.pop(ctx, true), child: const Text('Assign')),
          ],
        ),
      ),
    );
    if (ok != true || selectedId == null || !mounted) return;
    try { await _svc.updateUserRole(u.id, selectedId!); _load(); }
    catch (e) { if (mounted) _showErr('$e'); }
  }

  Future<void> _resetPassword(ManagedUser u) async {
    final ctrl = TextEditingController();
    bool obscure = true;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text('Reset Password — ${u.name}', style: const TextStyle(fontSize: 16)),
          content: TextField(
            controller: ctrl, obscureText: obscure,
            decoration: InputDecoration(
              labelText: 'New Password', isDense: true,
              suffixIcon: IconButton(icon: Icon(obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 18), onPressed: () => setSt(() => obscure = !obscure)),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            FilledButton(style: FilledButton.styleFrom(backgroundColor: AppTheme.primary), onPressed: () => Navigator.pop(ctx, true), child: const Text('Reset')),
          ],
        ),
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await _svc.resetPassword(u.id, ctrl.text.trim());
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password reset successfully')));
    } catch (e) { if (mounted) _showErr('$e'); }
    ctrl.dispose();
  }

  void _showErr(String msg) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: AppTheme.red));
  String _fmtStatus(String s) => s.replaceAll('_', ' ').split(' ').map((w) => w.isEmpty ? '' : '${w[0].toUpperCase()}${w.substring(1)}').join(' ');
  Color _avatarColor(String name) {
    const c = [AppTheme.primary, AppTheme.blue, AppTheme.purple, AppTheme.cyan, AppTheme.teal, AppTheme.amber];
    return c[name.codeUnitAt(0) % c.length];
  }

  @override
  Widget build(BuildContext context) {
    final active = _all.where((u) => u.status == 'active').length;
    return Scaffold(
      backgroundColor: AppTheme.bg,
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppTheme.primary,
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute(builder: (_) => UserFormScreen(roles: _roles)));
          _load();
        },
        child: const Icon(Icons.person_add_outlined, color: Colors.white),
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
                    final isWide = w >= 700;
                    return CustomScrollView(slivers: [
                      SliverToBoxAdapter(child: Padding(
                        padding: EdgeInsets.fromLTRB(pad, pad, pad, 4),
                        child: Row(children: [
                          _statCard('Total', _all.length, AppTheme.primary),
                          const SizedBox(width: 8),
                          _statCard('Active', active, AppTheme.green),
                          const SizedBox(width: 8),
                          _statCard('Inactive', _all.length - active, AppTheme.amber),
                        ]),
                      )),
                      SliverToBoxAdapter(child: _filterBar(pad)),
                      _filtered.isEmpty
                          ? SliverFillRemaining(child: _emptyView())
                          : isWide
                              ? SliverPadding(
                                  padding: EdgeInsets.fromLTRB(pad, 4, pad, 100),
                                  sliver: SliverGrid(
                                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: w >= 1100 ? 3 : 2,
                                      crossAxisSpacing: 8,
                                      mainAxisSpacing: 8,
                                      childAspectRatio: w >= 1100 ? 2.8 : 2.4,
                                    ),
                                    delegate: SliverChildBuilderDelegate((_, i) => _userCard(_filtered[i], isWide: true), childCount: _filtered.length),
                                  ),
                                )
                              : SliverPadding(
                                  padding: EdgeInsets.fromLTRB(pad, 4, pad, 100),
                                  sliver: SliverList(delegate: SliverChildBuilderDelegate((_, i) => Padding(padding: const EdgeInsets.only(bottom: 8), child: _userCard(_filtered[i])), childCount: _filtered.length)),
                                ),
                    ]);
                  }),
                ),
    );
  }

  Widget _statCard(String label, int count, Color color) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
          child: Column(children: [
            FittedBox(fit: BoxFit.scaleDown, child: Text('$count', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color))),
            const SizedBox(height: 2),
            FittedBox(fit: BoxFit.scaleDown, child: Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w500))),
          ]),
        ),
      );

  Widget _filterBar(double pad) => Container(
        color: AppTheme.bg,
        padding: EdgeInsets.fromLTRB(pad, 8, pad, 8),
        child: Column(children: [
          TextField(
            controller: _searchCtrl,
            onChanged: (_) => _filter(),
            decoration: InputDecoration(
              hintText: 'Search name, email, role…',
              hintStyle: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
              prefixIcon: const Icon(Icons.search, size: 18, color: AppTheme.textMuted),
              suffixIcon: _searchCtrl.text.isNotEmpty
                  ? IconButton(icon: const Icon(Icons.clear, size: 16, color: AppTheme.textMuted), onPressed: () { _searchCtrl.clear(); _filter(); })
                  : null,
              filled: true, fillColor: Colors.white, contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 4),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 34,
            child: ListView(scrollDirection: Axis.horizontal, children: [
              _chip('All', ''), _chip('Active', 'active'), _chip('Inactive', 'inactive'),
              _chip('Disabled', 'disabled'), _chip('Pending', 'pending_approval'),
            ]),
          ),
        ]),
      );

  Widget _chip(String label, String value) {
    final sel = _statusFilter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: GestureDetector(
        onTap: () => setState(() { _statusFilter = sel ? '' : value; _filter(); }),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: sel ? AppTheme.primary : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: sel ? AppTheme.primary : AppTheme.border),
          ),
          child: Text(label, style: TextStyle(fontSize: 12, fontWeight: sel ? FontWeight.w600 : FontWeight.normal, color: sel ? Colors.white : AppTheme.textSecondary)),
        ),
      ),
    );
  }

  Widget _userCard(ManagedUser u, {bool isWide = false}) {
    final color = _avatarColor(u.name.isNotEmpty ? u.name : 'U');
    final initials = u.name.trim().split(' ').where((w) => w.isNotEmpty).take(2).map((w) => w[0].toUpperCase()).join();
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () async {
          await Navigator.push(context, MaterialPageRoute(builder: (_) => UserFormScreen(user: u, roles: _roles)));
          _load();
        },
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
            Container(width: 3, height: isWide ? 80 : 68, color: AppTheme.statusColor(u.status)),
            const SizedBox(width: 10),
            Container(
              width: isWide ? 44 : 40, height: isWide ? 44 : 40,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
              child: Center(child: Text(initials, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: isWide ? 15 : 13))),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                  Text(u.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 2),
                  Text(u.email, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 5),
                  Wrap(spacing: 4, runSpacing: 4, children: [
                    if (u.roleName.isNotEmpty)
                      _tag(u.roleName, AppTheme.blueBg, AppTheme.blue),
                    if ((u.department ?? '').isNotEmpty)
                      _tag(u.department!, AppTheme.bg, AppTheme.textMuted),
                  ]),
                ]),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 8, 6, 8),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: AppTheme.statusBg(u.status), borderRadius: BorderRadius.circular(20)),
                  child: Text(_fmtStatus(u.status), style: TextStyle(color: AppTheme.statusColor(u.status), fontSize: 10, fontWeight: FontWeight.w600)),
                ),
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert, size: 18, color: AppTheme.textSecondary),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  onSelected: (v) {
                    if (v == 'role') _assignRole(u);
                    if (v == 'status') _changeStatus(u);
                    if (v == 'reset') _resetPassword(u);
                    if (v == 'delete') _delete(u);
                  },
                  itemBuilder: (_) => [
                    _menuItem('role', Icons.manage_accounts_outlined, 'Assign Role'),
                    _menuItem('status', Icons.toggle_on_outlined, 'Change Status'),
                    _menuItem('reset', Icons.lock_reset_outlined, 'Reset Password'),
                    _menuItemDanger('delete', Icons.delete_outline, 'Delete'),
                  ],
                ),
              ]),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _tag(String label, Color bg, Color fg) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(4), border: Border.all(color: fg.withOpacity(0.15))),
        child: Text(label, style: TextStyle(fontSize: 10, color: fg, fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
      );

  PopupMenuItem<String> _menuItem(String v, IconData icon, String label) => PopupMenuItem(
        value: v,
        height: 44,
        child: Row(children: [Icon(icon, size: 16, color: AppTheme.textSecondary), const SizedBox(width: 10), Text(label, style: const TextStyle(fontSize: 13))]),
      );

  PopupMenuItem<String> _menuItemDanger(String v, IconData icon, String label) => PopupMenuItem(
        value: v,
        height: 44,
        child: Row(children: [Icon(icon, size: 16, color: AppTheme.red), const SizedBox(width: 10), Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.red))]),
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

  Widget _emptyView() => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.people_outline, size: 48, color: Colors.grey.shade300),
        const SizedBox(height: 10),
        const Text('No users found', style: TextStyle(color: AppTheme.textSecondary, fontSize: 15)),
        if (_searchCtrl.text.isNotEmpty || _statusFilter.isNotEmpty) ...[
          const SizedBox(height: 8),
          TextButton(onPressed: () { _searchCtrl.clear(); setState(() { _statusFilter = ''; _filter(); }); }, child: const Text('Clear filters')),
        ],
      ]));
}
