import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../utils/constants.dart';
import 'api_service.dart';

class BudgetCategory {
  final String name;
  final String type;
  final double allocated;
  final double spent;

  BudgetCategory({required this.name, required this.type, required this.allocated, required this.spent});

  factory BudgetCategory.fromJson(Map<String, dynamic> json) => BudgetCategory(
        name: json['name'] ?? '',
        type: json['type'] ?? '',
        allocated: (json['allocatedAmount'] ?? 0).toDouble(),
        spent: (json['spentAmount'] ?? 0).toDouble(),
      );
}

class ProjectBudget {
  final String id;
  final double totalBudget;
  final double totalSpent;
  final String currency;
  final String status;
  final List<BudgetCategory> categories;

  ProjectBudget({
    required this.id,
    required this.totalBudget,
    required this.totalSpent,
    required this.currency,
    required this.status,
    required this.categories,
  });

  double get remaining => totalBudget - totalSpent;
  double get usedPercent => totalBudget > 0 ? (totalSpent / totalBudget * 100).clamp(0, 100) : 0;

  factory ProjectBudget.fromJson(Map<String, dynamic> json) {
    final cats = (json['categories'] as List? ?? [])
        .map((c) => BudgetCategory.fromJson(c))
        .toList();
    final spent = cats.fold(0.0, (s, c) => s + c.spent);
    return ProjectBudget(
      id: json['_id'] ?? '',
      totalBudget: (json['totalBudget'] ?? 0).toDouble(),
      totalSpent: spent,
      currency: json['currency'] ?? 'USD',
      status: json['status'] ?? 'draft',
      categories: cats,
    );
  }
}

class ActivityEntry {
  final String action;
  final String description;
  final String userName;
  final DateTime createdAt;

  ActivityEntry({required this.action, required this.description, required this.userName, required this.createdAt});

