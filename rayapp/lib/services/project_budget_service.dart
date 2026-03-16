import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../utils/constants.dart';
import 'api_service.dart';

// ── Standalone Budget (org-wide, not project-scoped) ─────────────────────────

class Budget {
  final String id;
  final String? projectId;
  final String? departmentId;
  final String? projectName;
  final String? departmentName;
  final String? budgetName;
  final int fiscalYear;
  final String fiscalPeriod;
  final double totalBudget;
  final double actualSpent;
  final double remainingBudget;
  final double utilizationPercentage;
  final String currency;
  final String status;
  final String budgetType;
  final List<BudgetCategory> categories;
  final List<BudgetApprovalEntry> approvals;
  final DateTime createdAt;

  Budget({
    required this.id,
    this.projectId,
    this.departmentId,
    this.projectName,
    this.departmentName,
    this.budgetName,
    required this.fiscalYear,
    required this.fiscalPeriod,
    required this.totalBudget,
    required this.actualSpent,
    required this.remainingBudget,
    required this.utilizationPercentage,
    required this.currency,
    required this.status,
    required this.budgetType,
    required this.categories,
    required this.approvals,
    required this.createdAt,
  });

  String get displayName =>
      budgetName?.isNotEmpty == true
          ? budgetName!
          : projectName?.isNotEmpty == true
              ? projectName!
              : departmentName?.isNotEmpty == true
                  ? departmentName!
                  : 'Budget #${id.substring(id.length > 6 ? id.length - 6 : 0)}';

