import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  User? _user;
  bool _loading = false;
  String? _error;
  String? _csrfToken;
  DateTime? _csrfFetchedAt;
  bool _sessionExpired = false;

  User? get user => _user;
  bool get loading => _loading;
  String? get error => _error;
  bool get isLoggedIn => _user != null;
  bool get sessionExpired => _sessionExpired;

  /// Called on app start. Validates stored token against the server.
  /// If the token is missing or rejected, clears local state silently.
  Future<void> init() async {
    _user = await _authService.getUser();
    if (_user == null) return;

    try {
      await _authService.validateSession();
    } on UnauthorizedException {
      await _clearSession();
    } catch (_) {
      // Network unavailable — keep local state, server will reject on next call
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _loading = true;
    _error = null;
    _sessionExpired = false;
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
    await _clearSession();
    notifyListeners();
  }

  /// Called by any service/screen that catches an UnauthorizedException.
  Future<void> handleUnauthorized() async {
    _sessionExpired = true;
    await _clearSession();
    notifyListeners();
  }

  Future<void> _clearSession() async {
    await _authService.logout();
    _user = null;
    _csrfToken = null;
    _csrfFetchedAt = null;
  }

  /// Returns a valid CSRF token, refreshing if older than 55 minutes.
  Future<String> getCsrfToken() async {
    final now = DateTime.now();
    if (_csrfToken != null &&
        _csrfFetchedAt != null &&
        now.difference(_csrfFetchedAt!) < const Duration(minutes: 55)) {
      return _csrfToken!;
    }
    _csrfToken = await _authService.fetchCsrfToken();
    _csrfFetchedAt = now;
    return _csrfToken!;
  }

  /// Returns null on success, error message string on failure.
  Future<String?> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final csrf = await getCsrfToken();
      await _authService.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
        csrfToken: csrf,
      );
      _csrfToken = null;
      _csrfFetchedAt = null;
      return null;
    } on UnauthorizedException {
      await handleUnauthorized();
      return 'Session expired. Please log in again.';
    } catch (e) {
      return e.toString().replaceFirst('Exception: ', '');
    }
  }
}
