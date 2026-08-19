class AppConstants {
  static const String appName = 'RayERP';
  static const String tokenKey = 'auth_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user_data';
}

/// Initials from a User's `name`: first letters of the first two words.
String initialsOf(String? name) {
  final parts = (name ?? '').trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty);
  return parts.take(2).map((p) => p[0]).join().toUpperCase();
}

/// Display name for a populated User ref (populated as `name email`).
/// Returns '' when the ref is a bare id or absent.
String userNameOf(dynamic user) =>
    user is Map ? (user['name'] ?? '').toString().trim() : '';

/// Id of a User ref, whether populated or a bare ObjectId string.
String userIdOf(dynamic user) =>
    (user is Map ? (user['_id'] ?? '') : (user ?? '')).toString();

