import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../services/user_management_service.dart';
import '../../services/auth_provider.dart';
import 'active_sessions_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _svc = UserManagementService();
  Map<String, dynamic>? _profile;
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _svc.getCompleteProfile();
      if (!mounted) return;
      setState(() { _profile = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _editProfile() async {
    final user = _profile?['user'];
    final employee = _profile?['employee'];
    final nameCtrl = TextEditingController(text: user?['name'] ?? '');
    final phoneCtrl = TextEditingController(text: employee?['phone'] ?? '');
    final bioCtrl = TextEditingController(text: employee?['bio'] ?? '');
    bool saving = false;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => Padding(
          padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Text('Edit Profile', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              const Spacer(),
              IconButton(icon: const Icon(Icons.close, size: 20), onPressed: () => Navigator.pop(ctx)),
            ]),
            const SizedBox(height: 16),
            TextField(controller: nameCtrl, textCapitalization: TextCapitalization.words, decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outline, size: 18))),
            const SizedBox(height: 12),
            TextField(controller: phoneCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone', prefixIcon: Icon(Icons.phone_outlined, size: 18))),
            const SizedBox(height: 12),
            TextField(controller: bioCtrl, maxLines: 3, maxLength: 500, decoration: const InputDecoration(labelText: 'Bio', prefixIcon: Icon(Icons.info_outline, size: 18), alignLabelWithHint: true)),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity, height: 48,
              child: FilledButton(
                style: FilledButton.styleFrom(backgroundColor: AppTheme.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                onPressed: saving ? null : () async {
                  setSt(() => saving = true);
                  try {
                    await _svc.updateProfile(
                      name: nameCtrl.text.trim().isNotEmpty ? nameCtrl.text.trim() : null,
                      phone: phoneCtrl.text.trim().isNotEmpty ? phoneCtrl.text.trim() : null,
                      bio: bioCtrl.text.trim(),
                    );
                    if (ctx.mounted) Navigator.pop(ctx);
                    _load();
                  } catch (e) {
                    setSt(() => saving = false);
                    if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('$e'), backgroundColor: AppTheme.red));
                  }
                },
                child: saving
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Save Changes', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              ),
            ),
          ]),
        ),
      ),
    );
    nameCtrl.dispose(); phoneCtrl.dispose(); bioCtrl.dispose();
  }

  Future<void> _changePassword() async {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();
    bool saving = false;
    bool obscureCurrent = true, obscureNew = true, obscureConfirm = true;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => Padding(
          padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Text('Change Password', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              const Spacer(),
              IconButton(icon: const Icon(Icons.close, size: 20), onPressed: () => Navigator.pop(ctx)),
            ]),
            const SizedBox(height: 16),
            TextField(
              controller: currentCtrl, obscureText: obscureCurrent,
              decoration: InputDecoration(
                labelText: 'Current Password', prefixIcon: const Icon(Icons.lock_outline, size: 18),
                suffixIcon: IconButton(icon: Icon(obscureCurrent ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 18), onPressed: () => setSt(() => obscureCurrent = !obscureCurrent)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: newCtrl, obscureText: obscureNew,
              decoration: InputDecoration(
                labelText: 'New Password', prefixIcon: const Icon(Icons.lock_outline, size: 18),
                suffixIcon: IconButton(icon: Icon(obscureNew ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 18), onPressed: () => setSt(() => obscureNew = !obscureNew)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: confirmCtrl, obscureText: obscureConfirm,
              decoration: InputDecoration(
                labelText: 'Confirm New Password', prefixIcon: const Icon(Icons.lock_outline, size: 18),
                suffixIcon: IconButton(icon: Icon(obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 18), onPressed: () => setSt(() => obscureConfirm = !obscureConfirm)),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity, height: 48,
              child: FilledButton(
                style: FilledButton.styleFrom(backgroundColor: AppTheme.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                onPressed: saving ? null : () async {
                  if (newCtrl.text.trim().length < 6) { ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Password must be at least 6 characters'))); return; }
                  if (newCtrl.text != confirmCtrl.text) { ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Passwords do not match'))); return; }
                  setSt(() => saving = true);
                  try {
                    await _svc.changePassword(currentPassword: currentCtrl.text, newPassword: newCtrl.text);
                    if (ctx.mounted) { Navigator.pop(ctx); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password changed successfully'))); }
                  } catch (e) {
                    setSt(() => saving = false);
                    if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('$e'), backgroundColor: AppTheme.red));
                  }
                },
                child: saving
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Change Password', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              ),
            ),
          ]),
        ),
      ),
    );
    currentCtrl.dispose(); newCtrl.dispose(); confirmCtrl.dispose();
  }

  Future<void> _showLoginHistory() async {
    List<dynamic> history = [];
    bool loading = true;
    String? err;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) {
          if (loading) {
            _svc.getLoginHistory().then((d) { if (ctx.mounted) setSt(() { history = d; loading = false; }); }).catchError((e) { if (ctx.mounted) setSt(() { err = e.toString(); loading = false; }); });
          }
          return SizedBox(
            height: MediaQuery.of(ctx).size.height * 0.65,
            child: Column(children: [
              const SizedBox(height: 12),
              Container(width: 36, height: 4, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(2))),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Row(children: [
                  const Text('Login History', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                  const Spacer(),
                  IconButton(icon: const Icon(Icons.close, size: 20), onPressed: () => Navigator.pop(ctx)),
                ]),
              ),
              const Divider(height: 1),
              Expanded(
                child: loading
                    ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                    : err != null
                        ? Center(child: Text(err!, style: const TextStyle(color: AppTheme.red)))
                        : history.isEmpty
                            ? const Center(child: Text('No login history', style: TextStyle(color: AppTheme.textSecondary)))
                            : ListView.separated(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                itemCount: history.length,
                                separatorBuilder: (_, _) => const Divider(height: 1),
                                itemBuilder: (_, i) {
                                  final h = history[i];
                                  final ts = h['timestamp'] != null ? DateTime.tryParse(h['timestamp']) : null;
                                  final timeStr = ts != null
                                      ? '${ts.day.toString().padLeft(2,'0')}/${ts.month.toString().padLeft(2,'0')}/${ts.year}  ${ts.hour.toString().padLeft(2,'0')}:${ts.minute.toString().padLeft(2,'0')}'
                                      : '';
                                  final success = h['success'] ?? true;
                                  return ListTile(
                                    dense: true,
                                    leading: Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: BoxDecoration(color: (success ? AppTheme.greenBg : AppTheme.redBg), borderRadius: BorderRadius.circular(8)),
                                      child: Icon(success ? Icons.login_outlined : Icons.login_outlined, size: 16, color: success ? AppTheme.green : AppTheme.red),
                                    ),
                                    title: Text(h['ipAddress'] ?? 'Unknown IP', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                                    subtitle: Text(h['location'] ?? h['userAgent'] ?? '', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted), maxLines: 1, overflow: TextOverflow.ellipsis),
                                    trailing: Text(timeStr, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                                  );
                                },
                              ),
              ),
            ]),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.error_outline, color: AppTheme.red, size: 40),
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: AppTheme.red), textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  FilledButton.icon(onPressed: _load, icon: const Icon(Icons.refresh, size: 16), label: const Text('Retry'), style: FilledButton.styleFrom(backgroundColor: AppTheme.primary)),
                ]))
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppTheme.primary,
                  child: LayoutBuilder(builder: (ctx, constraints) {
                    final w = constraints.maxWidth;
                    final pad = w < 400 ? 12.0 : 16.0;
                    final isWide = w >= 720;
                    final maxW = w > 900 ? 860.0 : double.infinity;
                    return Align(
                      alignment: Alignment.topCenter,
                      child: ConstrainedBox(
                        constraints: BoxConstraints(maxWidth: maxW),
                        child: ListView(padding: EdgeInsets.all(pad), children: [
                          _avatarCard(auth),
                          const SizedBox(height: 16),
                          if (isWide)
                            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Expanded(child: _infoCard()),
                              const SizedBox(width: 16),
                              Expanded(child: _actionsCard()),
                            ])
                          else ...[
                            _infoCard(),
                            const SizedBox(height: 16),
                            _actionsCard(),
                          ],
                          const SizedBox(height: 32),
                        ]),
                      ),
                    );
                  }),
                ),
    );
  }

  Widget _avatarCard(AuthProvider auth) {
    final name = _profile?['user']?['name'] ?? auth.user?.name ?? '';
    final email = _profile?['user']?['email'] ?? auth.user?.email ?? '';
    final role = (_profile?['user']?['role'] is Map ? _profile!['user']['role']['name'] : null) ?? auth.user?.role ?? '';
    final status = _profile?['user']?['status'] ?? 'active';
    final initials = name.trim().split(' ').where((String w) => w.isNotEmpty).take(2).map((String w) => w[0].toUpperCase()).join();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [AppTheme.primary, AppTheme.primaryHover]),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(children: [
        Stack(children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(32)),
            child: Center(child: Text(initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 24))),
          ),
          Positioned(bottom: 0, right: 0, child: Container(
            width: 16, height: 16,
            decoration: BoxDecoration(color: AppTheme.statusColor(status), shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
          )),
        ]),
        const SizedBox(width: 16),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18), maxLines: 1, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 2),
          Text(email, style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(20)),
            child: Text(role, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500)),
          ),
        ])),
        IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
            child: const Icon(Icons.edit_outlined, color: Colors.white, size: 18),
          ),
          onPressed: _editProfile,
          tooltip: 'Edit Profile',
        ),
      ]),
    );
  }

  Widget _infoCard() {
    final employee = _profile?['employee'];
    if (employee == null) return const SizedBox.shrink();
    final rows = <_InfoRow>[
      if ((employee['phone'] ?? '').isNotEmpty) _InfoRow(Icons.phone_outlined, 'Phone', employee['phone']),
      if (employee['department'] != null && (employee['department'] is Map ? employee['department']['name'] : employee['department'] ?? '').isNotEmpty)
        _InfoRow(Icons.business_outlined, 'Department', employee['department'] is Map ? employee['department']['name'] : employee['department']),
      if ((employee['position'] ?? '').isNotEmpty) _InfoRow(Icons.work_outline, 'Position', employee['position']),
      if ((employee['employeeId'] ?? '').isNotEmpty) _InfoRow(Icons.badge_outlined, 'Employee ID', employee['employeeId']),
      if ((employee['bio'] ?? '').isNotEmpty) _InfoRow(Icons.info_outline, 'Bio', employee['bio']),
    ];
    if (rows.isEmpty) return const SizedBox.shrink();
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
          child: Row(children: [
            const Text('Profile Info', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
            const Spacer(),
            GestureDetector(
              onTap: _editProfile,
              child: const Text('Edit', style: TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w600)),
            ),
          ]),
        ),
        const Divider(height: 1),
        ...rows.map((r) => ListTile(
          dense: true,
          leading: Icon(r.icon, size: 18, color: AppTheme.textSecondary),
          title: Text(r.label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
          subtitle: Text(r.value, style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary)),
        )),
      ]),
    );
  }

  Widget _actionsCard() => Container(
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            child: Row(children: [const Text('Security', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700))]),
          ),
          const Divider(height: 1),
          _actionTile(Icons.lock_outline, 'Change Password', 'Update your account password', _changePassword),
          const Divider(height: 1),
          _actionTile(Icons.devices_outlined, 'Active Sessions', 'Manage your active sessions', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ActiveSessionsScreen()))),
          const Divider(height: 1),
          _actionTile(Icons.history_outlined, 'Login History', 'View recent login activity', _showLoginHistory),
        ]),
      );

  Widget _actionTile(IconData icon, String label, String subtitle, VoidCallback onTap) => ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, size: 18, color: AppTheme.primary),
        ),
        title: Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
        trailing: const Icon(Icons.chevron_right, size: 18, color: AppTheme.textMuted),
        onTap: onTap,
      );
}

class _InfoRow {
  final IconData icon;
  final String label;
  final String value;
  _InfoRow(this.icon, this.label, this.value);
}
