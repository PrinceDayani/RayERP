import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../utils/constants.dart';

class ApiService {
  static final Map<String, ({dynamic data, DateTime at})> _cache = {};
  static const _ttl = Duration(minutes: 5);

  static void _invalidate(String path) {
    final base = path.split('/')[1]; // e.g. 'employees'
    _cache.removeWhere((k, _) => k.contains(base));
  }

  Future<Map<String, String>> headers() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConstants.tokenKey) ?? '';
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  Future<dynamic> get(String path) async {
    final cached = _cache[path];
    if (cached != null && DateTime.now().difference(cached.at) < _ttl) {
      return cached.data;
    }
    final res = await http
        .get(Uri.parse('${ApiConfig.baseUrl}$path'), headers: await headers())
        .timeout(ApiConfig.timeout);
    if (res.statusCode == 200) {
      final decoded = jsonDecode(res.body);
      final data = decoded ?? (path.contains('?') || path.split('/').length > 3 ? {} : []);
      _cache[path] = (data: data, at: DateTime.now());
      return data;
    }
    throw Exception('Error ${res.statusCode}: ${res.body}');
  }

  Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final res = await http
        .post(Uri.parse('${ApiConfig.baseUrl}$path'),
            headers: await headers(), body: jsonEncode(body))
        .timeout(ApiConfig.timeout);
    final data = jsonDecode(res.body);
    if (res.statusCode == 200 || res.statusCode == 201) {
      _invalidate(path);
      return data;
    }
    throw Exception(data['message'] ?? 'Error ${res.statusCode}');
  }

  Future<dynamic> put(String path, Map<String, dynamic> body) async {
    final res = await http
        .put(Uri.parse('${ApiConfig.baseUrl}$path'),
            headers: await headers(), body: jsonEncode(body))
        .timeout(ApiConfig.timeout);
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) {
      _invalidate(path);
      return data;
    }
    throw Exception(data['message'] ?? 'Error ${res.statusCode}');
  }

  Future<void> delete(String path) async {
    final res = await http
        .delete(Uri.parse('${ApiConfig.baseUrl}$path'), headers: await headers())
        .timeout(ApiConfig.timeout);
    if (res.statusCode != 200) throw Exception('Error ${res.statusCode}');
    _invalidate(path);
  }
}
