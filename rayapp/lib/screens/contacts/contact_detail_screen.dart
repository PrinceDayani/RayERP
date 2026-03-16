import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/app_theme.dart';
import '../../models/contact.dart';
import '../../services/contact_service.dart';
import 'contact_form_screen.dart';

class ContactDetailScreen extends StatefulWidget {
  final String id;
  const ContactDetailScreen({super.key, required this.id});
  @override
  State<ContactDetailScreen> createState() => _ContactDetailScreenState();
}

class _ContactDetailScreenState extends State<ContactDetailScreen> {
  final _svc = ContactService.instance;
  Contact? _contact;
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });
    try {
      final c = await _svc.getById(widget.id);
      if (mounted) setState(() { _contact = c; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _delete() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete Contact', style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text('Delete "${_contact!.name}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppTheme.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await _svc.deleteContact(widget.id);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  void _copy(String label, String value) {
    Clipboard.setData(ClipboardData(text: value));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$label copied'), duration: const Duration(seconds: 1),
          behavior: SnackBarBehavior.floating),
    );
  }

  Future<void> _launch(Uri uri, String fallbackLabel, String fallbackValue) async {
    try {
      final canLaunch = await canLaunchUrl(uri);
      if (canLaunch) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        _copy(fallbackLabel, fallbackValue);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Cannot launch — $fallbackLabel copied instead'), 
                duration: const Duration(seconds: 2), behavior: SnackBarBehavior.floating),
          );
        }
      }
    } catch (e) {
      _copy(fallbackLabel, fallbackValue);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Launch failed — $fallbackLabel copied'), 
              duration: const Duration(seconds: 2), behavior: SnackBarBehavior.floating),
        );
      }
    }
  }

  // ── Responsive helpers ──────────────────────────────────────────────────────
  double _hPad(double w) {
    if (w < 400) return 12;
    if (w < 600) return 16;
    if (w < 900) return 24;
    return 32;
  }
  bool _isTwoCol(double w) => w >= 768;

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF111827) : const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: Text(_contact?.name ?? 'Contact',
            style: const TextStyle(fontWeight: FontWeight.w700),
            overflow: TextOverflow.ellipsis),
        centerTitle: false,
        actions: _contact == null ? [] : [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Edit',
            onPressed: () async {
              await Navigator.push(context, MaterialPageRoute(
                  builder: (_) => ContactFormScreen(contact: _contact)));
              _load();
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: AppTheme.red),
            tooltip: 'Delete',
            onPressed: _delete,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? _errorView()
              : _body(w, isDark),
    );
  }

  Widget _errorView() => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(color: AppTheme.redBg, shape: BoxShape.circle),
              child: const Icon(Icons.error_outline, color: AppTheme.red, size: 32),
            ),
            const SizedBox(height: 16),
            const Text('Failed to load contact', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 6),
            Text(_error!, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13), textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _load,
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('Retry'),
              style: FilledButton.styleFrom(backgroundColor: AppTheme.primary),
            ),
          ]),
        ),
      );

  Widget _body(double w, bool isDark) {
    final c = _contact!;
    final pad = _hPad(w);
    final twoCol = _isTwoCol(w);

    final avatarColors = [AppTheme.primary, AppTheme.blue, AppTheme.purple, AppTheme.cyan, AppTheme.teal];
    final color = avatarColors[c.name.codeUnitAt(0) % avatarColors.length];

    // Build section widgets
    final contactInfoSection = _section(isDark, 'Contact Info', Icons.contact_phone_outlined, [
      _infoRow(isDark, Icons.phone_outlined, 'Phone', c.phone, copyable: true, tappable: true,
          onTap: () => _launch(Uri(scheme: 'tel', path: c.phone), 'Phone', c.phone)),
      if ((c.alternativePhone ?? '').isNotEmpty)
        _infoRow(isDark, Icons.phone_outlined, 'Alt. Phone', c.alternativePhone!, copyable: true, tappable: true,
            onTap: () => _launch(Uri(scheme: 'tel', path: c.alternativePhone!), 'Alt. Phone', c.alternativePhone!)),
      if ((c.email ?? '').isNotEmpty)
        _infoRow(isDark, Icons.email_outlined, 'Email', c.email!, copyable: true, tappable: true,
            onTap: () => _launch(Uri(scheme: 'mailto', path: c.email!), 'Email', c.email!)),
      if ((c.address ?? '').isNotEmpty)
        _infoRow(isDark, Icons.location_on_outlined, 'Address', c.address!),
    ]);

    final hasBusinessSection = (c.industry ?? '').isNotEmpty || (c.companySize ?? '').isNotEmpty ||
        (c.annualRevenue ?? '').isNotEmpty || (c.reference ?? '').isNotEmpty;
    final businessSection = hasBusinessSection
        ? _section(isDark, 'Business Details', Icons.business_outlined, [
            if ((c.industry ?? '').isNotEmpty)       _infoRow(isDark, Icons.factory_outlined, 'Industry', c.industry!),
            if ((c.companySize ?? '').isNotEmpty)    _infoRow(isDark, Icons.people_outline, 'Company Size', c.companySize!),
            if ((c.annualRevenue ?? '').isNotEmpty)  _infoRow(isDark, Icons.attach_money_outlined, 'Revenue', c.annualRevenue!),
            if ((c.reference ?? '').isNotEmpty)      _infoRow(isDark, Icons.link_outlined, 'Reference', c.reference!),
          ])
        : null;

    final hasSocialSection = (c.website ?? '').isNotEmpty || (c.linkedIn ?? '').isNotEmpty || (c.twitter ?? '').isNotEmpty;
    final socialSection = hasSocialSection
        ? _section(isDark, 'Social & Web', Icons.public_outlined, [
            if ((c.website ?? '').isNotEmpty)
              _infoRow(isDark, Icons.language_outlined, 'Website', c.website!, copyable: true, tappable: true,
                  onTap: () => _launch(Uri.parse(c.website!.startsWith('http') ? c.website! : 'https://${c.website!}'), 'Website', c.website!)),
            if ((c.linkedIn ?? '').isNotEmpty)
              _infoRow(isDark, Icons.link_outlined, 'LinkedIn', c.linkedIn!, copyable: true, tappable: true,
                  onTap: () => _launch(Uri.parse(c.linkedIn!.startsWith('http') ? c.linkedIn! : 'https://${c.linkedIn!}'), 'LinkedIn', c.linkedIn!)),
            if ((c.twitter ?? '').isNotEmpty)
              _infoRow(isDark, Icons.alternate_email_outlined, 'Twitter', c.twitter!, copyable: true, tappable: true,
                  onTap: () => _launch(Uri.parse('https://twitter.com/${c.twitter!.replaceAll('@', '')}'), 'Twitter', c.twitter!)),
          ])
        : null;

    final hasDatesSection = c.birthday != null || c.anniversary != null;
    final datesSection = hasDatesSection
        ? _section(isDark, 'Important Dates', Icons.cake_outlined, [
            if (c.birthday != null)    _infoRow(isDark, Icons.cake_outlined, 'Birthday', _fmtDate(c.birthday!)),
            if (c.anniversary != null) _infoRow(isDark, Icons.celebration_outlined, 'Anniversary', _fmtDate(c.anniversary!)),
          ])
        : null;

    final metaSection = _section(isDark, 'Record Info', Icons.info_outline, [
      if (c.createdBy != null && c.createdBy!.name.isNotEmpty)
        _infoRow(isDark, Icons.person_outline, 'Created By', c.createdBy!.name),
      if (c.department != null && c.department!.name.isNotEmpty)
        _infoRow(isDark, Icons.business_outlined, 'Department', c.department!.name),
      if (c.createdAt != null) _infoRow(isDark, Icons.calendar_today_outlined, 'Created', _fmtDate(c.createdAt!)),
      if (c.updatedAt != null) _infoRow(isDark, Icons.update_outlined, 'Updated', _fmtDate(c.updatedAt!)),
    ]);

    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.fromLTRB(pad, pad, pad, 40),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1100),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [

              // ── Hero header ──
              _heroCard(c, color, isDark, w),
              const SizedBox(height: 12),

              // ── Quick actions (phone / email) ──
              if ((c.email ?? '').isNotEmpty || c.phone.isNotEmpty)
                _quickActions(c, isDark),
              if ((c.email ?? '').isNotEmpty || c.phone.isNotEmpty)
                const SizedBox(height: 12),

              // ── Two-column layout on wide screens ──
              if (twoCol) ...[
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  // Left column
                  Expanded(child: Column(children: [
                    contactInfoSection,
                    if (businessSection != null) ...[const SizedBox(height: 12), businessSection],
                    if (datesSection != null) ...[const SizedBox(height: 12), datesSection],
                  ])),
                  const SizedBox(width: 12),
                  // Right column
                  Expanded(child: Column(children: [
                    if (socialSection != null) ...[socialSection, const SizedBox(height: 12)],
                    if (c.tags.isNotEmpty) ...[_tagsCard(c, isDark), const SizedBox(height: 12)],
                    if ((c.notes ?? '').isNotEmpty) ...[_notesCard(c, isDark), const SizedBox(height: 12)],
                    metaSection,
                  ])),
                ]),
              ] else ...[
                // ── Single-column layout ──
                contactInfoSection,
                if (businessSection != null) ...[const SizedBox(height: 12), businessSection],
                if (socialSection != null) ...[const SizedBox(height: 12), socialSection],
                if (hasDatesSection) ...[const SizedBox(height: 12), datesSection!],
                if (c.tags.isNotEmpty) ...[const SizedBox(height: 12), _tagsCard(c, isDark)],
                if ((c.notes ?? '').isNotEmpty) ...[const SizedBox(height: 12), _notesCard(c, isDark)],
                const SizedBox(height: 12),
                metaSection,
              ],
            ]),
          ),
        ),
      ),
    );
  }

  // ── Hero card ───────────────────────────────────────────────────────────────
  Widget _heroCard(Contact c, Color color, bool isDark, double w) {
    final narrow = w < 400;
    return _card(isDark, child: Padding(
      padding: EdgeInsets.all(narrow ? 14 : 20),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Avatar
        Container(
          width: narrow ? 52 : 68,
          height: narrow ? 52 : 68,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Center(child: Text(c.initials,
              style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: narrow ? 18 : 24))),
        ),
        SizedBox(width: narrow ? 12 : 16),
        // Info
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(c.name,
              style: TextStyle(fontSize: narrow ? 15 : 18, fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : AppTheme.textPrimary)),
          if ((c.position ?? '').isNotEmpty || (c.company ?? '').isNotEmpty) ...[
            const SizedBox(height: 3),
            Text(
              [c.position, c.company].where((s) => s != null && s.isNotEmpty).join(' · '),
              style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
              maxLines: 2, overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 10),
          Wrap(spacing: 5, runSpacing: 5, children: [
            _badge(c.contactType, _typeColor(c.contactType)),
            _badge(c.priority, _priorityColor(c.priority)),
            _badge(c.status, _statusColor(c.status)),
            _badge(c.visibilityLevel, AppTheme.textSecondary),
            if (c.isCustomer) _badge('Customer', AppTheme.blue),
            if (c.isVendor)   _badge('Vendor', AppTheme.amber),
          ]),
        ])),
      ]),
    ));
  }

  // ── Quick action buttons ────────────────────────────────────────────────────
  Widget _quickActions(Contact c, bool isDark) => Row(children: [
        if (c.phone.isNotEmpty) ...[
          Expanded(child: _actionBtn(isDark, Icons.phone_outlined, 'Call', AppTheme.green,
              () => _launch(Uri(scheme: 'tel', path: c.phone), 'Phone', c.phone))),
          const SizedBox(width: 8),
        ],
        if ((c.email ?? '').isNotEmpty)
          Expanded(child: _actionBtn(isDark, Icons.email_outlined, 'Email', AppTheme.blue,
              () => _launch(Uri(scheme: 'mailto', path: c.email!), 'Email', c.email!))),
        if (c.phone.isNotEmpty && (c.alternativePhone ?? '').isNotEmpty) ...[
          const SizedBox(width: 8),
          Expanded(child: _actionBtn(isDark, Icons.message_outlined, 'Alt. Phone', AppTheme.purple,
              () => _launch(Uri(scheme: 'tel', path: c.alternativePhone!), 'Alt. Phone', c.alternativePhone!))),
        ],
      ]);

  Widget _actionBtn(bool isDark, IconData icon, String label, Color color, VoidCallback onTap) =>
      Material(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: color.withValues(alpha: 0.2)),
            ),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(icon, size: 18, color: color),
              const SizedBox(height: 4),
              Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
            ]),
          ),
        ),
      );

  // ── Tags card ───────────────────────────────────────────────────────────────
  Widget _tagsCard(Contact c, bool isDark) => _card(isDark, child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _sectionHeader(isDark, 'Tags', Icons.label_outline),
          const SizedBox(height: 10),
          Wrap(spacing: 6, runSpacing: 6, children: c.tags.map((t) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.primary.withValues(alpha: 0.2)),
            ),
            child: Text(t, style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w500)),
          )).toList()),
        ]),
      ));

  // ── Notes card ──────────────────────────────────────────────────────────────
  Widget _notesCard(Contact c, bool isDark) => _card(isDark, child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _sectionHeader(isDark, 'Notes', Icons.notes_outlined),
          const SizedBox(height: 10),
          Text(c.notes!, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.6)),
        ]),
      ));

  // ── Section ─────────────────────────────────────────────────────────────────
  Widget _section(bool isDark, String title, IconData icon, List<Widget> children) =>
      _card(isDark, child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _sectionHeader(isDark, title, icon),
          const SizedBox(height: 12),
          ...children,
        ]),
      ));

  Widget _sectionHeader(bool isDark, String title, IconData icon) => Row(children: [
        Container(
          padding: const EdgeInsets.all(5),
          decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
          child: Icon(icon, size: 13, color: AppTheme.primary),
        ),
        const SizedBox(width: 8),
        Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
            color: isDark ? Colors.white : AppTheme.textPrimary)),
      ]);

  // ── Info row ─────────────────────────────────────────────────────────────────
  Widget _infoRow(bool isDark, IconData icon, String label, String value,
      {bool copyable = false, bool tappable = false, VoidCallback? onTap}) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, size: 13, color: AppTheme.textMuted),
          const SizedBox(width: 8),
          SizedBox(
            width: 80,
            child: Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
          ),
          Expanded(
            child: tappable && onTap != null
                ? GestureDetector(
                    onTap: onTap,
                    child: Text(value,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500,
                            color: AppTheme.blue, decoration: TextDecoration.underline)),
                  )
                : Text(value,
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500,
                        color: isDark ? const Color(0xFFD1D5DB) : AppTheme.textPrimary)),
          ),
          if (copyable)
            GestureDetector(
              onTap: () => _copy(label, value),
              child: Padding(
                padding: const EdgeInsets.only(left: 6),
                child: Icon(Icons.copy_outlined, size: 13, color: AppTheme.textMuted),
              ),
            ),
        ]),
      );

  // ── Card wrapper ─────────────────────────────────────────────────────────────
  Widget _card(bool isDark, {required Widget child}) => Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1F2937) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isDark ? const Color(0xFF374151) : AppTheme.border),
          boxShadow: isDark ? [] : [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 4, offset: const Offset(0, 1))],
        ),
        child: child,
      );

  // ── Badge ────────────────────────────────────────────────────────────────────
  Widget _badge(String label, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
        child: Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
      );

  // ── Color helpers ─────────────────────────────────────────────────────────────
  Color _typeColor(String t) => switch (t) {
    'client'  => AppTheme.blue,
    'vendor'  => AppTheme.amber,
    'partner' => AppTheme.purple,
    'company' => AppTheme.cyan,
    _         => AppTheme.teal,
  };

  Color _priorityColor(String p) => switch (p) {
    'critical' => AppTheme.red,
    'high'     => const Color(0xFFEA580C),
    'medium'   => AppTheme.blue,
    _          => AppTheme.green,
  };

  Color _statusColor(String s) => switch (s) {
    'active'   => AppTheme.green,
    'inactive' => AppTheme.amber,
    _          => AppTheme.textSecondary,
  };

  String _fmtDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
