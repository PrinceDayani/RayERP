import '../models/leave.dart';
import 'api_service.dart';

class LeaveService extends ApiService {
  Future<List<Leave>> getAll() async {
    final data = await get('/leaves');
    return (data as List).map((e) => Leave.fromJson(e)).toList();
  }

  Future<List<Leave>> getByEmployee(String employeeId) async {
    final data = await get('/leaves?employee=$employeeId');
    return (data as List).map((e) => Leave.fromJson(e)).toList();
  }

  Future<Leave> create(Map<String, dynamic> body) async {
    final data = await post('/leaves', body);
    return Leave.fromJson(data);
  }

  Future<void> updateStatus(String id, String status, {String? rejectionReason}) async {
    final body = <String, dynamic>{'status': status};
    if (rejectionReason != null) body['rejectionReason'] = rejectionReason;
    await put('/leaves/$id/status', body);
  }

  Future<List<Leave>> getToday() async {
    final today = DateTime.now().toIso8601String().split('T')[0];
    final data = await get('/leaves?date=$today&status=approved');
    return (data as List).map((e) => Leave.fromJson(e)).toList();
  }
}
