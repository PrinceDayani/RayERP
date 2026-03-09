import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../services/auth_provider.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentCtrl = TextEditingController();
  final _newCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();

  bool _showCurrent = false;
  bool _showNew = false;
  bool _showConfirm = false;
  bool _loading = false;
  String? _error;
  bool _success = false;

  @override
  void dispose() {
    _currentCtrl.dispose();
    _newCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  int _strength(String p) {
    int s = 0;
    if (p.length >= 8) s++;
    if (RegExp(r'[a-z]').hasMatch(p)) s++;
    if (RegExp(r'[A-Z]').hasMatch(p)) s++;
    if (RegExp(r'[0-9]').hasMatch(p)) s++;
    if (RegExp(r'[^a-zA-Z0-9]').hasMatch(p)) s++;
    return s;
  }

  Color _strengthColor(int s) {
    if (s <= 2) return AppTheme.red;
    if (s == 3) return AppTheme.amber;
    return AppTheme.green;
  }

  String _strengthLabel(int s) {
    if (s <= 2) return 'Weak';
    if (s == 3) return 'Good';
    return 'Strong';
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
      _success = false;
    });

    final error = await context.read<AuthProvider>().changePassword(
          currentPassword: _currentCtrl.text,
          newPassword: _newCtrl.text,
        );

    if (!mounted) return;
    if (error == null) {
      setState(() {
        _success = true;
        _loading = false;
      });
      _currentCtrl.clear();
      _newCtrl.clear();
      _confirmCtrl.clear();
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) Navigator.pop(context);
      });
    } else {
      setState(() {
        _error = error;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final newPass = _newCtrl.text;
    final s = _strength(newPass);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Change Password'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppTheme.primary, AppTheme.primaryHover],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.shield_outlined, color: Colors.white, size: 28),
                    SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Security Settings',
                            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                        SizedBox(height: 2),
                        Text('Update your account password',
                            style: TextStyle(color: Colors.white70, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Error
              if (_error != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.redBg,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.red.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: AppTheme.red, size: 16),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_error!, style: const TextStyle(color: AppTheme.red, fontSize: 13))),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Success
              if (_success) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.greenBg,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.green.withOpacity(0.3)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.check_circle_outline, color: AppTheme.green, size: 16),
                      SizedBox(width: 8),
                      Text('Password changed successfully', style: TextStyle(color: AppTheme.green, fontSize: 13)),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Current Password
              _label('Current Password'),
              const SizedBox(height: 6),
              TextFormField(
                controller: _currentCtrl,
                obscureText: !_showCurrent,
                decoration: InputDecoration(
                  hintText: 'Enter your current password',
                  suffixIcon: _visibilityToggle(_showCurrent, (v) => setState(() => _showCurrent = v)),
                ),
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 16),

              // New Password
              _label('New Password'),
              const SizedBox(height: 6),
              TextFormField(
                controller: _newCtrl,
                obscureText: !_showNew,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  hintText: 'Min. 8 characters',
                  suffixIcon: _visibilityToggle(_showNew, (v) => setState(() => _showNew = v)),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Required';
                  if (v.length < 8) return 'At least 8 characters';
                  if (v.length > 128) return 'Too long (max 128)';
                  if (_strength(v) < 3) return 'Must include uppercase, lowercase, and numbers';
                  if (v == _currentCtrl.text) return 'Must differ from current password';
                  return null;
                },
              ),

              // Strength indicator
              if (newPass.isNotEmpty) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    ...List.generate(5, (i) => Expanded(
                      child: Container(
                        height: 4,
                        margin: EdgeInsets.only(right: i < 4 ? 4 : 0),
                        decoration: BoxDecoration(
                          color: i < s ? _strengthColor(s) : const Color(0xFFE5E7EB),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    )),
                    const SizedBox(width: 8),
                    Text(_strengthLabel(s),
                        style: TextStyle(fontSize: 11, color: _strengthColor(s), fontWeight: FontWeight.w600)),
                  ],
                ),
              ],
              const SizedBox(height: 16),

              // Confirm Password
              _label('Confirm New Password'),
              const SizedBox(height: 6),
              TextFormField(
                controller: _confirmCtrl,
                obscureText: !_showConfirm,
                decoration: InputDecoration(
                  hintText: 'Re-enter new password',
                  suffixIcon: _visibilityToggle(_showConfirm, (v) => setState(() => _showConfirm = v)),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Required';
                  if (v != _newCtrl.text) return 'Passwords do not match';
                  return null;
                },
              ),
              const SizedBox(height: 28),

              // Submit
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _loading || _success ? null : _submit,
                  child: _loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.lock_reset, size: 18),
                            SizedBox(width: 8),
                            Text('Change Password'),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: _loading ? null : () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),

              const SizedBox(height: 24),
              // Security tips
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF1F2937)
                      : const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.info_outline, size: 14, color: AppTheme.textSecondary),
                        SizedBox(width: 6),
                        Text('Password Tips', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ...[
                      'Use a unique password not used elsewhere',
                      'Mix uppercase, lowercase, numbers & symbols',
                      'Avoid personal info like names or birthdays',
                    ].map((tip) => Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('• ', style: TextStyle(color: AppTheme.primary, fontSize: 12)),
                              Expanded(child: Text(tip, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
                            ],
                          ),
                        )),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text) => Text(
        text,
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.textPrimary),
      );

  Widget _visibilityToggle(bool visible, ValueChanged<bool> onChanged) => IconButton(
        icon: Icon(
          visible ? Icons.visibility_off_outlined : Icons.visibility_outlined,
          color: AppTheme.textSecondary,
          size: 20,
        ),
        onPressed: () => onChanged(!visible),
      );
}
