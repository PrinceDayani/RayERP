import 'dart:async';
import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/contact.dart';
import '../../services/contact_service.dart';
import 'contact_detail_screen.dart';
import 'contact_form_screen.dart';

// ── Responsive breakpoints ────────────────────────────────────────────────────
// narrow  : w < 400   (small phones, 300–399px)
// mobile  : w < 600   (phones, 400–599px)
// tablet  : w < 900   (tablets, 600–899px)
// desktop : w >= 900  (wide tablets / desktop, 900–1440px)

class ContactListScreen extends StatefulWidget {
  const ContactListScreen({super.key});
  @override
  State<ContactListScreen> createState() => _ContactListScreenState();
}

class _ContactListScreenState extends State<ContactListScreen> {
  final _svc = ContactService.instance;
  final _searchCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  Timer? _debounce;

  List<Contact> _contacts = [];
  bool _loading = true;
  String? _error;

  // Stats from dedicated endpoint (preserved during reload)
  int _total = 0, _active = 0, _customers = 0, _vendors = 0;

  String _statusFilter = '';
  String _typeFilter = '';
  int _page = 1;
  bool _hasMore = true;
  bool _loadingMore = false;
  final Set<String> _deleting = {};

  static const _avatarColors = [
    AppTheme.primary, AppTheme.blue, AppTheme.purple,
    AppTheme.cyan, AppTheme.teal, AppTheme.amber,
  ];
  Color _avatarColor(String name) =>
      _avatarColors[name.codeUnitAt(0) % _avatarColors.length];

