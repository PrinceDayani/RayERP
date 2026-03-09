import '../models/employee_stats.dart';
import '../models/project.dart';
import 'api_service.dart';

class EmployeeStatsService extends ApiService {
  Future<AttendanceStats> getAttendanceStats(String employeeId, {int? month, int? year}) async {
    final now = DateTime.now();
    final m = month ?? now.month;
    final y = year ?? now.year;
    final data = await get('/attendance/stats?employeeId=$employeeId&month=$m&year=$y');
    return AttendanceStats.fromJson(data as Map<String, dynamic>);
  }

  Future<LeaveBalance> getLeaveBalance(String employeeId) async {
    final data = await get('/leaves/balance/$employeeId');
    return LeaveBalance.fromJson(data as Map<String, dynamic>);
  }

  Future<List<Project>> getEmployeeProjects(String employeeId) async {
    final data = await get('/projects');
    final all = (data as List).map((e) => Project.fromJson(e)).toList();
    return all.where((p) => _inTeam(p, employeeId)).toList();
  }

  bool _inTeam(Project p, String employeeId) {
    // Project.fromJson doesn't carry team — we need raw team field
    // handled via ProjectWithTeam below
    return false;
  }

  Future<List<ProjectWithTeam>> getEmployeeProjectsRaw(String employeeId) async {
    final data = await get('/projects');
    return (data as List)
        .map((e) => ProjectWithTeam.fromJson(e))
        .where((p) => p.teamIds.contains(employeeId))
        .toList();
  }

  Future<List<CareerEvent>> getCareerEvents(String employeeId) async {
    final data = await get('/career/$employeeId');
    final list = (data is Map ? data['events'] : data) as List? ?? [];
    return list.map((e) => CareerEvent.fromJson(e)).toList()
      ..sort((a, b) => b.date.compareTo(a.date));
  }

  Future<List<Achievement>> getAchievements(String employeeId) async {
    final data = await get('/achievements/employee/$employeeId');
    final list = (data is List ? data : (data as Map)['achievements'] ?? []) as List;
    return list.map((e) => Achievement.fromJson(e)).toList();
  }

  Future<List<SalaryHistory>> getSalaryHistory(String employeeId) async {
    final data = await get('/salary/$employeeId/history');
    final list = (data is List ? data : (data as Map)['history'] ?? []) as List;
    return list.map((e) => SalaryHistory.fromJson(e)).toList();
  }

  Future<TaskStats> getTaskStats(String employeeId) async {
    try {
      final data = await get('/tasks/stats?employeeId=$employeeId');
      return TaskStats.fromJson(data as Map<String, dynamic>);
    } catch (_) {
      return TaskStats();
    }
  }

  Future<List<DeptSummary>> getDeptSummary() async {
    final data = await get('/employee-reports/department-summary');
    return (data as List).map((e) => DeptSummary.fromJson(e)).toList();
  }

  Future<List<AttendanceSummaryItem>> getAttendanceSummary({int? month, int? year}) async {
    final now = DateTime.now();
    final m = month ?? now.month;
    final y = year ?? now.year;
    final data = await get('/employee-reports/attendance-summary?month=$m&year=$y');
    return (data as List).map((e) => AttendanceSummaryItem.fromJson(e)).toList();
  }
}

class ProjectWithTeam {
  final String id;
  final String name;
  final String status;
  final String priority;
  final DateTime startDate;
  final DateTime endDate;
  final int progress;
  final List<String> teamIds;

  ProjectWithTeam({
    required this.id,
    required this.name,
    required this.status,
    required this.priority,
    required this.startDate,
    required this.endDate,
    required this.progress,
    required this.teamIds,
  });

  factory ProjectWithTeam.fromJson(Map<String, dynamic> j) {
    List<String> ids = [];
    if (j['team'] is List) {
      for (final t in j['team'] as List) {
        if (t is String) {
          ids.add(t);
        } else if (t is Map) ids.add(t['_id']?.toString() ?? '');
      }
    }
    return ProjectWithTeam(
      id: j['_id'] ?? '',
      name: j['name'] ?? '',
      status: j['status'] ?? 'planning',
      priority: j['priority'] ?? 'medium',
      startDate: DateTime.tryParse(j['startDate'] ?? '') ?? DateTime.now(),
      endDate: DateTime.tryParse(j['endDate'] ?? '') ?? DateTime.now(),
      progress: (j['progress'] ?? 0).toInt(),
      teamIds: ids,
    );
  }
}
