import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/notification_models.dart';
import '../../services/notification_service.dart';

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  final _service = NotificationService();
  NotificationSettings? _settings;
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final s = await _service.getSettings();
      if (mounted) setState(() { _settings = s; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _save() async {
    if (_settings == null) return;
    setState(() => _saving = true);
    try {
      await _service.updateSettings(_settings!);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Settings saved'), backgroundColor: AppTheme.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e'), backgroundColor: AppTheme.red));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notification Settings'),
        actions: [
          if (_settings != null)
            _saving
                ? const Padding(
                    padding: EdgeInsets.all(14),
                    child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary)),
                  )
                : TextButton(
                    onPressed: _save,
                    child: const Text('Save', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w700)),
                  ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.error_outline, color: AppTheme.red, size: 36),
                  const SizedBox(height: 8),
                  Text(_error!, style: const TextStyle(color: AppTheme.red)),
                  TextButton(onPressed: _load, child: const Text('Retry')),
                ]))
              : ListView(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  children: [
                    _Section(
                      title: 'Delivery',
                      icon: Icons.send_outlined,
                      children: [
                        _Toggle('Email Notifications', _settings!.emailNotifications, (v) => setState(() => _settings!.emailNotifications = v)),
                        _Toggle('Push Notifications', _settings!.pushNotifications, (v) => setState(() => _settings!.pushNotifications = v)),
                        _Toggle('Sound', _settings!.soundEnabled, (v) => setState(() => _settings!.soundEnabled = v)),
                      ],
                    ),
                    _Section(
                      title: 'Activity',
                      icon: Icons.notifications_active_outlined,
                      children: [
                        _Toggle('Order Notifications', _settings!.orderNotifications, (v) => setState(() => _settings!.orderNotifications = v)),
                        _Toggle('Inventory Alerts', _settings!.inventoryAlerts, (v) => setState(() => _settings!.inventoryAlerts = v)),
                        _Toggle('Project Updates', _settings!.projectUpdates, (v) => setState(() => _settings!.projectUpdates = v)),
                        _Toggle('Task Reminders', _settings!.taskReminders, (v) => setState(() => _settings!.taskReminders = v)),
                        _Toggle('Budget Alerts', _settings!.budgetAlerts, (v) => setState(() => _settings!.budgetAlerts = v)),
                      ],
                    ),
                    _Section(
                      title: 'Reports',
                      icon: Icons.bar_chart_outlined,
                      children: [
                        _Toggle('Daily Reports', _settings!.dailyReports, (v) => setState(() => _settings!.dailyReports = v)),
                        _Toggle('Weekly Reports', _settings!.weeklyReports, (v) => setState(() => _settings!.weeklyReports = v)),
                        _Toggle('Monthly Reports', _settings!.monthlyReports, (v) => setState(() => _settings!.monthlyReports = v)),
                      ],
                    ),
                    _Section(
                      title: 'System',
                      icon: Icons.shield_outlined,
                      children: [
                        _Toggle('System Alerts', _settings!.systemAlerts, (v) => setState(() => _settings!.systemAlerts = v)),
                        _Toggle('Security Alerts', _settings!.securityAlerts, (v) => setState(() => _settings!.securityAlerts = v)),
                        _Toggle('Maintenance Notices', _settings!.maintenanceNotices, (v) => setState(() => _settings!.maintenanceNotices = v)),
                      ],
                    ),
                    const SizedBox(height: 80),
                  ],
                ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;

  const _Section({required this.title, required this.icon, required this.children});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 6, top: 8),
            child: Row(
              children: [
                Icon(icon, size: 15, color: AppTheme.primary),
                const SizedBox(width: 6),
                Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primary, letterSpacing: 0.5)),
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1F2937) : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: isDark ? const Color(0xFF374151) : AppTheme.border),
            ),
            child: Column(
              children: List.generate(children.length, (i) => Column(
                children: [
                  children[i],
                  if (i < children.length - 1)
                    const Divider(height: 1, indent: 16),
                ],
              )),
            ),
          ),
        ],
      ),
    );
  }
}

class _Toggle extends StatelessWidget {
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _Toggle(this.label, this.value, this.onChanged);

  @override
  Widget build(BuildContext context) {
    return SwitchListTile.adaptive(
      title: Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
      value: value,
      onChanged: onChanged,
      activeThumbColor: AppTheme.primary,
      activeTrackColor: AppTheme.primary.withValues(alpha: 0.4),
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
    );
  }
}
