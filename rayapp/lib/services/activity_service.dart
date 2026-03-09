import '../models/notification_models.dart';
import 'api_service.dart';

class ActivityService {
  final _api = ApiService();

  Future<List<ActivityLog>> getActivities({
    int page = 1,
    int limit = 30,
    String? resourceType,
    String? status,
  }) async {
    var path = '/activities?page=$page&limit=$limit';
    if (resourceType != null && resourceType.isNotEmpty) path += '&resourceType=$resourceType';
    if (status != null && status.isNotEmpty) path += '&status=$status';
    final data = await _api.get(path);
    final list = data is List ? data : (data['activities'] ?? data['logs'] ?? []);
    return (list as List).map((j) => ActivityLog.fromJson(j)).toList();
  }
}
