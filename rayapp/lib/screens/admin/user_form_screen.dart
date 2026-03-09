import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/role_permission.dart';
import '../../services/user_management_service.dart';

class UserFormScreen extends StatefulWidget {
  final ManagedUser? user;
  final List<AppRole> roles;
  const UserFormScreen({super.key, this.user, required this.roles});
  @override
  State<UserFormScreen> createState() => _UserFormScreenState();
}

class _UserFormScreenState extends State<UserFormScreen> {
  final _svc = UserManagementService();
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  String? _selectedRoleId;
  bool _saving = false;
  bool _obscurePass = true;

  bool get _isEdit => widget.user != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      _nameCtrl.text = widget.user!.name;
      _emailCtrl.text = widget.user!.email;
      _selectedRoleId = widget.user!.roleId.isNotEmpty ? widget.user!.roleId : null;
    }
  }

  @override
  void dispose() { _nameCtrl.dispose(); _emailCtrl.dispose(); _passCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      if (_isEdit) {
        await _svc.updateUser(widget.user!.id, name: _nameCtrl.text.trim(), email: _emailCtrl.text.trim(), roleId: _selectedRoleId);
      } else {
        await _svc.createUser(name: _nameCtrl.text.trim(), email: _emailCtrl.text.trim(), password: _passCtrl.text.trim(), roleId: _selectedRoleId);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e'), backgroundColor: AppTheme.red));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final assignable = widget.roles.where((r) => r.name.toLowerCase() != 'root').toList();
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Text(_isEdit ? 'Edit User' : 'Create User'),
        actions: [
          if (_saving)
            const Padding(padding: EdgeInsets.all(16), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary)))
          else
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilledButton(
                style: FilledButton.styleFrom(backgroundColor: AppTheme.primary, minimumSize: const Size(80, 36)),
                onPressed: _save,
                child: Text(_isEdit ? 'Save' : 'Create'),
              ),
            ),
        ],
      ),
      body: LayoutBuilder(builder: (ctx, constraints) {
        final w = constraints.maxWidth;
        final pad = w < 400 ? 12.0 : 16.0;
        final maxW = w > 640 ? 600.0 : double.infinity;
        return Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxW),
            child: Form(
              key: _formKey,
              child: ListView(padding: EdgeInsets.all(pad), children: [
                _section('User Information', [
                  _field(_nameCtrl, 'Full Name', Icons.person_outline,
                    textCapitalization: TextCapitalization.words,
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null),
                  const SizedBox(height: 14),
                  _field(_emailCtrl, 'Email Address', Icons.email_outlined,
                    keyboardType: TextInputType.emailAddress,
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Email is required';
                      if (!RegExp(r'^[\w-.]+@([\w-]+\.)+[\w-]{2,}$').hasMatch(v.trim())) return 'Invalid email';
                      return null;
                    }),
                  if (!_isEdit) ...[
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _passCtrl,
                      obscureText: _obscurePass,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        prefixIcon: const Icon(Icons.lock_outline, size: 18),
                        suffixIcon: IconButton(
                          icon: Icon(_obscurePass ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 18),
                          onPressed: () => setState(() => _obscurePass = !_obscurePass),
                        ),
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Password is required';
                        if (v.trim().length < 6) return 'Minimum 6 characters';
                        return null;
                      },
                    ),
                  ],
                ]),
                const SizedBox(height: 16),
                _section('Role Assignment', [
                  DropdownButtonFormField<String>(
                    value: _selectedRoleId,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'Role', prefixIcon: Icon(Icons.manage_accounts_outlined, size: 18)),
                    items: [
                      const DropdownMenuItem<String>(value: null, child: Text('Select role…', style: TextStyle(color: AppTheme.textMuted))),
                      ...assignable.map((r) => DropdownMenuItem(
                        value: r.id,
                        child: Row(children: [
                          Expanded(child: Text(r.name, overflow: TextOverflow.ellipsis)),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                            decoration: BoxDecoration(color: AppTheme.blueBg, borderRadius: BorderRadius.circular(4)),
                            child: Text('L${r.level}', style: const TextStyle(fontSize: 10, color: AppTheme.blue)),
                          ),
                        ]),
                      )),
                    ],
                    onChanged: (v) => setState(() => _selectedRoleId = v),
                  ),
                  if (_selectedRoleId != null) ...[
                    const SizedBox(height: 10),
                    Builder(builder: (_) {
                      final role = assignable.firstWhere((r) => r.id == _selectedRoleId, orElse: () => assignable.first);
                      return Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: AppTheme.blueBg, borderRadius: BorderRadius.circular(8)),
                        child: Row(children: [
                          const Icon(Icons.info_outline, size: 14, color: AppTheme.blue),
                          const SizedBox(width: 8),
                          Expanded(child: Text('${role.permissions.length} permissions · Level ${role.level}', style: const TextStyle(fontSize: 12, color: AppTheme.blue))),
                        ]),
                      );
                    }),
                  ],
                ]),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: AppTheme.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                    onPressed: _saving ? null : _save,
                    child: _saving
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(_isEdit ? 'Save Changes' : 'Create User', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                  ),
                ),
              ]),
            ),
          ),
        );
      }),
    );
  }

  Widget _section(String title, List<Widget> children) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary, letterSpacing: 0.3)),
    const SizedBox(height: 8),
    Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
    ),
  ]);

  Widget _field(TextEditingController ctrl, String label, IconData icon, {
    TextInputType? keyboardType,
    TextCapitalization textCapitalization = TextCapitalization.none,
    String? Function(String?)? validator,
  }) => TextFormField(
    controller: ctrl,
    keyboardType: keyboardType,
    textCapitalization: textCapitalization,
    decoration: InputDecoration(labelText: label, prefixIcon: Icon(icon, size: 18)),
    validator: validator,
  );
}
