import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../services/auth_provider.dart';
import 'dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final success = await auth.login(_emailCtrl.text.trim(), _passCtrl.text);
    if (success && mounted) {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: Stack(
        children: [
          // Background gradient blob
          Positioned(
            left: MediaQuery.of(context).size.width * 0.1,
            top: MediaQuery.of(context).size.height * 0.1,
            child: Container(
              width: 400,
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppTheme.primary.withOpacity(0.08),
                    AppTheme.primary.withOpacity(0.0),
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 400),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Card
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE5E7EB)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.08),
                              blurRadius: 24,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.all(32),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // Icon
                              Center(
                                child: Container(
                                  width: 64,
                                  height: 64,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(16),
                                    gradient: const LinearGradient(
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                      colors: [AppTheme.primary, AppTheme.primaryHover],
                                    ),
                                  ),
                                  child: const Icon(Icons.business, color: Colors.white, size: 32),
                                ),
                              ),
                              const SizedBox(height: 20),
                              const Text(
                                'Welcome Back',
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1A1A1A)),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Sign in to your RayERP account',
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                              ),
                              const SizedBox(height: 28),
                              // Error
                              if (auth.error != null) ...[
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFEF2F2),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFFECACA)),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 16),
                                      const SizedBox(width: 8),
                                      Expanded(child: Text(auth.error!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13))),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),
                              ],
                              // Email
                              const Text('Email Address', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF374151))),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _emailCtrl,
                                keyboardType: TextInputType.emailAddress,
                                decoration: const InputDecoration(hintText: 'Enter your email'),
                                validator: (v) => v == null || !v.contains('@') ? 'Enter a valid email' : null,
                              ),
                              const SizedBox(height: 16),
                              // Password
                              const Text('Password', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF374151))),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _passCtrl,
                                obscureText: _obscure,
                                decoration: InputDecoration(
                                  hintText: 'Enter your password',
                                  suffixIcon: IconButton(
                                    icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                        color: const Color(0xFF6B7280), size: 20),
                                    onPressed: () => setState(() => _obscure = !_obscure),
                                  ),
                                ),
                                validator: (v) => v == null || v.isEmpty ? 'Enter password' : null,
                              ),
                              const SizedBox(height: 24),
                              // Button
                              SizedBox(
                                height: 44,
                                child: ElevatedButton(
                                  onPressed: auth.loading ? null : _submit,
                                  child: auth.loading
                                      ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                      : const Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Icon(Icons.login, size: 18),
                                            SizedBox(width: 8),
                                            Text('Sign In'),
                                          ],
                                        ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text('© 2024 RayERP. All rights reserved.',
                          style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