  @override
  void initState() {
    super.initState();
    _load();
    _scrollCtrl.addListener(_onScroll);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_loadingMore || !_hasMore) return;
    if (_scrollCtrl.position.pixels >= _scrollCtrl.position.maxScrollExtent - 200) {
      _loadMore();
    }
  }

  Future<void> _load() async {
    if (!mounted) return;
    // Preserve last stats to prevent flash
    final lastTotal = _total;
    final lastActive = _active;
    final lastCustomers = _customers;
    final lastVendors = _vendors;
    setState(() { _loading = true; _error = null; _page = 1; _hasMore = true; });
    try {
      // Fetch contacts and stats in parallel
      final results = await Future.wait([
        _svc.getAll(
          page: 1,
          limit: 50,
          search: _searchCtrl.text.trim(),
          status: _statusFilter,
          type: _typeFilter,
        ),
        _svc.getStats(),
      ]);
      if (!mounted) return;
      final page = results[0] as ({List<Contact> contacts, int total, int pages});
      final stats = results[1] as ContactStats?;
      setState(() {
        _contacts = page.contacts;
        _loading = false;
        _hasMore = _page < page.pages;
        if (stats != null) {
          _total     = stats.total;
          _active    = stats.active;
          _customers = stats.customers;
          _vendors   = stats.vendors;
        } else {
          _total     = page.total;
          _active    = page.contacts.where((c) => c.status == 'active').length;
          _customers = page.contacts.where((c) => c.isCustomer).length;
          _vendors   = page.contacts.where((c) => c.isVendor).length;
        }
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
          // Restore last stats on error
          _total = lastTotal;
          _active = lastActive;
          _customers = lastCustomers;
          _vendors = lastVendors;
        });
      }
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore || !mounted) return;
    setState(() { _loadingMore = true; });
    try {
      final nextPage = _page + 1;
      final result = await _svc.getAll(
        page: nextPage,
        limit: 50,
        search: _searchCtrl.text.trim(),
        status: _statusFilter,
        type: _typeFilter,
      );
      if (!mounted) return;
      setState(() {
        _contacts.addAll(result.contacts);
        _page = nextPage;
        _hasMore = nextPage < result.pages;
        _loadingMore = false;
      });
    } catch (e) {
      if (mounted) setState(() { _loadingMore = false; });
    }
  }

  void _onTypeFilter(String v) {
    _typeFilter = v;
    _load();
  }

  void _onSearchChanged(String v) {
    _debounce?.cancel();
    if (v.isEmpty) {
      _load();
    } else {
      _debounce = Timer(const Duration(milliseconds: 400), _load);
    }
  }

  Future<void> _delete(Contact c) async {
    if (_deleting.contains(c.id)) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete Contact', style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text('Delete "${c.name}"? This cannot be undone.'),
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
    setState(() => _deleting.add(c.id));
    try {
      await _svc.deleteContact(c.id);
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _deleting.remove(c.id));
    }
  }

  // ── Responsive helpers ──────────────────────────────────────────────────────
  double _hPad(double w) {
    if (w < 400) return 12;
    if (w < 600) return 16;
    if (w < 900) return 24;
    return 32;
  }

  // On desktop (≥900) show 2-column grid of cards
  bool _isWide(double w) => w >= 900;

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final pad = _hPad(w);
    final bg = isDark ? const Color(0xFF111827) : const Color(0xFFF8F9FA);

    return Scaffold(
      backgroundColor: bg,
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'contact_fab',
        backgroundColor: AppTheme.primary,
        icon: const Icon(Icons.person_add_outlined, color: Colors.white, size: 18),
        label: const Text('New Contact', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute(builder: (_) => const ContactFormScreen()));
          _load();
        },
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? _errorView()
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppTheme.primary,
                  child: CustomScrollView(
                    slivers: [
                      SliverToBoxAdapter(child: _statsSection(w, pad, isDark)),
                      SliverToBoxAdapter(child: _filterBar(w, pad, isDark)),
                      _contacts.isEmpty
                          ? SliverFillRemaining(child: _emptyView())
                          : _isWide(w)
                              ? _wideGrid(w, pad, isDark)
                              : _narrowList(pad, isDark),
                    ],
                  ),
                ),
    );
  }

  // ── Error / Empty ───────────────────────────────────────────────────────────
  Widget _errorView() => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppTheme.redBg, shape: BoxShape.circle),
              child: const Icon(Icons.error_outline, color: AppTheme.red, size: 32),
            ),
            const SizedBox(height: 16),
            const Text('Something went wrong', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
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

  Widget _emptyView() => Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.06),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.contacts_outlined, size: 40, color: AppTheme.primary),
          ),
          const SizedBox(height: 16),
          const Text('No contacts found', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          const SizedBox(height: 6),
          const Text('Try adjusting your filters or add a new contact.',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13), textAlign: TextAlign.center),
        ]),
      );

  // ── Stats ───────────────────────────────────────────────────────────────────
  Widget _statsSection(double w, double pad, bool isDark) {
    final narrow = w < 400;
    return Padding(
      padding: EdgeInsets.fromLTRB(pad, pad, pad, 8),
      child: Row(children: [
        _statTile('Total',     _total,     AppTheme.primary, isDark, narrow),
        const SizedBox(width: 8),
        _statTile('Active',    _active,    AppTheme.green,   isDark, narrow),
        const SizedBox(width: 8),
        _statTile('Customers', _customers, AppTheme.blue,    isDark, narrow),
        const SizedBox(width: 8),
        _statTile('Vendors',   _vendors,   AppTheme.amber,   isDark, narrow),
      ]),
    );
  }

  Widget _statTile(String label, int count, Color color, bool isDark, bool narrow) =>
      Expanded(
        child: Container(
          padding: EdgeInsets.symmetric(vertical: narrow ? 10 : 14, horizontal: 4),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1F2937) : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isDark ? const Color(0xFF374151) : const Color(0xFFE5E7EB)),
            boxShadow: isDark ? [] : [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 4, offset: const Offset(0, 1))],
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text('$count', style: TextStyle(fontSize: narrow ? 18 : 22, fontWeight: FontWeight.w800, color: color)),
            ),
            const SizedBox(height: 2),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(label, style: TextStyle(fontSize: narrow ? 9 : 10, color: AppTheme.textSecondary, fontWeight: FontWeight.w500)),
            ),
          ]),
        ),
      );

  // ── Filter bar ──────────────────────────────────────────────────────────────
  Widget _filterBar(double w, double pad, bool isDark) {
    final bg = isDark ? const Color(0xFF111827) : const Color(0xFFF8F9FA);
    final fillColor = isDark ? const Color(0xFF1F2937) : Colors.white;
    return Container(
      color: bg,
      padding: EdgeInsets.fromLTRB(pad, 4, pad, 8),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        // Search
        TextField(
          controller: _searchCtrl,
          onSubmitted: (_) => _load(),
          onChanged: _onSearchChanged,
          style: const TextStyle(fontSize: 14),
          decoration: InputDecoration(
            hintText: w < 400 ? 'Search contacts…' : 'Search name, phone, email, company…',
            hintStyle: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
            prefixIcon: const Icon(Icons.search, size: 18, color: AppTheme.textMuted),
            suffixIcon: _searchCtrl.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, size: 16, color: AppTheme.textMuted),
                    onPressed: () { _searchCtrl.clear(); _load(); },
                  )
                : IconButton(
                    icon: const Icon(Icons.search, size: 16, color: AppTheme.primary),
                    onPressed: _load,
                    tooltip: 'Search',
                  ),
            filled: true,
            fillColor: fillColor,
            contentPadding: EdgeInsets.zero,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
          ),
        ),
        const SizedBox(height: 8),
        // Status chips
        SizedBox(
          height: 30,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _label('Status'),
              _chip('All',      '',         _statusFilter, AppTheme.primary,       (v) { _statusFilter = v; _load(); }),
              _chip('Active',   'active',   _statusFilter, AppTheme.green,         (v) { _statusFilter = v; _load(); }),
              _chip('Inactive', 'inactive', _statusFilter, AppTheme.amber,         (v) { _statusFilter = v; _load(); }),
              _chip('Archived', 'archived', _statusFilter, AppTheme.textSecondary, (v) { _statusFilter = v; _load(); }),
              _divider(),
              _label('Type'),
              _chip('All Types', '',        _typeFilter,   AppTheme.primary,  _onTypeFilter),
              _chip('Client',   'client',   _typeFilter,   AppTheme.blue,     _onTypeFilter),
              _chip('Vendor',   'vendor',   _typeFilter,   AppTheme.amber,    _onTypeFilter),
              _chip('Partner',  'partner',  _typeFilter,   AppTheme.purple,   _onTypeFilter),
              _chip('Company',  'company',  _typeFilter,   AppTheme.cyan,     _onTypeFilter),
              _chip('Personal', 'personal', _typeFilter,   AppTheme.teal,     _onTypeFilter),
            ],
          ),
        ),
      ]),
    );
  }

  Widget _divider() => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        child: Container(width: 1, color: AppTheme.border),
      );

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(right: 6, left: 4),
        child: Center(
          child: Text(text, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
        ),
      );

  Widget _chip(String label, String value, String current, Color color, ValueChanged<String> onTap) {
    final sel = current == value;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: GestureDetector(
        onTap: () => onTap(sel ? '' : value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 4),
          decoration: BoxDecoration(
            color: sel ? color : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: sel ? color : AppTheme.border),
          ),
          child: Text(label, style: TextStyle(
            fontSize: 11,
            fontWeight: sel ? FontWeight.w700 : FontWeight.w500,
            color: sel ? Colors.white : AppTheme.textSecondary,
          )),
        ),
      ),
    );
  }

  // ── List (narrow/mobile/tablet) ─────────────────────────────────────────────
  Widget _narrowList(double pad, bool isDark) => SliverPadding(
        padding: EdgeInsets.fromLTRB(pad, 4, pad, 120),
        sliver: SliverList(
          delegate: SliverChildBuilderDelegate(
            (_, i) {
              if (i == _contacts.length) {
                return _loadingMore
                    ? Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          const CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2),
                          const SizedBox(height: 8),
                          Text('Loading more contacts...', 
                              style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                        ]),
                      )
                    : const SizedBox.shrink();
              }
              return _listCard(_contacts[i], isDark);
            },
            childCount: _contacts.length + (_loadingMore ? 1 : 0),
          ),
        ),
      );

  // ── Grid (desktop ≥900) ─────────────────────────────────────────────────────
  Widget _wideGrid(double w, double pad, bool isDark) {
    final cols = w >= 1200 ? 3 : 2;
    return SliverPadding(
      padding: EdgeInsets.fromLTRB(pad, 4, pad, 120),
      sliver: SliverGrid(
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: cols,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: w >= 1200 ? 2.8 : 3.2,
        ),
        delegate: SliverChildBuilderDelegate(
          (_, i) {
            if (i == _contacts.length) {
              return _loadingMore
                  ? Center(
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        const CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2),
                        const SizedBox(height: 8),
                        Text('Loading more contacts...', 
                            style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                      ]),
                    )
                  : const SizedBox.shrink();
            }
            return _gridCard(_contacts[i], isDark);
          },
          childCount: _contacts.length + (_loadingMore ? 1 : 0),
        ),
      ),
    );
  }

  // ── List card (mobile / tablet) ─────────────────────────────────────────────
  Widget _listCard(Contact c, bool isDark) {
    final color = _avatarColor(c.name);
    final cardBg = isDark ? const Color(0xFF1F2937) : Colors.white;
    final borderColor = isDark ? const Color(0xFF374151) : const Color(0xFFE5E7EB);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () async {
            await Navigator.push(context, MaterialPageRoute(builder: (_) => ContactDetailScreen(id: c.id)));
            _load();
          },
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: borderColor),
            ),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                // Priority stripe
                Container(width: 4, decoration: BoxDecoration(
                  color: _priorityColor(c.priority),
                  borderRadius: const BorderRadius.only(topLeft: Radius.circular(12), bottomLeft: Radius.circular(12)),
                )),
                // Avatar
                Padding(
                  padding: const EdgeInsets.fromLTRB(10, 12, 0, 12),
                  child: Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(child: Text(c.initials,
                        style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 14))),
                  ),
                ),
                const SizedBox(width: 10),
                // Content
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 11),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                      Text(c.name,
                          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13,
                              color: isDark ? Colors.white : AppTheme.textPrimary),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                      if ((c.position ?? '').isNotEmpty || (c.company ?? '').isNotEmpty) ...[
                        const SizedBox(height: 1),
                        Text(
                          [c.position, c.company].where((s) => s != null && s.isNotEmpty).join(' · '),
                          style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                          maxLines: 1, overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const SizedBox(height: 4),
                      Row(children: [
                        const Icon(Icons.phone_outlined, size: 10, color: AppTheme.textMuted),
                        const SizedBox(width: 3),
                        Flexible(child: Text(c.phone,
                            style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                            maxLines: 1, overflow: TextOverflow.ellipsis)),
                        if (c.isCustomer) ...[const SizedBox(width: 5), _miniTag('C', AppTheme.blue)],
                        if (c.isVendor)   ...[const SizedBox(width: 3), _miniTag('V', AppTheme.amber)],
                      ]),
                    ]),
                  ),
                ),
                // Right actions
                Padding(
                  padding: const EdgeInsets.fromLTRB(4, 8, 8, 8),
                  child: Column(mainAxisAlignment: MainAxisAlignment.spaceBetween, crossAxisAlignment: CrossAxisAlignment.end, children: [
                    _typeBadge(c.contactType),
                    Row(mainAxisSize: MainAxisSize.min, children: [
                      _iconBtn(Icons.edit_outlined, AppTheme.textSecondary, () async {
                        await Navigator.push(context, MaterialPageRoute(builder: (_) => ContactFormScreen(contact: c)));
                        _load();
                      }),
                      const SizedBox(width: 2),
                      _iconBtn(Icons.delete_outline, _deleting.contains(c.id) ? AppTheme.textMuted : AppTheme.red, _deleting.contains(c.id) ? () {} : () => _delete(c)),
                    ]),
                  ]),
                ),
              ]),
            ),
        ),
      ),
    );
  }

  // ── Grid card (desktop) ─────────────────────────────────────────────────────
  Widget _gridCard(Contact c, bool isDark) {
    final color = _avatarColor(c.name);
    final cardBg = isDark ? const Color(0xFF1F2937) : Colors.white;
    final borderColor = isDark ? const Color(0xFF374151) : const Color(0xFFE5E7EB);
    return Material(
      color: cardBg,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () async {
          await Navigator.push(context, MaterialPageRoute(builder: (_) => ContactDetailScreen(id: c.id)));
          _load();
        },
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: borderColor),
            boxShadow: isDark ? [] : [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 4, offset: const Offset(0, 1))],
          ),
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            Container(
              width: 46, height: 46,
              decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
              child: Center(child: Text(c.initials, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 15))),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
              Row(children: [
                Expanded(child: Text(c.name,
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: isDark ? Colors.white : AppTheme.textPrimary),
                    maxLines: 1, overflow: TextOverflow.ellipsis)),
                const SizedBox(width: 6),
                _typeBadge(c.contactType),
              ]),
              if ((c.company ?? '').isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(c.company!, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
              const SizedBox(height: 4),
              Row(children: [
                const Icon(Icons.phone_outlined, size: 10, color: AppTheme.textMuted),
                const SizedBox(width: 3),
                Flexible(child: Text(c.phone, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted), maxLines: 1, overflow: TextOverflow.ellipsis)),
                const Spacer(),
                _iconBtn(Icons.edit_outlined, AppTheme.textSecondary, () async {
                  await Navigator.push(context, MaterialPageRoute(builder: (_) => ContactFormScreen(contact: c)));
                  _load();
                }),
                _iconBtn(Icons.delete_outline, _deleting.contains(c.id) ? AppTheme.textMuted : AppTheme.red, _deleting.contains(c.id) ? () {} : () => _delete(c)),
              ]),
            ])),
          ]),
        ),
      ),
    );
  }

  // ── Shared helpers ──────────────────────────────────────────────────────────
  Widget _miniTag(String label, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(4)),
        child: Text(label, style: TextStyle(fontSize: 8, color: color, fontWeight: FontWeight.w700)),
      );

  Widget _typeBadge(String type) {
    final color = _typeColor(type);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
      child: Text(type, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }

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

  Widget _iconBtn(IconData icon, Color color, VoidCallback onTap) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(6),
        child: Padding(padding: const EdgeInsets.all(5), child: Icon(icon, size: 15, color: color)),
      );
}
