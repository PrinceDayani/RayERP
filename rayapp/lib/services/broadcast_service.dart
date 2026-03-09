import '../models/notification_models.dart';
import 'api_service.dart';

class BroadcastService {
  final _api = ApiService();

  Future<List<Broadcast>> getBroadcasts(String currentUserId) async {
    final data = await _api.get('/broadcast');
    final list = data is List ? data : (data['broadcasts'] ?? []);
    return (list as List).map((j) => Broadcast.fromJson(j, currentUserId)).toList();
  }

  Future<void> sendBroadcast({
    required String content,
    required String type,
    String? departmentId,
  }) async {
    final body = <String, dynamic>{'content': content, 'type': type};
    if (departmentId != null) body['departmentId'] = departmentId;
    await _api.post('/broadcast/send', body);
  }

  Future<void> markAsRead(String broadcastId) async {
    await _api.put('/broadcast/$broadcastId/read', {});
  }
}
