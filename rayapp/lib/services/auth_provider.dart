import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  User? _user;
  bool _loading = false;
  String? _error;

  User? get user => _user;
  bool get loading => _loading;
  String? get error => _error;
  bool get isLoggedIn => _user != null;

  Future<void> init() async {
    _user = await _authService.getUser();
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _authService.login(email, password);
      if (data['token'] != null) {
        _user = User.fromJson(data['user']);
        _loading = false;
        notifyListeners();
        return true;
      }
    _error = data['message'] ?? 'Login failed';
    } catch (e) {
      _error = 'Connection error: $e';
    }

    _loading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    notifyListeners();
  }
}
