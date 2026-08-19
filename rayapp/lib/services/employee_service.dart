import '../models/employee.dart';
import 'api_service.dart';

class EmployeeService extends ApiService {
  Future<List<Employee>> getAll() async {
    final data = await get('/employees');
    return ApiService.unwrapList(data).map((e) => Employee.fromJson(e)).toList();
  }

  Future<Employee> getById(String id) async {
    final data = await get('/employees/$id');
    return Employee.fromJson(ApiService.unwrap(data));
  }

  Future<Employee> create(Map<String, dynamic> body) async {
    final data = await post('/employees', body);
    return Employee.fromJson(ApiService.unwrap(data));
  }

  Future<Employee> update(String id, Map<String, dynamic> body) async {
    final data = await put('/employees/$id', body);
    return Employee.fromJson(ApiService.unwrap(data));
  }

  Future<void> deleteEmployee(String id) async {
    await delete('/employees/$id');
  }
}
