class ProjectMember {
  final String id;
  final String firstName;
  final String lastName;

  ProjectMember({required this.id, required this.firstName, required this.lastName});

  String get name => '$firstName $lastName'.trim();

  factory ProjectMember.fromJson(dynamic json) {
    if (json is Map<String, dynamic>) {
      return ProjectMember(
        id: json['_id'] ?? '',
        firstName: json['firstName'] ?? '',
        lastName: json['lastName'] ?? '',
      );
    }
    return ProjectMember(id: json.toString(), firstName: '', lastName: '');
  }
}

class Project {
  final String id;
  final String name;
  final String description;
  final String status;
  final String priority;
  final DateTime startDate;
  final DateTime endDate;
  final double budget;
  final double spentBudget;
  final String currency;
  final int progress;
  final String? client;
  final List<ProjectMember> team;
  final List<ProjectMember> managers;
  final List<String> tags;
  final List<String> requiredSkills;
  final List<Map<String, dynamic>> milestones;
  final List<Map<String, dynamic>> risks;

  Project({
    required this.id,
    required this.name,
    required this.description,
    required this.status,
    required this.priority,
    required this.startDate,
    required this.endDate,
    required this.budget,
    required this.spentBudget,
    required this.currency,
    required this.progress,
    this.client,
    this.team = const [],
    this.managers = const [],
    this.tags = const [],
    this.requiredSkills = const [],
    this.milestones = const [],
    this.risks = const [],
  });

  factory Project.fromJson(Map<String, dynamic> json) => Project(
        id: json['_id'] ?? '',
        name: json['name'] ?? '',
        description: json['description'] ?? '',
        status: json['status'] ?? 'planning',
        priority: json['priority'] ?? 'medium',
        startDate: DateTime.tryParse(json['startDate'] ?? '') ?? DateTime.now(),
        endDate: DateTime.tryParse(json['endDate'] ?? '') ?? DateTime.now(),
        budget: (json['budget'] ?? 0).toDouble(),
        spentBudget: (json['spentBudget'] ?? 0).toDouble(),
        currency: json['currency'] ?? 'USD',
        progress: (json['progress'] ?? 0).toInt(),
        client: json['client'],
        team: (json['team'] as List? ?? []).map((e) => ProjectMember.fromJson(e)).toList(),
        managers: (json['managers'] as List? ?? []).map((e) => ProjectMember.fromJson(e)).toList(),
        tags: (json['tags'] as List? ?? []).map((e) => e.toString()).toList(),
        requiredSkills: (json['requiredSkills'] as List? ?? []).map((e) => e.toString()).toList(),
        milestones: (json['milestones'] as List? ?? []).map((e) => Map<String, dynamic>.from(e)).toList(),
        risks: (json['risks'] as List? ?? []).map((e) => Map<String, dynamic>.from(e)).toList(),
      );
}

class ProjectStats {
  final int totalProjects;
  final int activeProjects;
  final int completedProjects;
  final int atRiskProjects;
  final int overdueTasks;

  ProjectStats({
    required this.totalProjects,
    required this.activeProjects,
    required this.completedProjects,
    required this.atRiskProjects,
    required this.overdueTasks,
  });

  factory ProjectStats.fromJson(Map<String, dynamic> json) => ProjectStats(
        totalProjects: (json['totalProjects'] ?? 0).toInt(),
        activeProjects: (json['activeProjects'] ?? 0).toInt(),
        completedProjects: (json['completedProjects'] ?? 0).toInt(),
        atRiskProjects: (json['atRiskProjects'] ?? 0).toInt(),
        overdueTasks: (json['overdueTasks'] ?? 0).toInt(),
      );
}
