class AppRole {
  final String id;
  final String name;
  final String description;
  final int level;
  final bool isActive;
  final bool isDefault;
  final List<String> permissions;

  AppRole({
    required this.id,
    required this.name,
    required this.description,
    required this.level,
    required this.isActive,
    required this.isDefault,
    required this.permissions,
  });

  factory AppRole.fromJson(Map<String, dynamic> j) => AppRole(
        id: j['_id'] ?? '',
        name: j['name'] ?? '',
        description: j['description'] ?? '',
        level: (j['level'] ?? 0) is int ? j['level'] : int.tryParse('${j['level']}') ?? 0,
        isActive: j['isActive'] ?? true,
        isDefault: j['isDefault'] ?? false,
        permissions: List<String>.from(j['permissions'] ?? []),
      );
}

class AppPermission {
  final String id;
  final String name;
  final String description;
  final String category;
  final bool isActive;

  AppPermission({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    required this.isActive,
  });

  factory AppPermission.fromJson(Map<String, dynamic> j) => AppPermission(
        id: j['_id'] ?? '',
        name: j['name'] ?? '',
        description: j['description'] ?? '',
        category: j['category'] ?? '',
        isActive: j['isActive'] ?? true,
      );
}

class ManagedUser {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String status;
  final dynamic role;
  final String? department;
  final String? avatarUrl;
  final dynamic lastLogin;

  ManagedUser({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.status,
    this.role,
    this.department,
    this.avatarUrl,
    this.lastLogin,
  });

  String get roleName {
    if (role == null) return '';
    if (role is Map) return role['name'] ?? '';
    return role.toString();
  }

  String get roleId {
    if (role == null) return '';
    if (role is Map) return role['_id'] ?? '';
    return '';
  }

  factory ManagedUser.fromJson(Map<String, dynamic> j) => ManagedUser(
        id: j['id'] ?? j['_id'] ?? '',
        name: j['name'] ?? '',
        email: j['email'] ?? '',
        phone: j['phone'],
        status: j['status'] ?? 'active',
        role: j['role'],
        department: j['department'] is Map ? j['department']['name'] : j['department'],
        avatarUrl: j['avatarUrl'],
        lastLogin: j['lastLogin'],
      );
}

class UserSession {
  final String id;
  final String? device;
  final String? browser;
  final String? os;
  final String ipAddress;
  final DateTime lastActive;
  final DateTime createdAt;
  final bool isCurrent;

  UserSession({
    required this.id,
    this.device,
    this.browser,
    this.os,
    required this.ipAddress,
    required this.lastActive,
    required this.createdAt,
    required this.isCurrent,
  });

  factory UserSession.fromJson(Map<String, dynamic> j) {
    final deviceInfo = j['deviceInfo'] as Map<String, dynamic>?;
    return UserSession(
      id: j['_id'] ?? '',
      device: deviceInfo?['deviceType'],
      browser: deviceInfo?['browser'],
      os: deviceInfo?['os'],
      ipAddress: j['ipAddress'] ?? '',
      lastActive: j['lastActive'] != null ? DateTime.tryParse(j['lastActive']) ?? DateTime.now() : DateTime.now(),
      createdAt: j['createdAt'] != null ? DateTime.tryParse(j['createdAt']) ?? DateTime.now() : DateTime.now(),
      isCurrent: j['isCurrent'] ?? false,
    );
  }
}
