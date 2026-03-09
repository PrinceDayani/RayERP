import '../services/api_service.dart';
import '../models/role_permission.dart';

class UserManagementService {
  final _api = ApiService();

  // ── Users ──────────────────────────────────────────────────────────────────

  Future<List<ManagedUser>> getUsers() async {
    final data = await _api.get('/users');
    return (data as List).map((e) => ManagedUser.fromJson(e)).toList();
  }

  Future<ManagedUser> getUserById(String id) async {
    final data = await _api.get('/users/$id');
    final user = data['user'] ?? data;
    return ManagedUser.fromJson(user);
  }

  Future<ManagedUser> createUser({
    required String name,
    required String email,
    required String password,
    String? roleId,
  }) async {
    final body = <String, dynamic>{'name': name, 'email': email, 'password': password};
    if (roleId != null) body['roleId'] = roleId;
    final data = await _api.post('/users', body);
    return ManagedUser.fromJson(data['user']);
  }

  Future<ManagedUser> updateUser(String id, {String? name, String? email, String? roleId, String? status}) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (email != null) body['email'] = email;
    if (roleId != null) body['roleId'] = roleId;
    if (status != null) body['status'] = status;
    final data = await _api.put('/users/$id', body);
    return ManagedUser.fromJson(data['user']);
  }

  Future<void> deleteUser(String id) => _api.delete('/users/$id');

  Future<void> updateUserRole(String userId, String roleId) =>
      _api.put('/users/$userId/role', {'roleId': roleId});

  Future<Map<String, dynamic>> updateUserStatus(String userId, String status, {String? reason}) async {
    final body = <String, dynamic>{'status': status};
    if (reason != null) body['reason'] = reason;
    return await _api.put('/users/$userId/status', body);
  }

  Future<void> resetPassword(String userId, String newPassword) =>
      _api.put('/users/$userId/reset-password', {'newPassword': newPassword});

  // ── Roles ──────────────────────────────────────────────────────────────────

  Future<List<AppRole>> getRoles() async {
    final data = await _api.get('/rbac/roles');
    return (data as List).map((e) => AppRole.fromJson(e)).toList();
  }

  Future<AppRole> createRole({
    required String name,
    required String description,
    required int level,
    required List<String> permissions,
  }) async {
    final data = await _api.post('/rbac/roles', {
      'name': name,
      'description': description,
      'level': level,
      'permissions': permissions,
    });
    return AppRole.fromJson(data);
  }

  Future<AppRole> updateRole(String roleId, {
    String? name,
    String? description,
    int? level,
    List<String>? permissions,
    bool? isActive,
  }) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (description != null) body['description'] = description;
    if (level != null) body['level'] = level;
    if (permissions != null) body['permissions'] = permissions;
    if (isActive != null) body['isActive'] = isActive;
    final data = await _api.put('/rbac/roles/$roleId', body);
    return AppRole.fromJson(data);
  }

  Future<void> deleteRole(String roleId) => _api.delete('/rbac/roles/$roleId');

  Future<void> toggleRoleStatus(String roleId) =>
      _api.post('/rbac/roles/$roleId/toggle-status', {});

  // ── Permissions ────────────────────────────────────────────────────────────

  Future<List<AppPermission>> getPermissions() async {
    final data = await _api.get('/rbac/permissions');
    return (data as List).map((e) => AppPermission.fromJson(e)).toList();
  }

  // ── Sessions ───────────────────────────────────────────────────────────────

  Future<List<UserSession>> getActiveSessions() async {
    final data = await _api.get('/users/active-sessions');
    final list = data is List ? data : (data is Map ? (data['sessions'] ?? data['data'] ?? []) : []);
    return (list as List).map((e) => UserSession.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> revokeSession(String sessionId) => _api.delete('/users/sessions/$sessionId');

  // ── Profile ────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getCompleteProfile() async {
    return await _api.get('/users/profile/complete');
  }

  Future<void> updateProfile({String? name, String? phone, String? bio}) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (phone != null) body['phone'] = phone;
    if (bio != null) body['bio'] = bio;
    await _api.put('/users/profile', body);
  }

  Future<void> changePassword({required String currentPassword, required String newPassword}) =>
      _api.put('/users/change-password', {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      });

  Future<List<dynamic>> getLoginHistory() async {
    final data = await _api.get('/users/login-history');
    return data is List ? data : [];
  }

  // ── Onboarding ─────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getOnboardingData() async {
    return await _api.get('/onboarding/data');
  }

  Future<ManagedUser> onboardUser({
    required String name,
    required String email,
    required String password,
    String? roleId,
    List<String>? projectIds,
  }) async {
    final body = <String, dynamic>{'name': name, 'email': email, 'password': password};
    if (roleId != null) body['role'] = roleId;
    if (projectIds != null) body['projectIds'] = projectIds;
    final data = await _api.post('/onboarding/create', body);
    return ManagedUser.fromJson(data['user']);
  }

  // ── Status Requests ────────────────────────────────────────────────────────

  Future<List<dynamic>> getPendingStatusRequests() async {
    final data = await _api.get('/users/status-requests/pending');
    return data['requests'] ?? [];
  }

  Future<void> approveStatusRequest(String requestId) =>
      _api.put('/users/status-requests/$requestId/approve', {});

  Future<void> rejectStatusRequest(String requestId, {String? reason}) =>
      _api.put('/users/status-requests/$requestId/reject', {'reason': reason ?? ''});
}
