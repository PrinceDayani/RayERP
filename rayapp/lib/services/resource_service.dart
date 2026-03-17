import '../models/employee.dart';
import 'api_service.dart';

// ── Models ────────────────────────────────────────────────────────────────

class ResourceAllocation {
  final String id;
  final String employeeId;
  final String employeeName;
  final String projectId;
  final String projectName;
  final String projectStatus;
  final DateTime startDate;
  final DateTime endDate;
  final double allocatedHours;
  final double utilizationPct;
  final String role;
  final String status; // active | completed | planned | on_hold
  final String priority;
  final String? notes;
  final double billableHours;
  final double actualHours;

  ResourceAllocation({
    required this.id,
    required this.employeeId,
    required this.employeeName,
    required this.projectId,
    required this.projectName,
    required this.projectStatus,
    required this.startDate,
    required this.endDate,
    required this.allocatedHours,
    required this.utilizationPct,
    required this.role,
    required this.status,
    required this.priority,
    this.notes,
    this.billableHours = 0,
    this.actualHours = 0,
  });

  factory ResourceAllocation.fromJson(Map<String, dynamic> j) {
    final emp = j['employee'];
    final proj = j['project'];
    final empId = emp is Map ? (emp['_id'] ?? '') : (emp ?? '');
    final empName = emp is Map
        ? '${emp['firstName'] ?? ''} ${emp['lastName'] ?? ''}'.trim()
        : '';
    final projId = proj is Map ? (proj['_id'] ?? '') : (proj ?? '');
    final projName = proj is Map ? (proj['name'] ?? '') : '';
    final projStatus = proj is Map ? (proj['status'] ?? '') : '';
    return ResourceAllocation(
      id: j['_id'] ?? '',
      employeeId: empId.toString(),
      employeeName: empName,
      projectId: projId.toString(),
      projectName: projName,
      projectStatus: projStatus,
      startDate: DateTime.tryParse(j['startDate'] ?? '') ?? DateTime.now(),
      endDate: DateTime.tryParse(j['endDate'] ?? '') ?? DateTime.now(),
      allocatedHours: (j['allocatedHours'] ?? 0).toDouble(),
      utilizationPct: (j['utilizationRate'] ?? 0).toDouble(),
      role: j['role'] ?? '',
      status: j['status'] ?? 'planned',
      priority: j['priority'] ?? 'medium',
      notes: j['notes'],
      billableHours: (j['billableHours'] ?? 0).toDouble(),
      actualHours: (j['actualHours'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
        'employee': employeeId,
        'project': projectId,
        'allocatedHours': allocatedHours,
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
        'role': role,
        'status': status,
        'priority': priority,
        if (notes != null) 'notes': notes,
        'billableHours': billableHours,
        'actualHours': actualHours,
      };
}

class EmployeeCapacity {
  final String employeeId;
  final String employeeName;
  final String position;
  final String? department;
  final int capacity;
  final int allocated;
  final int available;
  final double utilizationPct;
  final String status; // available | partial | full | over
  final List<Map<String, dynamic>> allocations;
  final int overAllocation;

  EmployeeCapacity({
    required this.employeeId,
    required this.employeeName,
    required this.position,
    this.department,
    required this.capacity,
    required this.allocated,
    required this.available,
    required this.utilizationPct,
    required this.status,
    required this.allocations,
    required this.overAllocation,
  });

  factory EmployeeCapacity.fromJson(Map<String, dynamic> j) {
    final emp = j['employee'];
    return EmployeeCapacity(
      employeeId: emp is Map ? (emp['_id'] ?? '') : '',
      employeeName: emp is Map ? (emp['name'] ?? '') : '',
      position: emp is Map ? (emp['position'] ?? '') : '',
      department: emp is Map ? emp['department'] : null,
      capacity: (j['capacity'] ?? 40).toInt(),
      allocated: (j['allocated'] ?? 0).toInt(),
      available: (j['available'] ?? 0).toInt(),
      utilizationPct: (j['utilizationRate'] ?? 0).toDouble(),
      status: j['status'] ?? 'available',
      allocations: (j['allocations'] as List? ?? []).map((e) => Map<String, dynamic>.from(e)).toList(),
      overAllocation: (j['overAllocation'] ?? 0).toInt(),
    );
  }
}

class ResourceConflict {
  final String employeeId;
  final String employeeName;
  final List<Map<String, dynamic>> conflicts;
  final int totalConflicts;
  final double totalOverallocation;

  ResourceConflict({
    required this.employeeId,
    required this.employeeName,
    required this.conflicts,
    required this.totalConflicts,
    required this.totalOverallocation,
  });

  factory ResourceConflict.fromJson(Map<String, dynamic> j) {
    final emp = j['employee'];
    return ResourceConflict(
      employeeId: j['_id'] ?? '',
      employeeName: emp is Map ? (emp['firstName'] != null
          ? '${emp['firstName']} ${emp['lastName']}'.trim()
          : (emp['name'] ?? '')) : '',
      conflicts: (j['conflicts'] as List? ?? []).map((e) => Map<String, dynamic>.from(e)).toList(),
      totalConflicts: (j['totalConflicts'] ?? 0).toInt(),
      totalOverallocation: (j['totalOverallocation'] ?? 0).toDouble(),
    );
  }
}

class EmployeeSummary {
  final String id;
  final String name;
  final String position;
  final String? department;
  final int totalHours;
  final int bookedHours;
  final int freeHours;
  final int utilizationPct;
  final String status;
  final List<Map<String, dynamic>> allocations;

  EmployeeSummary({
    required this.id,
    required this.name,
    required this.position,
    this.department,
    required this.totalHours,
    required this.bookedHours,
    required this.freeHours,
    required this.utilizationPct,
    required this.status,
    required this.allocations,
  });

  factory EmployeeSummary.fromJson(Map<String, dynamic> j) => EmployeeSummary(
        id: j['_id'] ?? '',
        name: j['name'] ?? '',
        position: j['position'] ?? '',
        department: j['department'],
        totalHours: (j['totalHours'] ?? 40).toInt(),
        bookedHours: (j['bookedHours'] ?? 0).toInt(),
        freeHours: (j['freeHours'] ?? 0).toInt(),
        utilizationPct: (j['utilizationPercentage'] ?? 0).toInt(),
        status: j['status'] ?? 'available',
        allocations: (j['allocations'] as List? ?? []).map((e) => Map<String, dynamic>.from(e)).toList(),
      );
}

class SkillGapResult {
  final String employeeId;
  final String employeeName;
  final String position;
  final String? department;
  final List<String> missingSkills;
  final List<Map<String, dynamic>> weakSkills;
  final List<Map<String, dynamic>> strongSkills;

  SkillGapResult({
    required this.employeeId,
    required this.employeeName,
    required this.position,
    this.department,
    required this.missingSkills,
    required this.weakSkills,
    required this.strongSkills,
  });

  factory SkillGapResult.fromJson(Map<String, dynamic> j) {
    final emp = j['employee'];
    return SkillGapResult(
      employeeId: emp is Map ? (emp['_id'] ?? '') : '',
      employeeName: emp is Map ? (emp['name'] ?? '') : '',
      position: emp is Map ? (emp['position'] ?? '') : '',
      department: emp is Map ? emp['department']?.toString() : null,
      missingSkills: (j['missingSkills'] as List? ?? []).map((e) => e.toString()).toList(),
      weakSkills: (j['weakSkills'] as List? ?? []).map((e) => Map<String, dynamic>.from(e)).toList(),
      strongSkills: (j['strongSkills'] as List? ?? []).map((e) => Map<String, dynamic>.from(e)).toList(),
    );
  }
}

class ProjectSkillMatch {
  final String employeeId;
  final String employeeName;
  final String position;
  final int matchPercentage;
  final List<Map<String, dynamic>> matchedSkills;
  final List<String> missingSkills;

  ProjectSkillMatch({
    required this.employeeId,
    required this.employeeName,
    required this.position,
    required this.matchPercentage,
    required this.matchedSkills,
    required this.missingSkills,
  });

  factory ProjectSkillMatch.fromJson(Map<String, dynamic> j) {
    final emp = j['employee'];
    return ProjectSkillMatch(
      employeeId: emp is Map ? (emp['_id'] ?? '') : '',
      employeeName: emp is Map ? (emp['name'] ?? '') : '',
      position: emp is Map ? (emp['position'] ?? '') : '',
      matchPercentage: (j['matchPercentage'] ?? 0).toInt(),
      matchedSkills: (j['matchedSkills'] as List? ?? []).map((e) => Map<String, dynamic>.from(e)).toList(),
      missingSkills: (j['missingSkills'] as List? ?? []).map((e) => e.toString()).toList(),
    );
  }
}

class SkillDistribution {
  final String skill;
  final int beginner;
  final int intermediate;
  final int advanced;
  final int expert;
  final int total;

  SkillDistribution({
    required this.skill,
    required this.beginner,
    required this.intermediate,
    required this.advanced,
    required this.expert,
    required this.total,
  });

  factory SkillDistribution.fromJson(Map<String, dynamic> j) {
    final levels = j['levels'] as Map<String, dynamic>? ?? {};
    return SkillDistribution(
      skill: j['skill'] ?? '',
      beginner: (levels['Beginner'] ?? 0).toInt(),
      intermediate: (levels['Intermediate'] ?? 0).toInt(),
      advanced: (levels['Advanced'] ?? 0).toInt(),
      expert: (levels['Expert'] ?? 0).toInt(),
      total: (j['totalEmployees'] ?? 0).toInt(),
    );
  }
}

// ── Service ───────────────────────────────────────────────────────────────

class ResourceService extends ApiService {
  // ── Allocations ──────────────────────────────────────────────────────────

  Future<List<ResourceAllocation>> getAllocations({
    String? projectId,
    String? employeeId,
    String? status,
    String? startDate,
    String? endDate,
  }) async {
    final params = <String, String>{};
    if (projectId != null) params['projectId'] = projectId;
    if (employeeId != null) params['employeeId'] = employeeId;
    if (status != null) params['status'] = status;
    if (startDate != null) params['startDate'] = startDate;
    if (endDate != null) params['endDate'] = endDate;
    final query = params.isNotEmpty
        ? '?${params.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&')}'
        : '';
    final data = await get('/resources/allocations$query');
    return (data as List).map((e) => ResourceAllocation.fromJson(e)).toList();
  }

  Future<ResourceAllocation> createAllocation(Map<String, dynamic> body) async {
    final data = await post('/resources/allocations', body);
    final alloc = data['allocation'] ?? data;
    return ResourceAllocation.fromJson(alloc);
  }

  Future<ResourceAllocation> updateAllocation(String id, Map<String, dynamic> body) async {
    final data = await put('/resources/allocations/$id', body);
    return ResourceAllocation.fromJson(data);
  }

  Future<void> deleteAllocation(String id) async {
    await delete('/resources/allocations/$id');
  }

  // ── Capacity ─────────────────────────────────────────────────────────────

  Future<List<EmployeeCapacity>> getCapacities({
    required String startDate,
    required String endDate,
    String? department,
  }) async {
    var url = '/resources/capacity-planning?startDate=${Uri.encodeComponent(startDate)}&endDate=${Uri.encodeComponent(endDate)}';
    if (department != null) url += '&department=${Uri.encodeComponent(department)}';
    final data = await get(url);
    return (data as List).map((e) => EmployeeCapacity.fromJson(e)).toList();
  }

  // ── Conflicts ────────────────────────────────────────────────────────────

  Future<List<ResourceConflict>> getConflicts({String? employeeId}) async {
    var url = '/resources/allocation-conflicts';
    if (employeeId != null) url += '?employeeId=${Uri.encodeComponent(employeeId)}';
    final data = await get(url);
    return (data as List).map((e) => ResourceConflict.fromJson(e)).toList();
  }

  // ── Employee Summary ─────────────────────────────────────────────────────

  Future<List<EmployeeSummary>> getEmployeeSummary({String? departmentId}) async {
    var url = '/resources/employee-summary';
    if (departmentId != null) url += '?departmentId=${Uri.encodeComponent(departmentId)}';
    final data = await get(url);
    return (data as List).map((e) => EmployeeSummary.fromJson(e)).toList();
  }

  // ── Skill Matrix ─────────────────────────────────────────────────────────

  Future<List<Employee>> getAllEmployees() async {
    final data = await get('/employees');
    return (data as List).map((e) => Employee.fromJson(e)).toList();
  }

  Future<void> updateSkill(String employeeId, String skill, String? level, {int? yearsOfExperience}) async {
    await put('/resources/skill-matrix/$employeeId/skills', {
      'skill': skill,
      'level': level ?? '',
      'yearsOfExperience': ?yearsOfExperience,
    });
  }

  // ── Skill Gap Analysis ───────────────────────────────────────────────────

  Future<List<SkillGapResult>> getSkillGapAnalysis({String? department, String? position}) async {
    var url = '/resources/skill-gap-analysis';
    final params = <String>[];
    if (department != null) params.add('department=${Uri.encodeComponent(department)}');
    if (position != null) params.add('position=${Uri.encodeComponent(position)}');
    if (params.isNotEmpty) url += '?${params.join('&')}';
    final data = await get(url);
    return (data as List).map((e) => SkillGapResult.fromJson(e)).toList();
  }

  // ── Project Skill Match ──────────────────────────────────────────────────

  Future<List<ProjectSkillMatch>> getProjectSkillMatch(String projectId) async {
    final data = await get('/resources/project-skill-match/$projectId');
    return (data as List).map((e) => ProjectSkillMatch.fromJson(e)).toList();
  }

  // ── Skill Distribution ───────────────────────────────────────────────────

  Future<List<SkillDistribution>> getSkillDistribution() async {
    final data = await get('/resources/skill-distribution');
    return (data as List).map((e) => SkillDistribution.fromJson(e)).toList();
  }

  Future<Map<String, dynamic>> getSkillStrength() async {
    final data = await get('/resources/skill-strength');
    return Map<String, dynamic>.from(data);
  }

  // ── Validation ───────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> validateAllocation({
    required String employeeId,
    required double allocatedHours,
    required String startDate,
    required String endDate,
    String? excludeId,
  }) async {
    final body = <String, dynamic>{
      'employeeId': employeeId,
      'allocatedHours': allocatedHours,
      'startDate': startDate,
      'endDate': endDate,
      'excludeId': ?excludeId,
    };
    final data = await post('/resources/validate-allocation', body);
    return Map<String, dynamic>.from(data);
  }

  // ── Available count (derived from employee summary) ──────────────────────

  Future<int> getAvailableCount() async {
    try {
      final summaries = await getEmployeeSummary();
      return summaries.where((s) => s.status == 'available').length;
    } catch (_) {
      return 0;
    }
  }

  Future<int> getSkillGapsCount() async {
    try {
      final gaps = await getSkillGapAnalysis();
      return gaps.where((g) => g.missingSkills.isNotEmpty || g.weakSkills.isNotEmpty).length;
    } catch (_) {
      return 0;
    }
  }
}