  factory Budget.fromJson(Map<String, dynamic> j) {
    final cats = (j['categories'] as List? ?? [])
        .map((c) => BudgetCategory.fromJson(c))
        .toList();
    final approvs = (j['approvals'] as List? ?? [])
        .map((a) => BudgetApprovalEntry.fromJson(a))
        .toList();
    return Budget(
      id: j['_id'] ?? '',
      projectId: j['projectId']?.toString(),
      departmentId: j['departmentId']?.toString(),
      projectName: j['projectName'],
      departmentName: j['departmentName'],
      budgetName: j['budgetName'],
      fiscalYear: (j['fiscalYear'] ?? DateTime.now().year).toInt(),
      fiscalPeriod: j['fiscalPeriod'] ?? 'Q1',
      totalBudget: (j['totalBudget'] ?? 0).toDouble(),
      actualSpent: (j['actualSpent'] ?? 0).toDouble(),
      remainingBudget: (j['remainingBudget'] ?? 0).toDouble(),
      utilizationPercentage: (j['utilizationPercentage'] ?? 0).toDouble(),
      currency: j['currency'] ?? 'USD',
      status: j['status'] ?? 'draft',
      budgetType: j['budgetType'] ?? 'project',
      categories: cats,
      approvals: approvs,
      createdAt: DateTime.tryParse(j['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}

class BudgetApprovalEntry {
  final String userId;
  final String userName;
  final String status;
  final String? comments;
  final DateTime? approvedAt;

  BudgetApprovalEntry({
    required this.userId,
    required this.userName,
    required this.status,
    this.comments,
    this.approvedAt,
  });

  factory BudgetApprovalEntry.fromJson(Map<String, dynamic> j) => BudgetApprovalEntry(
        userId: j['userId']?.toString() ?? '',
        userName: j['userName'] ?? '',
        status: j['status'] ?? 'pending',
        comments: j['comments'],
        approvedAt: DateTime.tryParse(j['approvedAt'] ?? ''),
      );
}

class BudgetSummary {
  final int totalBudgets;
  final double totalBudgetAmount;
  final double totalSpent;
  final double totalRemaining;
  final double averageUtilization;
  final Map<String, int> statusBreakdown;
  final Map<String, dynamic> categoryBreakdown;

  BudgetSummary({
    required this.totalBudgets,
    required this.totalBudgetAmount,
    required this.totalSpent,
    required this.totalRemaining,
    required this.averageUtilization,
    required this.statusBreakdown,
    required this.categoryBreakdown,
  });

  factory BudgetSummary.fromJson(Map<String, dynamic> j) => BudgetSummary(
        totalBudgets: (j['totalBudgets'] ?? 0).toInt(),
        totalBudgetAmount: (j['totalBudgetAmount'] ?? 0).toDouble(),
        totalSpent: (j['totalSpent'] ?? 0).toDouble(),
        totalRemaining: (j['totalRemaining'] ?? 0).toDouble(),
        averageUtilization: (j['averageUtilization'] ?? 0).toDouble(),
        statusBreakdown: (j['statusBreakdown'] as Map<String, dynamic>? ?? {})
            .map((k, v) => MapEntry(k, (v as num).toInt())),
        categoryBreakdown: j['categoryBreakdown'] as Map<String, dynamic>? ?? {},
      );
}

class BudgetService extends ApiService {
  Future<({List<Budget> budgets, int total, int pages})> getAll({
    String? status,
    String? budgetType,
    int? fiscalYear,
    int page = 1,
    int limit = 20,
  }) async {
    final params = <String>['page=$page', 'limit=$limit'];
    if (status != null && status != 'all') params.add('status=$status');
    if (budgetType != null && budgetType != 'all') params.add('budgetType=$budgetType');
    if (fiscalYear != null) params.add('fiscalYear=$fiscalYear');
    try {
      final data = await get('/budget/all?${params.join('&')}');
      final raw = data is Map ? data : <String, dynamic>{};
      final list = (raw['data'] ?? raw['budgets'] ?? (data is List ? data : [])) as List;
      final pagination = raw['pagination'] as Map<String, dynamic>? ?? {};
      return (
        budgets: list.map((e) => Budget.fromJson(e as Map<String, dynamic>)).toList(),
        total: ((pagination['total'] ?? list.length) as num).toInt(),
        pages: ((pagination['pages'] ?? 1) as num).toInt(),
      );
    } catch (_) {
      return (budgets: <Budget>[], total: 0, pages: 0);
    }
  }

  Future<Budget?> getById(String id) async {
    try {
      final data = await get('/budget/$id');
      final obj = data is Map ? (data['data'] ?? data) : data;
      return Budget.fromJson(obj as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<BudgetSummary?> getSummary({String? projectId, int? fiscalYear}) async {
    try {
      final params = <String>[];
      if (projectId != null) params.add('projectId=$projectId');
      if (fiscalYear != null) params.add('fiscalYear=$fiscalYear');
      final q = params.isEmpty ? '' : '?${params.join('&')}';
      final data = await get('/budget/analytics$q');
      final obj = data is Map ? (data['data'] ?? data) : data;
      return BudgetSummary.fromJson(obj as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>> getTracking(String id) async {
    try {
      final data = await get('/budget/$id/track');
      return data is Map ? (data['data'] ?? data) as Map<String, dynamic> : {};
    } catch (_) {
      return {};
    }
  }

  Future<Budget> create(Map<String, dynamic> body) async {
    final data = await post('/budget/create', body);
    final obj = data is Map ? (data['data'] ?? data) : data;
    return Budget.fromJson(obj as Map<String, dynamic>);
  }

  Future<Budget> update(String id, Map<String, dynamic> body) async {
    final data = await put('/budget/$id', body);
    final obj = data is Map ? (data['data'] ?? data) : data;
    return Budget.fromJson(obj as Map<String, dynamic>);
  }

  Future<void> action(String id, String action, {String? comments}) =>
      post('/budget/$id/$action', comments != null ? {'comments': comments} : {});

  Future<void> allocate(String id, String categoryName, double amount, String categoryType) =>
      post('/budget/$id/allocate', {
        'categoryName': categoryName,
        'allocatedAmount': amount,
        'categoryType': categoryType,
      });
}

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
