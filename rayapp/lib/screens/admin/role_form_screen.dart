import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/role_permission.dart';
import '../../services/user_management_service.dart';

class RoleFormScreen extends StatefulWidget {
  final AppRole? role;
  final List<AppPermission> permissions;
  const RoleFormScreen({super.key, this.role, required this.permissions});
  @override
  State<RoleFormScreen> createState() => _RoleFormScreenState();
}

class _RoleFormScreenState extends State<RoleFormScreen> {
  final _svc = UserManagementService();
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  int _level = 50;
  Set<String> _selected = {};
  bool _saving = false;

  bool get _isEdit => widget.role != null;
  bool get _isDefault => widget.role?.isDefault ?? false;

  Map<String, List<AppPermission>> get _grouped {
    final map = <String, List<AppPermission>>{};
    for (final p in widget.permissions.where((p) => p.isActive)) {
      map.putIfAbsent(p.category, () => []).add(p);
    }
    return Map.fromEntries(map.entries.toList()..sort((a, b) => a.key.compareTo(b.key)));
  }

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      _nameCtrl.text = widget.role!.name;
      _descCtrl.text = widget.role!.description;
      _level = widget.role!.level;
      _selected = Set.from(widget.role!.permissions);
    }
  }

  @override
  void dispose() { _nameCtrl.dispose(); _descCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      if (_isEdit) {
        await _svc.updateRole(widget.role!.id,
          name: _isDefault ? null : _nameCtrl.text.trim(),
          description: _descCtrl.text.trim(),
          level: _isDefault ? null : _level,
          permissions: _selected.toList(),
        );
      } else {
        await _svc.createRole(
          name: _nameCtrl.text.trim(),
          description: _descCtrl.text.trim(),
          level: _level,
          permissions: _selected.toList(),
        );
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e'), backgroundColor: AppTheme.red));
      }
    }
  }

  void _toggleCategory(List<AppPermission> perms) {
    final names = perms.map((p) => p.name).toSet();
    setState(() => names.every(_selected.contains) ? _selected.removeAll(names) : _selected.addAll(names));
  }

  Color _levelColor(int l) {
    if (l >= 80) return AppTheme.red;
    if (l >= 60) return AppTheme.amber;
    if (l >= 40) return AppTheme.blue;
    return AppTheme.green;
  }

  @override
  Widget build(BuildContext context) {
    final grouped = _grouped;
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Text(_isEdit ? 'Edit Role' : 'Create Role'),
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
        final maxW = w > 720 ? 680.0 : double.infinity;
        final isWide = w >= 720;
        return Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxW),
            child: Form(
              key: _formKey,
              child: ListView(padding: EdgeInsets.all(pad), children: [
                _section('Role Details', [
                  if (isWide)
                    Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Expanded(child: _nameField()),
                      const SizedBox(width: 12),
                      Expanded(child: _descField()),
                    ])
                  else ...[
                    _nameField(),
                    const SizedBox(height: 14),
                    _descField(),
                  ],
                  if (!_isDefault) ...[
                    const SizedBox(height: 16),
                    _levelSlider(),
                  ],
                ]),
                const SizedBox(height: 16),
                Row(children: [
                  const Text('Permissions', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary, letterSpacing: 0.3)),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => setState(() {
                      final all = grouped.values.expand((p) => p).map((p) => p.name).toSet();
                      _selected.length == all.length ? _selected.clear() : _selected.addAll(all);
                    }),
                    child: Text(
                      _selected.isEmpty ? 'Select all' : 'Clear all',
                      style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                    child: Text('${_selected.length} selected', style: const TextStyle(fontSize: 11, color: AppTheme.primary, fontWeight: FontWeight.w600)),
                  ),
                ]),
                const SizedBox(height: 10),
                if (isWide)
                  _widePermissions(grouped)
                else
                  ...grouped.entries.map((e) => Padding(padding: const EdgeInsets.only(bottom: 8), child: _permCategory(e.key, e.value))),
                const SizedBox(height: 80),
              ]),
            ),
          ),
        );
      }),
    );
  }

  Widget _nameField() => TextFormField(
        controller: _nameCtrl,
        enabled: !_isDefault,
        decoration: const InputDecoration(labelText: 'Role Name', prefixIcon: Icon(Icons.badge_outlined, size: 18)),
        validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null,
      );

  Widget _descField() => TextFormField(
        controller: _descCtrl,
        maxLines: 2,
        decoration: const InputDecoration(labelText: 'Description', prefixIcon: Icon(Icons.description_outlined, size: 18), alignLabelWithHint: true),
      );

  Widget _levelSlider() {
    final lc = _levelColor(_level);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        const Text('Authority Level', style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
        const Spacer(),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(color: lc.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
          child: Text('$_level', style: TextStyle(fontWeight: FontWeight.w800, color: lc, fontSize: 14)),
        ),
      ]),
      SliderTheme(
        data: SliderTheme.of(context).copyWith(activeTrackColor: lc, thumbColor: lc, overlayColor: lc.withOpacity(0.1)),
        child: Slider(value: _level.toDouble(), min: 1, max: 99, divisions: 98, label: '$_level', onChanged: (v) => setState(() => _level = v.round())),
      ),
      Text('Higher level = more authority. Root is 100.', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
    ]);
  }

  Widget _widePermissions(Map<String, List<AppPermission>> grouped) {
    final entries = grouped.entries.toList();
    return Column(children: [
      for (int i = 0; i < entries.length; i += 2)
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(child: _permCategory(entries[i].key, entries[i].value)),
            const SizedBox(width: 8),
            if (i + 1 < entries.length)
              Expanded(child: _permCategory(entries[i + 1].key, entries[i + 1].value))
            else
              const Expanded(child: SizedBox()),
          ]),
        ),
    ]);
  }

  Widget _permCategory(String category, List<AppPermission> perms) {
    final names = perms.map((p) => p.name).toSet();
    final allSel = names.every(_selected.contains);
    final someSel = names.any(_selected.contains);
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
          childrenPadding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
          leading: SizedBox(
            width: 24, height: 24,
            child: Checkbox(
              value: allSel ? true : (someSel ? null : false),
              tristate: true,
              activeColor: AppTheme.primary,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              onChanged: (_) => _toggleCategory(perms),
            ),
          ),
          title: Text(category, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          subtitle: Text('${names.where(_selected.contains).length}/${perms.length}', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
          children: perms.map((p) => CheckboxListTile(
            value: _selected.contains(p.name),
            activeColor: AppTheme.primary,
            dense: true,
            contentPadding: EdgeInsets.zero,
            title: Text(p.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
            subtitle: p.description.isNotEmpty ? Text(p.description, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)) : null,
            onChanged: (v) => setState(() => v == true ? _selected.add(p.name) : _selected.remove(p.name)),
          )).toList(),
        ),
      ),
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
}
