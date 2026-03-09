import '../models/department.dart';
import '../models/employee.dart';
import 'api_service.dart';

class DepartmentService extends ApiService {
  Future<List<Department>> getAll({String search = '', String status = 'all'}) async {
    var path = '/departments';
    final params = <String>[];
    if (search.isNotEmpty) params.add('search=${Uri.encodeComponent(search)}');
    if (status != 'all') params.add('status=$status');
    if (params.isNotEmpty) path += '?${params.join('&')}';
    final data = await get(path);
    final list = data is List ? data : (data['data'] ?? data['departments'] ?? []);
    return (list as List).map((d) => Department.fromJson(d)).toList();
  }

  Future<Department> getById(String id) async {
    final data = await get('/departments/$id');
    final d = data['data'] ?? data;
    return Department.fromJson(d);
  }

  Future<DepartmentStats> getStats() async {
    final data = await get('/departments/stats');
    final d = data['data'] ?? data;
    return DepartmentStats.fromJson(d);
  }

  Future<List<Employee>> getEmployees(String id) async {
    final data = await get('/departments/$id/employees');
    final list = data is List ? data : (data['data'] ?? []);
    return (list as List).map((e) => Employee.fromJson(e)).toList();
  }

  Future<List<dynamic>> getProjects(String id) async {
    final data = await get('/departments/$id/projects');
    final list = data is List ? data : (data['data'] ?? []);
    return list as List;
  }

  Future<List<dynamic>> getActivityLogs(String id) async {
    final data = await get('/departments/$id/activity?limit=20');
    return (data['logs'] ?? data['data'] ?? []) as List;
  }

  Future<Department> create(Map<String, dynamic> body) async {
    final data = await post('/departments', body);
    return Department.fromJson(data['data'] ?? data);
  }

  Future<Department> update(String id, Map<String, dynamic> body) async {
    final data = await put('/departments/$id', body);
    return Department.fromJson(data['data'] ?? data);
  }

  Future<void> deleteDepartment(String id) => delete('/departments/$id');

  // Legacy — used by ProjectFormScreen
  Future<List<String>> getNames() async {
    final list = await getAll();
    return list.map((d) => d.name).where((n) => n.isNotEmpty).toList();
  }
}
