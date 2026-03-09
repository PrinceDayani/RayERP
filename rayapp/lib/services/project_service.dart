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

  Future<ProjectStats> getStats() async {
    final data = await get('/projects/stats');
    return ProjectStats.fromJson(data is Map<String, dynamic> ? data : {});
  }

  Future<Project> create(Map<String, dynamic> body) async {
    final data = await post('/projects', body);
    return Project.fromJson(data);
  }

  Future<Project> update(String id, Map<String, dynamic> body) async {
    final data = await put('/projects/$id', body);
    return Project.fromJson(data);
  }

  Future<void> deleteProject(String id) => delete('/projects/$id');

  Future<Project> clone(String id, Map<String, dynamic> body) async {
    final data = await post('/projects/$id/clone', body);
    return Project.fromJson(data is Map ? data : data['project'] ?? data);
  }

  Future<void> updateMilestones(String id, List<Map<String, dynamic>> milestones) =>
      put('/projects/$id/milestones', {'milestones': milestones});

  Future<void> updateRisks(String id, List<Map<String, dynamic>> risks) =>
      put('/projects/$id/risks', {'risks': risks});
}

class ProjectTemplateService extends ApiService {
  Future<List<Map<String, dynamic>>> getTemplates() async {
    try {
      final data = await get('/project-templates');
      final list = data is List ? data : (data['templates'] ?? data['data'] ?? []);
      return (list as List).cast<Map<String, dynamic>>();
    } catch (_) { return []; }
  }

  Future<Map<String, dynamic>> createTemplate(Map<String, dynamic> body) async =>
      (await post('/project-templates', body)) as Map<String, dynamic>;

  Future<Map<String, dynamic>> createProjectFromTemplate(
      String templateId, Map<String, dynamic> body) async =>
      (await post('/project-templates/$templateId/create-project', body)) as Map<String, dynamic>;

  Future<Map<String, dynamic>> exportAsTemplate(String projectId) async =>
      (await get('/projects/$projectId/export-template')) as Map<String, dynamic>;
}
