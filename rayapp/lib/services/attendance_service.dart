import '../models/attendance.dart';
import 'api_service.dart';

class AttendanceService extends ApiService {
  Future<List<Attendance>> getAll() async {
    final data = await get('/attendance');
    return (data as List).map((e) => Attendance.fromJson(e)).toList();
  }

  Future<List<Attendance>> getByDateRange(DateTime start, DateTime end) async {
    final s = start.toIso8601String().split('T')[0];
    final e = end.toIso8601String().split('T')[0];
    final data = await get('/attendance?startDate=$s&endDate=$e');
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

  Future<Map<String, dynamic>> getStats({required int month, required int year, String? employeeId}) async {
    final q = 'month=$month&year=$year${employeeId != null ? '&employeeId=$employeeId' : ''}';
    final data = await get('/attendance/stats?$q');
    return data as Map<String, dynamic>;
  }

  Future<Map<String, int>> getTodayStats() async {
    final records = await getToday();
    return {
      'present': records.where((r) => r.status == 'present').length,
      'late': records.where((r) => r.status == 'late').length,
      'total': records.length,
    };
  }

  Future<void> checkIn(String employeeId) async {
    await post('/attendance/checkin', {'employee': employeeId});
  }

  Future<void> checkOut(String employeeId) async {
    await post('/attendance/checkout', {'employee': employeeId});
  }

  Future<void> markAttendance(Map<String, dynamic> body) async {
    await post('/attendance/mark', body);
  }

  Future<void> updateAttendance(String id, Map<String, dynamic> body) async {
    await put('/attendance/$id', body);
  }

  Future<void> deleteAttendance(String id) async {
    await delete('/attendance/$id');
  }
}