  factory ActivityEntry.fromJson(Map<String, dynamic> json) {
    final user = json['user'] ?? json['performedBy'];
    String name = '';
    if (user is Map) name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
    return ActivityEntry(
      action: json['action'] ?? json['type'] ?? '',
      description: json['description'] ?? json['details'] ?? '',
      userName: name.isNotEmpty ? name : (json['userName'] ?? ''),
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}

class ProjectBudgetService extends ApiService {
  Future<void> budgetAction(String budgetId, String action) =>
      post('/budget/$budgetId/$action', {});

  Future<ProjectBudget?> getByProject(String projectId) async {
    try {
      final data = await get('/projects/$projectId/budget');
      if (data == null) return null;
      final obj = data is List ? (data.isEmpty ? null : data[0]) : data;
      return obj == null ? null : ProjectBudget.fromJson(obj);
    } catch (_) {
      return null;
    }
  }

  Future<void> create(String projectId, Map<String, dynamic> body) =>
      post('/projects/$projectId/budget', body);

  Future<void> update(String budgetId, Map<String, dynamic> body) =>
      put('/budget/$budgetId', body);
}

class ProjectActivityService extends ApiService {
  Future<List<ActivityEntry>> getByProject(String projectId) async {
    try {
      final data = await get('/projects/$projectId/activity');
      final list = data is List ? data : (data['activities'] ?? data['data'] ?? []);
      return (list as List).map((e) => ActivityEntry.fromJson(e)).toList();
    } catch (_) {
      return [];
    }
  }
}

class ProjectFile {
  final String id;
  final String name;
  final String fileType;
  final int size;
  final String url;
  final String uploaderName;
  final DateTime createdAt;

  ProjectFile({required this.id, required this.name, required this.fileType,
      required this.size, required this.url, required this.uploaderName, required this.createdAt});

  factory ProjectFile.fromJson(Map<String, dynamic> json) {
    final uploader = json['uploadedBy'] ?? json['createdBy'];
    String name = '';
    if (uploader is Map) name = '${uploader['firstName'] ?? ''} ${uploader['lastName'] ?? ''}'.trim();
    return ProjectFile(
      id: json['_id'] ?? '',
      name: json['name'] ?? json['originalName'] ?? '',
      fileType: json['fileType'] ?? json['mimeType'] ?? '',
      size: (json['size'] ?? 0).toInt(),
      url: json['url'] ?? json['path'] ?? '',
      uploaderName: name.isNotEmpty ? name : (json['uploaderName'] ?? ''),
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }

  String get sizeLabel {
    if (size < 1024) return '${size}B';
    if (size < 1024 * 1024) return '${(size / 1024).toStringAsFixed(1)}KB';
    return '${(size / (1024 * 1024)).toStringAsFixed(1)}MB';
  }

  String get iconName {
    final t = fileType.toLowerCase();
    if (t.contains('image')) return 'image';
    if (t.contains('pdf')) return 'pdf';
    if (t.contains('word') || t.contains('document')) return 'doc';
    if (t.contains('sheet') || t.contains('excel')) return 'sheet';
    if (t.contains('zip') || t.contains('archive')) return 'zip';
    return 'file';
  }
}

class ProjectAnalytics {
  final int totalTasks;
  final int completedTasks;
  final int inProgressTasks;
  final double cpi; // cost performance index
  final double spi; // schedule performance index
  final String overallRisk;

  ProjectAnalytics({required this.totalTasks, required this.completedTasks,
      required this.inProgressTasks, required this.cpi, required this.spi, required this.overallRisk});

  factory ProjectAnalytics.fromJson(Map<String, dynamic> json) => ProjectAnalytics(
        totalTasks: (json['totalTasks'] ?? 0).toInt(),
        completedTasks: (json['completedTasks'] ?? 0).toInt(),
        inProgressTasks: (json['inProgressTasks'] ?? 0).toInt(),
        cpi: (json['cpi'] ?? 0).toDouble(),
        spi: (json['spi'] ?? 0).toDouble(),
        overallRisk: json['overallRisk'] ?? 'low',
      );
}

class ProjectFilesService extends ApiService {
  Future<List<ProjectFile>> getByProject(String projectId) async {
    try {
      final data = await get('/projects/$projectId/files');
      final list = data is List ? data : (data['files'] ?? data['data'] ?? []);
      return (list as List).map((e) => ProjectFile.fromJson(e)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> upload(String projectId, Uint8List bytes, String filename, String mimeType) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConstants.tokenKey) ?? '';
    final req = http.MultipartRequest(
      'POST', Uri.parse('${ApiConfig.baseUrl}/projects/$projectId/files'),
    );
    req.headers['Authorization'] = 'Bearer $token';
    req.files.add(http.MultipartFile.fromBytes('file', bytes, filename: filename));
    final res = await req.send().timeout(ApiConfig.timeout);
    if (res.statusCode != 200 && res.statusCode != 201) {
      throw Exception('Upload failed: ${res.statusCode}');
    }
  }
}

class ProjectAnalyticsService extends ApiService {
  Future<ProjectAnalytics?> getByProject(String projectId, {List<Map<String, dynamic>>? risks}) async {
    try {
      final results = await Future.wait([
        get('/projects/$projectId/finance/analytics/performance-indices').catchError((_) => <String, dynamic>{}),
        get('/projects/$projectId/finance/analytics/risk-assessment').catchError((_) => <String, dynamic>{}),
        get('/projects/$projectId/tasks').catchError((_) => <dynamic>[]),
      ]);
      final perf = results[0] as Map<String, dynamic>;
      final risk = results[1] as Map<String, dynamic>;
      final taskData = results[2];
      final tasks = taskData is List ? taskData : (taskData['tasks'] ?? taskData['data'] ?? []) as List;
      return ProjectAnalytics(
        totalTasks: (perf['totalTasks'] ?? tasks.length).toInt(),
        completedTasks: (perf['completedTasks'] ?? tasks.where((t) => t['status'] == 'completed').length).toInt(),
        inProgressTasks: (perf['inProgressTasks'] ?? tasks.where((t) => t['status'] == 'in-progress').length).toInt(),
        cpi: (perf['cpi'] ?? 0).toDouble(),
        spi: (perf['spi'] ?? 0).toDouble(),
        overallRisk: risk['overallRisk'] ?? 'low',
      );
    } catch (_) { return null; }
  }

  Future<Map<String, dynamic>> getBurndown(String projectId) async {
    try { return await get('/projects/$projectId/finance/analytics/burndown'); } catch (_) { return {}; }
  }

  Future<Map<String, dynamic>> getVelocity(String projectId) async {
    try { return await get('/projects/$projectId/finance/analytics/velocity'); } catch (_) { return {}; }
  }

  Future<Map<String, dynamic>> getResourceUtilization(String projectId) async {
    try { return await get('/projects/$projectId/finance/analytics/resource-utilization'); } catch (_) { return {}; }
  }

  Future<Map<String, dynamic>> getPerformanceIndices(String projectId) async {
    try { return await get('/projects/$projectId/finance/analytics/performance-indices'); } catch (_) { return {}; }
  }

  Future<Map<String, dynamic>> getRiskAssessment(String projectId) async {
    try { return await get('/projects/$projectId/finance/analytics/risk-assessment'); } catch (_) { return {}; }
  }
}

// ── Milestone ─────────────────────────────────────────────────────────────────

class ProjectMilestone {
  final String id, title, status;
  final DateTime dueDate;
  ProjectMilestone({required this.id, required this.title, required this.status, required this.dueDate});
  factory ProjectMilestone.fromJson(Map<String, dynamic> j) => ProjectMilestone(
    id: j['_id'] ?? '',
    title: j['name'] ?? j['title'] ?? '',
    status: j['status'] ?? 'pending',
    dueDate: DateTime.tryParse(j['dueDate'] ?? j['date'] ?? '') ?? DateTime.now(),
  );
}

class ProjectMilestoneService extends ApiService {
  Future<List<ProjectMilestone>> getByProject(String id, {List<Map<String, dynamic>>? embedded}) async {
    if (embedded != null) return embedded.map((e) => ProjectMilestone.fromJson(e)).toList();
    try {
      final data = await get('/projects/$id');
      final list = (data['milestones'] as List? ?? []);
      return list.map((e) => ProjectMilestone.fromJson(e)).toList();
    } catch (_) { return []; }
  }
}

// ── Risk ──────────────────────────────────────────────────────────────────────

class ProjectRisk {
  final String id, title, level, status;
  ProjectRisk({required this.id, required this.title, required this.level, required this.status});
  factory ProjectRisk.fromJson(Map<String, dynamic> j) => ProjectRisk(
    id: j['_id'] ?? '',
    title: j['title'] ?? j['description'] ?? '',
    level: j['severity'] ?? j['level'] ?? 'low',
    status: j['status'] ?? 'identified',
  );
}

class ProjectRiskService extends ApiService {
  Future<List<ProjectRisk>> getByProject(String id, {List<Map<String, dynamic>>? embedded}) async {
    if (embedded != null) return embedded.map((e) => ProjectRisk.fromJson(e)).toList();
    try {
      final data = await get('/projects/$id');
      final list = (data['risks'] as List? ?? []);
      return list.map((e) => ProjectRisk.fromJson(e)).toList();
    } catch (_) { return []; }
  }
}

// ── Budget Items & Approval ───────────────────────────────────────────────────

class BudgetItem {
  final String name, type;
  final double quantity, unitCost;
  BudgetItem({required this.name, required this.type, required this.quantity, required this.unitCost});
  double get total => quantity * unitCost;
  factory BudgetItem.fromJson(Map<String, dynamic> j) => BudgetItem(
    name: j['name'] ?? '',
    type: j['type'] ?? '',
    quantity: (j['quantity'] ?? 1).toDouble(),
    unitCost: (j['unitCost'] ?? j['unitPrice'] ?? j['allocatedAmount'] ?? 0).toDouble(),
  );
}

class BudgetApproval {
  final String action, userName, comment;
  final DateTime createdAt;
  BudgetApproval({required this.action, required this.userName, required this.comment, required this.createdAt});
  factory BudgetApproval.fromJson(Map<String, dynamic> j) {
    final user = j['approvedBy'] ?? j['user'];
    String name = '';
    if (user is Map) name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
    return BudgetApproval(
      action: j['action'] ?? j['status'] ?? '',
      userName: name.isNotEmpty ? name : (j['userName'] ?? ''),
      comment: j['comment'] ?? j['notes'] ?? '',
      createdAt: DateTime.tryParse(j['createdAt'] ?? j['date'] ?? '') ?? DateTime.now(),
    );
  }
}

class ProjectBudgetDetailService extends ApiService {
  Future<({List<BudgetItem> items, List<BudgetApproval> approvals})> getDetail(String projectId) async {
    try {
      final data = await get('/projects/$projectId/budget');
      final obj = data is List ? (data.isEmpty ? <String, dynamic>{} : data[0] as Map<String, dynamic>) : (data as Map<String, dynamic>);
      final List<BudgetItem> items = ((obj['items'] ?? obj['budgetItems'] ?? obj['categories'] ?? []) as List)
          .map<BudgetItem>((e) => BudgetItem.fromJson(e as Map<String, dynamic>)).toList();
      final List<BudgetApproval> approvals = ((obj['approvalHistory'] ?? obj['approvals'] ?? []) as List)
          .map<BudgetApproval>((e) => BudgetApproval.fromJson(e as Map<String, dynamic>)).toList();
      return (items: items, approvals: approvals);
    } catch (_) { return (items: <BudgetItem>[], approvals: <BudgetApproval>[]); }
  }
}

// ── Project Ledger ────────────────────────────────────────────────────────────

class ProjectLedgerService extends ApiService {
  Future<Map<String, dynamic>> getFinancialDashboard(String projectId) async {
    try { return await get('/project-ledger/$projectId/financial-dashboard'); } catch (_) { return {}; }
  }

  Future<List<Map<String, dynamic>>> getJournalEntries(String projectId) async {
    try {
      final data = await get('/project-ledger/$projectId/journal-entries');
      final list = data is List ? data : (data['entries'] ?? data['data'] ?? []);
      return (list as List).cast<Map<String, dynamic>>();
    } catch (_) { return []; }
  }

  Future<List<Map<String, dynamic>>> getLedgerEntries(String projectId) async {
    try {
      final data = await get('/project-ledger/$projectId/ledger-entries');
      final list = data is List ? data : (data['entries'] ?? data['data'] ?? []);
      return (list as List).cast<Map<String, dynamic>>();
    } catch (_) { return []; }
  }

  Future<Map<String, dynamic>> getBudgetActual(String projectId) async {
    try { return await get('/project-ledger/$projectId/budget-actual'); } catch (_) { return {}; }
  }

  Future<Map<String, dynamic>> getProfitability(String projectId) async {
    try { return await get('/project-ledger/$projectId/profitability'); } catch (_) { return {}; }
  }

  Future<Map<String, dynamic>> getTrialBalance(String projectId) async {
    try { return await get('/project-ledger/$projectId/trial-balance'); } catch (_) { return {}; }
  }
}

// ── Finance ───────────────────────────────────────────────────────────────────

class FinanceReport {
  final String type;
  final Map<String, dynamic> data;
  FinanceReport({required this.type, required this.data});
}

class ProjectFinanceService extends ApiService {
  Future<Map<String, dynamic>> fetchReport(String projectId, String type) async {
    try {
      final data = await get('/projects/$projectId/finance/$type');
      return data is Map<String, dynamic> ? data : {'data': data};
    } catch (_) { return {}; }
  }
}

// ── Permissions ───────────────────────────────────────────────────────────────

class ProjectPermission {
  final String userId, userName, role;
  final List<String> permissions;
  ProjectPermission({required this.userId, required this.userName, required this.role, required this.permissions});
  factory ProjectPermission.fromJson(Map<String, dynamic> j) {
    final user = j['user'] ?? j['employee'];
    String name = '';
    if (user is Map) name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
    return ProjectPermission(
      userId: (user is Map ? user['_id'] : j['userId']) ?? '',
      userName: name.isNotEmpty ? name : (j['userName'] ?? ''),
      role: j['role'] ?? 'member',
      permissions: (j['permissions'] as List? ?? []).map((e) => e.toString()).toList(),
    );
  }
}

class ProjectPermissionsService extends ApiService {
  Future<List<ProjectPermission>> getByProject(String id) async {
    try {
      final data = await get('/projects/$id/permissions');
      final list = data is List ? data : (data['permissions'] ?? data['members'] ?? data['data'] ?? []);
      return (list as List).map((e) => ProjectPermission.fromJson(e)).toList();
    } catch (_) { return []; }
  }
}
