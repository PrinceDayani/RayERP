import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/user.dart';
import '../utils/constants.dart';
import '../services/api_service.dart';

class AuthService {
  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http
        .post(
          Uri.parse('${ApiConfig.baseUrl}/auth/login'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'email': email, 'password': password}),
        )
        .timeout(ApiConfig.timeout);

    final data = jsonDecode(res.body);
    if (res.statusCode == 200) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConstants.tokenKey, data['token']);
      await prefs.setString(AppConstants.userKey, jsonEncode(data['user']));
    }
    return data;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.tokenKey);
    await prefs.remove(AppConstants.userKey);
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(AppConstants.tokenKey);
  }

  Future<User?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(AppConstants.userKey);
    if (raw == null) return null;
    return User.fromJson(jsonDecode(raw));
  }

  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  /// Validates the stored token against the server.
  /// Throws [UnauthorizedException] if the server rejects it.
  Future<void> validateSession() async {
    final token = await getToken();
    if (token == null || token.isEmpty) throw UnauthorizedException();
    final res = await http
        .get(
          Uri.parse('${ApiConfig.baseUrl}/auth/check'),
          headers: {'Authorization': 'Bearer $token'},
        )
        .timeout(ApiConfig.timeout);
    if (res.statusCode == 401) throw UnauthorizedException();
  }

  Future<String> fetchCsrfToken() async {
    final token = await getToken();
    if (token == null || token.isEmpty) throw Exception('Not authenticated');
    final res = await http
        .get(
          Uri.parse('${ApiConfig.baseUrl}/csrf/token'),
          headers: {'Authorization': 'Bearer $token'},
        )
        .timeout(ApiConfig.timeout);
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      return data['csrfToken'] as String;
    }
    throw Exception('Failed to fetch CSRF token');
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
    required String csrfToken,
  }) async {
    final token = await getToken();
    if (token == null || token.isEmpty) throw Exception('Not authenticated');
    final res = await http
        .put(
          Uri.parse('${ApiConfig.baseUrl}/auth/change-password'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
            'X-CSRF-Token': csrfToken,
          },
          body: jsonEncode({
            'currentPassword': currentPassword,
            'newPassword': newPassword,
          }),
        )
        .timeout(ApiConfig.timeout);
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) {
      throw Exception(data['message'] ?? 'Failed to change password');
    }
  }
}
