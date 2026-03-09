import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import 'user_list_screen.dart';
import 'role_list_screen.dart';
import 'permissions_screen.dart';
import 'profile_screen.dart';
import 'onboarding_screen.dart';
import 'pending_status_requests_screen.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});
  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;

  static const _tabs_data = [
    _TabItem(Icons.people_outline, Icons.people, 'Users'),
    _TabItem(Icons.shield_outlined, Icons.shield, 'Roles'),
    _TabItem(Icons.key_outlined, Icons.key, 'Permissions'),
    _TabItem(Icons.person_outline, Icons.person, 'Profile'),
  ];

  @override
  void initState() { super.initState(); _tabs = TabController(length: 4, vsync: this); }
  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (ctx, constraints) {
      final isWide = constraints.maxWidth >= 800;
      if (isWide) return _wideLayout();
      return _narrowLayout();
    });
  }

  // ── Wide: side navigation rail ─────────────────────────────────────────────
  Widget _wideLayout() => AnimatedBuilder(
        animation: _tabs,
        builder: (ctx, _) => Row(children: [
          Container(
            width: 200,
            decoration: BoxDecoration(
              color: Theme.of(ctx).cardColor,
              border: Border(right: BorderSide(color: AppTheme.border)),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
                child: Text('Admin', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textMuted, letterSpacing: 1)),
              ),
              ..._tabs_data.asMap().entries.map((e) => _navRailItem(e.key, e.value, ctx)),
              const Divider(height: 24),
              _navAction(ctx, Icons.person_add_alt_1_outlined, 'Onboard User', AppTheme.primary,
                  () => Navigator.push(ctx, MaterialPageRoute(builder: (_) => const OnboardingScreen()))),
              _navAction(ctx, Icons.pending_actions_outlined, 'Pending Requests', AppTheme.amber,
                  () => Navigator.push(ctx, MaterialPageRoute(builder: (_) => const PendingStatusRequestsScreen()))),
            ]),
          ),
          Expanded(child: _tabBody(_tabs.index)),
        ]),
      );

  Widget _navRailItem(int index, _TabItem item, BuildContext ctx) {
    final sel = _tabs.index == index;
    return GestureDetector(
      onTap: () => setState(() => _tabs.index = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: sel ? AppTheme.primary.withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(children: [
          Icon(sel ? item.selectedIcon : item.icon, size: 18, color: sel ? AppTheme.primary : AppTheme.textSecondary),
          const SizedBox(width: 10),
          Text(item.label, style: TextStyle(fontSize: 14, fontWeight: sel ? FontWeight.w600 : FontWeight.normal, color: sel ? AppTheme.primary : AppTheme.textSecondary)),
        ]),
      ),
    );
  }

  Widget _navAction(BuildContext ctx, IconData icon, String label, Color color, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 10),
            Text(label, style: TextStyle(fontSize: 13, color: color, fontWeight: FontWeight.w500)),
          ]),
        ),
      );

  // ── Narrow: tab bar + floating actions ────────────────────────────────────
  Widget _narrowLayout() => Column(children: [
        Container(
          color: Theme.of(context).cardColor,
          child: TabBar(
            controller: _tabs,
            labelColor: AppTheme.primary,
            unselectedLabelColor: AppTheme.textSecondary,
            indicatorColor: AppTheme.primary,
            indicatorWeight: 2.5,
            labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            tabs: _tabs_data.map((t) => Tab(
              icon: Icon(t.icon, size: 16),
              text: t.label,
              iconMargin: const EdgeInsets.only(bottom: 2),
            )).toList(),
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabs,
            children: [
              _UsersTabShell(),
              const RoleListScreen(),
              const PermissionsScreen(),
              const ProfileScreen(),
            ],
          ),
        ),
      ]);

  Widget _tabBody(int index) {
    return [
      _UsersTabShell(),
      const RoleListScreen(),
      const PermissionsScreen(),
      const ProfileScreen(),
    ][index];
  }
}

class _TabItem {
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  const _TabItem(this.icon, this.selectedIcon, this.label);
}

// Users tab with floating action buttons for Onboard + Pending
class _UsersTabShell extends StatelessWidget {
  const _UsersTabShell();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (ctx, constraints) {
      final isWide = constraints.maxWidth >= 800;
      // On wide layout, actions are in the side nav — no floating buttons needed
      if (isWide) return const UserListScreen();
      return Stack(children: [
        const UserListScreen(),
        Positioned(
          bottom: 80, right: 16,
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.end, children: [
            _fab(ctx, Icons.pending_actions_outlined, 'Pending', AppTheme.amber,
                () => Navigator.push(ctx, MaterialPageRoute(builder: (_) => const PendingStatusRequestsScreen()))),
            const SizedBox(height: 8),
            _fab(ctx, Icons.person_add_alt_1_outlined, 'Onboard', AppTheme.primary,
                () => Navigator.push(ctx, MaterialPageRoute(builder: (_) => const OnboardingScreen()))),
          ]),
        ),
      ]);
    });
  }

  Widget _fab(BuildContext ctx, IconData icon, String label, Color color, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [BoxShadow(color: color.withOpacity(0.35), blurRadius: 10, offset: const Offset(0, 4))],
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, color: Colors.white, size: 16),
            const SizedBox(width: 6),
            Text(label, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
          ]),
        ),
      );
}
