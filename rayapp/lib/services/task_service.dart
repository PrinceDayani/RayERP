import '../models/task.dart';
import 'api_service.dart';

class TaskService extends ApiService {
  // ── Core CRUD ──────────────────────────────────────────────────────────────

  Future<List<Task>> getAll({String? projectId, String? status, String? priority, String? taskType}) async {
    var path = '/tasks';
    final params = <String>[];
    if (projectId != null) params.add('project=$projectId');
    if (status != null) params.add('status=$status');
    if (priority != null) params.add('priority=$priority');
    if (taskType != null) params.add('taskType=$taskType');
    if (params.isNotEmpty) path += '?${params.join('&')}';
    final data = await get(path);
    final list = data is List ? data : (data['tasks'] ?? data['data'] ?? []);
    return (list as List).map((e) => Task.fromJson(e)).toList();
  }

  Future<List<Task>> getIndividualTasks() => getAll(taskType: 'individual');

  Future<List<Task>> getProjectTasks() => getAll(taskType: 'project');

  Future<List<Task>> getTasksByProject(String projectId) async {
    final data = await get('/projects/$projectId/tasks');
    final list = data is List ? data : (data['tasks'] ?? data['data'] ?? []);
    return (list as List).map((e) => Task.fromJson(e)).toList();
  }

  Future<Task> getById(String id) async {
    final data = await get('/tasks/$id');
    return Task.fromJson(data);
  }

  Future<Task> create(Map<String, dynamic> body) async {
    final data = await post('/tasks', body);
    return Task.fromJson(data);
  }

  Future<Task> update(String id, Map<String, dynamic> body) async {
    final data = await put('/tasks/$id', body);
    return Task.fromJson(data);
  }

  Future<void> deleteTask(String id) => delete('/tasks/$id');

  Future<Task> updateStatus(String id, String status, {String? userId}) async {
    final body = <String, dynamic>{'status': status};
    if (userId != null) body['user'] = userId;
    final data = await http_patch('/tasks/$id/status', body);
    return Task.fromJson(data);
  }

  // ── My Tasks ───────────────────────────────────────────────────────────────

  Future<List<Task>> getMyTasks() async {
    try {
      final data = await get('/tasks/my-tasks');
      final list = data is List ? data : (data['tasks'] ?? data['data'] ?? []);
      return (list as List).map((e) => Task.fromJson(e)).toList();
    } catch (_) {
      return getAll();
    }
  }

  // ── Comments ───────────────────────────────────────────────────────────────

  Future<Task> addComment(String id, String comment, String userId) async {
    final data = await post('/tasks/$id/comments', {'comment': comment, 'user': userId});
    return Task.fromJson(data);
  }

  // ── Checklist ──────────────────────────────────────────────────────────────

  Future<void> addChecklistItem(String id, String text) =>
      post('/tasks/$id/checklist', {'text': text});

  Future<void> updateChecklistItem(String id, String itemId, bool completed) =>
      http_patch('/tasks/$id/checklist', {'itemId': itemId, 'completed': completed});

  Future<void> deleteChecklistItem(String id, String itemId) =>
      delete('/tasks/$id/checklist/$itemId');

  // ── Subtasks ───────────────────────────────────────────────────────────────

  Future<void> addSubtask(String id, Map<String, dynamic> body) =>
      post('/tasks/$id/subtasks', body);

  Future<void> deleteSubtask(String id, String subtaskId) =>
      delete('/tasks/$id/subtasks/$subtaskId');

  Future<Map<String, dynamic>> getSubtaskProgress(String id) async {
    final data = await get('/tasks/$id/subtasks/progress');
    return data is Map<String, dynamic> ? data : {};
  }

  // ── Tags ───────────────────────────────────────────────────────────────────

  Future<void> addTag(String id, String name, {String color = '#3b82f6'}) =>
      post('/tasks/$id/tags', {'name': name, 'color': color});

  Future<void> removeTag(String id, String name) =>
      delete_with_body('/tasks/$id/tags', {'name': name});

