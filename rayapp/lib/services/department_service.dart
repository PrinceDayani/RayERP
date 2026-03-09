import 'api_service.dart';

class DepartmentService extends ApiService {
  Future<List<String>> getNames() async {
    final data = await get('/departments');
    return (data as List)
        .map((d) => (d['name'] ?? '').toString())
        .where((n) => n.isNotEmpty)
        .toList();
  }
}
