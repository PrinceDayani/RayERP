import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../utils/constants.dart';

class ApiService {
  // ── In-memory layer (fast) ──────────────────────────────────────────────────
  static final Map<String, ({dynamic data, DateTime at})> _mem = {};
  static const _ttl = Duration(minutes: 5);
  static const _diskPrefix = 'api_cache:';
  static const _diskTsPrefix = 'api_cache_ts:';

  // ── Disk helpers ────────────────────────────────────────────────────────────
  static Future<void> _writeDisk(String path, dynamic data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$_diskPrefix$path', jsonEncode(data));
    await prefs.setInt('$_diskTsPrefix$path', DateTime.now().millisecondsSinceEpoch);
  }

  static Future<dynamic> _readDisk(String path) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('$_diskPrefix$path');
    final ts = prefs.getInt('$_diskTsPrefix$path');
    if (raw == null || ts == null) return null;
    final age = DateTime.now().millisecondsSinceEpoch - ts;
    if (age > _ttl.inMilliseconds) return null;
    return jsonDecode(raw);
  }

  static Future<void> _invalidate(String path) async {
    final base = path.split('/')[1];
    _mem.removeWhere((k, _) => k.contains(base));
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs.getKeys().where((k) => k.startsWith(_diskPrefix) && k.contains(base));
    for (final k in keys) {
      await prefs.remove(k);
      await prefs.remove(k.replaceFirst(_diskPrefix, _diskTsPrefix));
    }
  }

  // ── Auth headers ────────────────────────────────────────────────────────────
  Future<Map<String, String>> headers() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConstants.tokenKey) ?? '';
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // ── GET with stale-while-revalidate ─────────────────────────────────────────
  Future<dynamic> get(String path) async {
    // 1. Memory hit
    final mem = _mem[path];
    if (mem != null && DateTime.now().difference(mem.at) < _ttl) return mem.data;

    // 2. Disk hit → return immediately, revalidate in background
    final disk = await _readDisk(path);
    if (disk != null) {
      _mem[path] = (data: disk, at: DateTime.now());
      _revalidate(path); // fire-and-forget
      return disk;
    }

    // 3. Network fetch
    return _fetch(path);
  }

  Future<dynamic> _fetch(String path) async {
    final res = await http
        .get(Uri.parse('${ApiConfig.baseUrl}$path'), headers: await headers())
        .timeout(ApiConfig.timeout);
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body) ?? (path.contains('?') || path.split('/').length > 3 ? {} : []);
      _mem[path] = (data: data, at: DateTime.now());
      _writeDisk(path, data); // fire-and-forget
      return data;
    }
    if (res.statusCode == 401) throw UnauthorizedException();
    throw Exception('Error ${res.statusCode}: ${res.body}');
  }

  void _revalidate(String path) async {
    try { await _fetch(path); } catch (_) {}
  }

  // ── Mutations ───────────────────────────────────────────────────────────────
  Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final res = await http
        .post(Uri.parse('${ApiConfig.baseUrl}$path'),
            headers: await headers(), body: jsonEncode(body))
        .timeout(ApiConfig.timeout);
    if (res.statusCode == 401) throw UnauthorizedException();
    final data = jsonDecode(res.body);
    if (res.statusCode == 200 || res.statusCode == 201) {
      await _invalidate(path);
      return data;
    }
    throw Exception(data['message'] ?? 'Error ${res.statusCode}');
  }

  Future<dynamic> put(String path, Map<String, dynamic> body) async {
    final res = await http
        .put(Uri.parse('${ApiConfig.baseUrl}$path'),
            headers: await headers(), body: jsonEncode(body))
        .timeout(ApiConfig.timeout);
    if (res.statusCode == 401) throw UnauthorizedException();
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) {
      await _invalidate(path);
      return data;
    }
    throw Exception(data['message'] ?? 'Error ${res.statusCode}');
  }

  Future<void> delete(String path) async {
    final res = await http
        .delete(Uri.parse('${ApiConfig.baseUrl}$path'), headers: await headers())
        .timeout(ApiConfig.timeout);
    if (res.statusCode == 401) throw UnauthorizedException();
    if (res.statusCode != 200) throw Exception('Error ${res.statusCode}');
    await _invalidate(path);
  }

  Future<dynamic> http_patch(String path, Map<String, dynamic> body) async {
    final req = http.Request('PATCH', Uri.parse('${ApiConfig.baseUrl}$path'));
    req.headers.addAll(await headers());
    req.body = jsonEncode(body);
    final streamed = await req.send().timeout(ApiConfig.timeout);
    final res = await http.Response.fromStream(streamed);
    if (res.statusCode == 401) throw UnauthorizedException();
    final data = jsonDecode(res.body);
    if (res.statusCode == 200 || res.statusCode == 201) {
      await _invalidate(path);
      return data;
    }
    throw Exception(data['message'] ?? 'Error ${res.statusCode}');
  }

  Future<void> delete_with_body(String path, Map<String, dynamic> body) async {
    final req = http.Request('DELETE', Uri.parse('${ApiConfig.baseUrl}$path'));
    req.headers.addAll(await headers());
    req.body = jsonEncode(body);
    final streamed = await req.send().timeout(ApiConfig.timeout);
    final res = await http.Response.fromStream(streamed);
    if (res.statusCode == 401) throw UnauthorizedException();
    if (res.statusCode != 200) throw Exception('Error ${res.statusCode}');
    await _invalidate(path);
  }

  Future<dynamic> multipartPost(String path, String filePath, String fieldName) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConstants.tokenKey) ?? '';
    final req = http.MultipartRequest('POST', Uri.parse('${ApiConfig.baseUrl}$path'));
    req.headers['Authorization'] = 'Bearer $token';
    req.files.add(await http.MultipartFile.fromPath(fieldName, filePath));
    final streamed = await req.send().timeout(ApiConfig.timeout);
    final res = await http.Response.fromStream(streamed);
    if (res.statusCode == 401) throw UnauthorizedException();
    final data = jsonDecode(res.body);
    if (res.statusCode == 200 || res.statusCode == 201) {
      await _invalidate(path);
      return data;
    }
    throw Exception(data['message'] ?? 'Error ${res.statusCode}');
  }
}

class UnauthorizedException implements Exception {
  const UnauthorizedException();
}