  // ── Time Tracking ──────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> startTimer(String id, String userId, {String? description}) async {
    final body = <String, dynamic>{'user': userId};
    if (description != null && description.isNotEmpty) body['description'] = description;
    final data = await post('/tasks/$id/time/start', body);
    return data is Map<String, dynamic> ? data : {};
  }

  Future<Map<String, dynamic>> stopTimer(String id, String userId) async {
    final data = await post('/tasks/$id/time/stop', {'user': userId});
    return data is Map<String, dynamic> ? data : {};
  }

  // ── Dependencies ───────────────────────────────────────────────────────────

  Future<void> addDependency(String id, String dependsOn, String type) =>
      post('/tasks/$id/dependencies', {'dependsOn': dependsOn, 'type': type});

  Future<void> removeDependency(String id, String dependencyId) =>
      delete('/tasks/$id/dependencies/$dependencyId');

  Future<Map<String, dynamic>> getDependencyGraph() async {
    final data = await get('/tasks/dependencies/graph');
    return data is Map<String, dynamic> ? data : {};
  }

  Future<List<dynamic>> getCriticalPath() async {
    final data = await get('/tasks/dependencies/critical-path');
    return data is List ? data : [];
  }

  // ── Recurring ──────────────────────────────────────────────────────────────

  Future<void> setRecurring(String id, String pattern, bool enabled) =>
      post('/tasks/$id/recurring', {'pattern': pattern, 'enabled': enabled});

  // ── Templates ──────────────────────────────────────────────────────────────

  Future<List<Task>> getTemplates() async {
    final data = await get('/tasks/templates/all');
    final list = data is List ? data : (data['templates'] ?? data['data'] ?? []);
    return (list as List).map((e) => Task.fromJson(e)).toList();
  }

  Future<Task> createFromTemplate(String templateId, Map<String, dynamic> body) async {
    final data = await post('/tasks/templates/$templateId/create', body);
    return Task.fromJson(data);
  }

  // ── Search ─────────────────────────────────────────────────────────────────

  Future<List<Task>> search(Map<String, dynamic> filters) async {
    final params = filters.entries
        .where((e) => e.value != null && e.value.toString().isNotEmpty)
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value.toString())}')
        .join('&');
    final data = await get('/tasks/search${params.isNotEmpty ? '?$params' : ''}');
    final list = data is List ? data : (data['tasks'] ?? data['data'] ?? []);
    return (list as List).map((e) => Task.fromJson(e)).toList();
  }

  Future<List<String>> getSearchSuggestions(String query) async {
    final data = await get('/tasks/search/suggestions?q=${Uri.encodeComponent(query)}');
    final list = data is List ? data : (data['suggestions'] ?? []);
    return (list as List).map((e) => e.toString()).toList();
  }

  // ── Calendar ───────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getCalendarView({String? month, String? year}) async {
    var path = '/tasks/calendar/view';
    final params = <String>[];
    if (month != null) params.add('month=$month');
    if (year != null) params.add('year=$year');
    if (params.isNotEmpty) path += '?${params.join('&')}';
    final data = await get(path);
    return data is Map<String, dynamic> ? data : {'tasks': data};
  }

  // ── Analytics ──────────────────────────────────────────────────────────────

  Future<TaskAnalytics> getAnalytics({String? projectId}) async {
    var path = '/task-analytics/analytics';
    if (projectId != null) path += '?project=$projectId';
    final data = await get(path);
    return TaskAnalytics.fromJson(data is Map<String, dynamic> ? data : {});
  }

  Future<List<Map<String, dynamic>>> getBurndown({String? projectId}) async {
    var path = '/task-analytics/analytics/burndown';
    if (projectId != null) path += '?project=$projectId';
    final data = await get(path);
    final list = data is List ? data : (data['burndown'] ?? data['data'] ?? []);
    return (list as List).map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<List<Map<String, dynamic>>> getVelocity({String? projectId}) async {
    var path = '/task-analytics/analytics/velocity';
    if (projectId != null) path += '?project=$projectId';
    final data = await get(path);
    final list = data is List ? data : (data['velocity'] ?? data['data'] ?? []);
    return (list as List).map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<List<Map<String, dynamic>>> getTeamPerformance({String? projectId}) async {
    var path = '/task-analytics/analytics/team-performance';
    if (projectId != null) path += '?project=$projectId';
    final data = await get(path);
    final list = data is List ? data : (data['performance'] ?? data['data'] ?? []);
    return (list as List).map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<Map<String, dynamic>> getStats() async {
    final data = await get('/tasks/stats');
    return data is Map<String, dynamic> ? data : {};
  }

  // ── Watchers ───────────────────────────────────────────────────────────────

  Future<void> addWatcher(String id, String userId) =>
      post('/tasks/$id/watchers', {'userId': userId});

  Future<void> removeWatcher(String id, String userId) =>
      delete_with_body('/tasks/$id/watchers', {'userId': userId});

  // ── Clone ──────────────────────────────────────────────────────────────────

  Future<Task> clone(String id) async {
    final data = await post('/tasks/$id/clone', {});
    return Task.fromJson(data);
  }

  Future<Task> uploadAttachment(String id, String filePath) async {
    final data = await multipartPost('/tasks/$id/attachments', filePath, 'file');
    return Task.fromJson(data);
  }

  Future<void> removeAttachment(String id, String attachmentId) =>
      delete('/tasks/$id/attachments/$attachmentId');
}

  Future<Task> addProjectTaskComment(String projectId, String taskId, String comment, String userId) async {
    final data = await post('/projects/$projectId/tasks/$taskId/comments', {'comment': comment, 'user': userId});
    return Task.fromJson(data);
  }

  Future<Map<String, dynamic>> startProjectTaskTimer(String projectId, String taskId, String userId, {String? description}) async {
    final body = <String, dynamic>{'user': userId};
    if (description != null && description.isNotEmpty) body['description'] = description;
    final data = await post('/projects/$projectId/tasks/$taskId/time/start', body);
    return data is Map<String, dynamic> ? data : {};
  }

  Future<Map<String, dynamic>> stopProjectTaskTimer(String projectId, String taskId, String userId) async {
    final data = await post('/projects/$projectId/tasks/$taskId/time/stop', {'user': userId});
    return data is Map<String, dynamic> ? data : {};
  }

  Future<void> addProjectTaskTag(String projectId, String taskId, String name, {String color = '#3b82f6'}) =>
      post('/projects/$projectId/tasks/$taskId/tags', {'name': name, 'color': color});

  Future<void> removeProjectTaskTag(String projectId, String taskId, String name) =>
      delete_with_body('/projects/$projectId/tasks/$taskId/tags', {'name': name});

  Future<void> addProjectTaskChecklist(String projectId, String taskId, String text) =>
      post('/projects/$projectId/tasks/$taskId/checklist', {'text': text});

  Future<void> updateProjectTaskChecklist(String projectId, String taskId, String itemId, bool completed, {String? completedBy}) async {
    final body = <String, dynamic>{'itemId': itemId, 'completed': completed};
    if (completedBy != null) body['completedBy'] = completedBy;
    await http_patch('/projects/$projectId/tasks/$taskId/checklist/$itemId', body);
  }

  Future<void> deleteProjectTaskChecklist(String projectId, String taskId, String itemId) =>
      delete('/projects/$projectId/tasks/$taskId/checklist/$itemId');

  Future<void> addProjectTaskWatcher(String projectId, String taskId, String userId) =>
      post('/projects/$projectId/tasks/$taskId/watchers', {'userId': userId});

  Future<void> removeProjectTaskWatcher(String projectId, String taskId, String userId) =>
      delete_with_body('/projects/$projectId/tasks/$taskId/watchers', {'userId': userId});

  Future<void> addProjectTaskSubtask(String projectId, String taskId, Map<String, dynamic> body) =>
      post('/projects/$projectId/tasks/$taskId/subtasks', body);

  Future<void> deleteProjectTaskSubtask(String projectId, String taskId, String subtaskId) =>
      delete('/projects/$projectId/tasks/$taskId/subtasks/$subtaskId');

  Future<Map<String, dynamic>> getProjectTaskSubtaskProgress(String projectId, String taskId) async {
    final data = await get('/projects/$projectId/tasks/$taskId/subtasks/progress');
    return data is Map<String, dynamic> ? data : {};
  }

  Future<void> addProjectTaskDependency(String projectId, String taskId, String dependsOn, String type) =>
      post('/projects/$projectId/tasks/$taskId/dependencies', {'dependsOn': dependsOn, 'type': type});

  Future<void> removeProjectTaskDependency(String projectId, String taskId, String dependencyId) =>
      delete('/projects/$projectId/tasks/$taskId/dependencies/$dependencyId');

  Future<Task> updateProjectTaskStatus(String projectId, String taskId, String status, {String? userId}) async {
    final body = <String, dynamic>{'status': status};
    if (userId != null) body['user'] = userId;
    final data = await http_patch('/projects/$projectId/tasks/$taskId/status', body);
    return Task.fromJson(data);
  }

  Future<Task> cloneProjectTask(String projectId, String taskId) async {
    final data = await post('/projects/$projectId/tasks/$taskId/clone', {});
    return Task.fromJson(data);
  }

  Future<List<dynamic>> getProjectTaskTimeline(String projectId, String taskId) async {
    final data = await get('/projects/$projectId/tasks/$taskId/timeline');
    return data is List ? data : (data['timeline'] ?? []);
  }

  Future<Task> uploadProjectTaskAttachment(String projectId, String taskId, String filePath) async {
    final data = await multipartPost('/projects/$projectId/tasks/$taskId/attachments', filePath, 'file');
    return Task.fromJson(data);
  }

  Future<void> removeProjectTaskAttachment(String projectId, String taskId, String attachmentId) =>
      delete('/projects/$projectId/tasks/$taskId/attachments/$attachmentId');

  Future<void> reorderProjectTasks(String projectId, List<Map<String, dynamic>> tasks) =>
      post('/projects/$projectId/tasks/reorder', {'tasks': tasks});
}
