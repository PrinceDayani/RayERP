import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/user_management_service.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _svc = UserManagementService();
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();

  List<dynamic> _roles = [];
  List<dynamic> _projects = [];
  bool _loadingData = true;
  String? _loadError;
  String? _selectedRoleId;
  final Set<String> _selectedProjectIds = {};
  bool _obscurePass = true;
  bool _saving = false;

  @override
  void initState() { super.initState(); _loadData(); }
  @override
  void dispose() { _nameCtrl.dispose(); _emailCtrl.dispose(); _passCtrl.dispose(); super.dispose(); }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() { _loadingData = true; _loadError = null; });
    try {
      final data = await _svc.getOnboardingData();
      if (!mounted) return;
      setState(() {
        _roles = (data['roles'] as List? ?? []).where((r) => (r['name'] ?? '').toLowerCase() != 'root').toList();
        _projects = data['projects'] as List? ?? [];
        _loadingData = false;
      });
    } catch (e) {
      if (mounted) setState(() { _loadError = e.toString(); _loadingData = false; });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await _svc.onboardUser(
        name: _nameCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text.trim(),
        roleId: _selectedRoleId,
        projectIds: _selectedProjectIds.isEmpty ? null : _selectedProjectIds.toList(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User onboarded successfully')));
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e'), backgroundColor: AppTheme.red));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Onboard User'),
        actions: [
          if (_saving)
            const Padding(padding: EdgeInsets.all(16), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary)))
          else
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilledButton(
                style: FilledButton.styleFrom(backgroundColor: AppTheme.primary, minimumSize: const Size(90, 36)),
                onPressed: _loadingData ? null : _submit,
                child: const Text('Onboard'),
              ),
            ),
        ],
      ),
      body: _loadingData
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _loadError != null
              ? _errView(_loadError!, _loadData)
              : LayoutBuilder(builder: (ctx, constraints) {
                  final w = constraints.maxWidth;
                  final pad = w < 400 ? 12.0 : 16.0;
                  final maxW = w > 720 ? 680.0 : double.infinity;
                  final isWide = w >= 720;
                  return Align(
                    alignment: Alignment.topCenter,
                    child: ConstrainedBox(
                      constraints: BoxConstraints(maxWidth: maxW),
                      child: Form(
                        key: _formKey,
                        child: ListView(padding: EdgeInsets.all(pad), children: [
                          _sectionLabel('Account Details'),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
                            child: isWide
                                ? Column(children: [
                                    Row(children: [
                                      Expanded(child: _nameField()),
                                      const SizedBox(width: 12),
                                      Expanded(child: _emailField()),
                                    ]),
                                    const SizedBox(height: 14),
                                    _passField(),
                                  ])
                                : Column(children: [
                                    _nameField(),
                                    const SizedBox(height: 14),
                                    _emailField(),
                                    const SizedBox(height: 14),
                                    _passField(),
                                  ]),
                          ),
                          const SizedBox(height: 16),
                          _sectionLabel('Role Assignment'),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
                            child: Column(children: [
                              DropdownButtonFormField<String>(
                                value: _selectedRoleId,
                                isExpanded: true,
                                decoration: const InputDecoration(labelText: 'Role', prefixIcon: Icon(Icons.shield_outlined, size: 18)),
                                items: [
                                  const DropdownMenuItem<String>(value: null, child: Text('Default role', style: TextStyle(color: AppTheme.textMuted))),
                                  ..._roles.map((r) => DropdownMenuItem<String>(
                                    value: r['_id'],
                                    child: Row(children: [
                                      Expanded(child: Text(r['name'] ?? '', overflow: TextOverflow.ellipsis)),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                        decoration: BoxDecoration(color: AppTheme.blueBg, borderRadius: BorderRadius.circular(4)),
                                        child: Text('L${r['level'] ?? 0}', style: const TextStyle(fontSize: 10, color: AppTheme.blue)),
                                      ),
                                    ]),
                                  )),
                                ],
                                onChanged: (v) => setState(() => _selectedRoleId = v),
                              ),
                              if (_selectedRoleId != null) ...[
                                const SizedBox(height: 10),
                                Builder(builder: (_) {
                                  final role = _roles.firstWhere((r) => r['_id'] == _selectedRoleId, orElse: () => null);
                                  if (role == null) return const SizedBox.shrink();
                                  return Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(color: AppTheme.blueBg, borderRadius: BorderRadius.circular(8)),
                                    child: Row(children: [
                                      const Icon(Icons.info_outline, size: 14, color: AppTheme.blue),
                                      const SizedBox(width: 8),
                                      Text(role['description'] ?? 'Level ${role['level']}', style: const TextStyle(fontSize: 12, color: AppTheme.blue)),
                                    ]),
                                  );
                                }),
                              ],
                            ]),
                          ),
                          if (_projects.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            Row(children: [
                              _sectionLabel('Project Access'),
                              const Spacer(),
                              Text('${_selectedProjectIds.length} selected', style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w600)),
                            ]),
                            const SizedBox(height: 8),
                            Container(
                              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
                              child: isWide
                                  ? _projectGrid()
                                  : Column(children: _projectTiles()),
                            ),
                          ],
                          const SizedBox(height: 24),
                          SizedBox(
                            width: double.infinity, height: 48,
                            child: FilledButton(
                              style: FilledButton.styleFrom(backgroundColor: AppTheme.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                              onPressed: _saving ? null : _submit,
                              child: _saving
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                  : const Text('Onboard User', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                            ),
                          ),
                          const SizedBox(height: 40),
                        ]),
                      ),
                    ),
                  );
                }),
    );
  }

  Widget _nameField() => TextFormField(
        controller: _nameCtrl,
        textCapitalization: TextCapitalization.words,
        decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outline, size: 18)),
        validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null,
      );

  Widget _emailField() => TextFormField(
        controller: _emailCtrl,
        keyboardType: TextInputType.emailAddress,
        decoration: const InputDecoration(labelText: 'Email Address', prefixIcon: Icon(Icons.email_outlined, size: 18)),
        validator: (v) {
          if (v == null || v.trim().isEmpty) return 'Email is required';
          if (!RegExp(r'^[\w-.]+@([\w-]+\.)+[\w-]{2,}$').hasMatch(v.trim())) return 'Invalid email';
          return null;
        },
      );

  Widget _passField() => StatefulBuilder(
        builder: (ctx, setSt) => TextFormField(
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
      );

  List<Widget> _projectTiles() => _projects.map((p) {
        final id = p['_id'] ?? '';
        return CheckboxListTile(
          value: _selectedProjectIds.contains(id),
          activeColor: AppTheme.primary,
          dense: true,
          title: Text(p['name'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
          subtitle: (p['description'] ?? '').isNotEmpty
              ? Text(p['description'], style: const TextStyle(fontSize: 11, color: AppTheme.textMuted), maxLines: 1, overflow: TextOverflow.ellipsis)
              : null,
          onChanged: (v) => setState(() => v == true ? _selectedProjectIds.add(id) : _selectedProjectIds.remove(id)),
        );
      }).toList();

  Widget _projectGrid() => Padding(
        padding: const EdgeInsets.all(8),
        child: Wrap(spacing: 8, runSpacing: 4, children: _projects.map((p) {
          final id = p['_id'] ?? '';
          final sel = _selectedProjectIds.contains(id);
          return GestureDetector(
            onTap: () => setState(() => sel ? _selectedProjectIds.remove(id) : _selectedProjectIds.add(id)),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: sel ? AppTheme.primary.withOpacity(0.08) : AppTheme.bg,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: sel ? AppTheme.primary : AppTheme.border, width: sel ? 1.5 : 1),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(sel ? Icons.check_circle : Icons.circle_outlined, size: 14, color: sel ? AppTheme.primary : AppTheme.textMuted),
                const SizedBox(width: 6),
                Text(p['name'] ?? '', style: TextStyle(fontSize: 13, fontWeight: sel ? FontWeight.w600 : FontWeight.normal, color: sel ? AppTheme.primary : AppTheme.textPrimary)),
              ]),
            ),
          );
        }).toList()),
      );

  Widget _sectionLabel(String t) => Text(t, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary, letterSpacing: 0.3));
}
