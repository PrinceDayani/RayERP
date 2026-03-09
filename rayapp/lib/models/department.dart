class Department {
  final String id;
  final String name;
  final String description;
  final String location;
  final String status;
  final double budget;
  final int employeeCount;
  final DeptManager? manager;
  final List<String> permissions;

  Department({
    required this.id,
    required this.name,
    required this.description,
    required this.location,
    required this.status,
    required this.budget,
    required this.employeeCount,
    this.manager,
    this.permissions = const [],
  });

  factory Department.fromJson(Map<String, dynamic> j) => Department(
        id: j['_id'] ?? '',
        name: j['name'] ?? '',
        description: j['description'] ?? '',
        location: j['location'] ?? '',
        status: j['status'] ?? 'active',
        budget: (j['budget'] as num?)?.toDouble() ?? 0,
        employeeCount: (j['employeeCount'] as num?)?.toInt() ?? 0,
        manager: j['manager'] != null && j['manager'] is Map
            ? DeptManager.fromJson(j['manager'])
            : null,
        permissions: j['permissions'] != null ? List<String>.from(j['permissions']) : [],
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'description': description,
        'location': location,
        'status': status,
        'budget': budget,
      };
}

class DeptManager {
  final String id;
  final String name;
  final String email;

  DeptManager({required this.id, required this.name, required this.email});

  factory DeptManager.fromJson(Map<String, dynamic> j) => DeptManager(
        id: j['_id'] ?? '',
        name: '${j['firstName'] ?? ''} ${j['lastName'] ?? ''}'.trim(),
        email: j['email'] ?? '',
      );
}

class DepartmentStats {
  final int total;
  final int active;
  final int totalEmployees;
  final double totalBudget;
  final double avgTeamSize;

  DepartmentStats({
    required this.total,
    required this.active,
    required this.totalEmployees,
    required this.totalBudget,
    required this.avgTeamSize,
  });

  factory DepartmentStats.fromJson(Map<String, dynamic> j) => DepartmentStats(
        total: (j['total'] as num?)?.toInt() ?? 0,
        active: (j['active'] as num?)?.toInt() ?? 0,
        totalEmployees: (j['totalEmployees'] as num?)?.toInt() ?? 0,
        totalBudget: (j['totalBudget'] as num?)?.toDouble() ?? 0,
        avgTeamSize: (j['avgTeamSize'] as num?)?.toDouble() ?? 0,
      );
}
