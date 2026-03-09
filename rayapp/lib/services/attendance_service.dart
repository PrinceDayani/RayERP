import '../models/attendance.dart';
import 'api_service.dart';

class AttendanceService extends ApiService {
  Future<List<Attendance>> getAll() async {
    final data = await get('/attendance');
    return (data as List).map((e) => Attendance.fromJson(e)).toList();
  }

  Future<List<Attendance>> getByEmployee(String employeeId) async {
    final data = await get('/attendance?employee=$employeeId');
    return (data as List).map((e) => Attendance.fromJson(e)).toList();
  }

  Future<Attendance> getById(String id) async {
    final data = await get('/attendance/$id');
    return Attendance.fromJson(data);
  }

  Future<List<Attendance>> getToday() async {
    final today = DateTime.now().toIso8601String().split('T')[0];
    final data = await get('/attendance?date=$today');
    return (data as List).map((e) => Attendance.fromJson(e)).toList();
  }

  Future<Map<String, int>> getTodayStats() async {
    final records = await getToday();
    return {
      'present': records.where((r) => r.status == 'present').length,
      'late': records.where((r) => r.status == 'late').length,
      'total': records.length,
    };
  }
}
