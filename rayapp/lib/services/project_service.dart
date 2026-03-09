import '../models/project.dart';
import 'api_service.dart';

class ProjectService extends ApiService {
  Future<List<Project>> getAll() async {
    final data = await get('/projects');
    return (data as List).map((e) => Project.fromJson(e)).toList();
  }

  Future<Project> getById(String id) async {
    final data = await get('/projects/$id');
    return Project.fromJson(data);
  }
}
