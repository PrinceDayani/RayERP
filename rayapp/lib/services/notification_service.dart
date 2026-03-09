import '../models/notification_models.dart';
import 'api_service.dart';

class NotificationService {
  final _api = ApiService();

  Future<List<AppNotification>> getNotifications() async {
    final data = await _api.get('/notifications');
    final list = data is List ? data : (data['notifications'] ?? []);
    return (list as List).map((j) => AppNotification.fromJson(j)).toList();
  }

  Future<int> getUnreadCount() async {
    final data = await _api.get('/notifications/unread-count');
    return data['count'] ?? 0;
  }

  Future<void> markAsRead(String id) async {
    await _api.http_patch('/notifications/$id/read', {});
  }

  Future<void> markAllAsRead() async {
    await _api.http_patch('/notifications/mark-all-read', {});
  }

  Future<void> deleteNotification(String id) async {
    await _api.delete('/notifications/$id');
  }

  Future<void> deleteAll() async {
    await _api.delete('/notifications');
  }

  Future<NotificationSettings> getSettings() async {
    final data = await _api.get('/notification-settings');
    return NotificationSettings.fromJson(data['settings'] ?? data);
  }

  Future<void> updateSettings(NotificationSettings settings) async {
    await _api.put('/notification-settings', settings.toJson());
  }
}
