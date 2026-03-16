class ApprovalUser {
  final String id;
  final String name;
  final String email;

  ApprovalUser({required this.id, required this.name, required this.email});

  factory ApprovalUser.fromJson(dynamic json) {
    if (json is Map) {
      return ApprovalUser(
        id: json['_id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        email: json['email']?.toString() ?? '',
      );
    }
    return ApprovalUser(id: json?.toString() ?? '', name: '', email: '');
  }
}

class ApprovalLevel {
  final int level;
  final String approverRole;
  final String status;
  final ApprovalUser? approvedBy;
  final DateTime? approvedAt;
  final String? comments;

  ApprovalLevel({
    required this.level,
    required this.approverRole,
    required this.status,
    this.approvedBy,
    this.approvedAt,
    this.comments,
  });

  factory ApprovalLevel.fromJson(Map<String, dynamic> json) => ApprovalLevel(
        level: (json['level'] ?? 1).toInt(),
        approverRole: json['approverRole']?.toString() ?? '',
        status: json['status']?.toString() ?? 'PENDING',
        approvedBy: json['approvedBy'] != null ? ApprovalUser.fromJson(json['approvedBy']) : null,
        approvedAt: DateTime.tryParse(json['approvedAt']?.toString() ?? ''),
        comments: json['comments']?.toString(),
      );
}

class ApprovalRequest {
  final String id;
  final String entityType;
  final String entityId;
  final String title;
  final String description;
  final double amount;
  final String status;
  final String priority;
  final int currentLevel;
  final int totalLevels;
  final ApprovalUser? requestedBy;
  final List<ApprovalLevel> approvalLevels;
  final DateTime requestedAt;
  final DateTime? completedAt;
  final Map<String, dynamic> metadata;

  ApprovalRequest({
    required this.id,
    required this.entityType,
    required this.entityId,
    required this.title,
    required this.description,
    required this.amount,
    required this.status,
    required this.priority,
    required this.currentLevel,
    required this.totalLevels,
    this.requestedBy,
    required this.approvalLevels,
    required this.requestedAt,
    this.completedAt,
    this.metadata = const {},
  });

  factory ApprovalRequest.fromJson(Map<String, dynamic> json) => ApprovalRequest(
        id: json['_id']?.toString() ?? '',
        entityType: json['entityType']?.toString() ?? '',
        entityId: json['entityId']?.toString() ?? '',
        title: json['title']?.toString() ?? '',
        description: json['description']?.toString() ?? '',
        amount: (json['amount'] ?? 0).toDouble(),
        status: json['status']?.toString() ?? 'PENDING',
        priority: json['priority']?.toString() ?? 'LOW',
        currentLevel: (json['currentLevel'] ?? 1).toInt(),
        totalLevels: (json['totalLevels'] ?? 1).toInt(),
        requestedBy: json['requestedBy'] != null ? ApprovalUser.fromJson(json['requestedBy']) : null,
        approvalLevels: (json['approvalLevels'] as List? ?? [])
            .map((e) => ApprovalLevel.fromJson(Map<String, dynamic>.from(e)))
            .toList(),
        requestedAt: DateTime.tryParse(json['requestedAt']?.toString() ?? '') ?? DateTime.now(),
        completedAt: DateTime.tryParse(json['completedAt']?.toString() ?? ''),
        metadata: json['metadata'] is Map ? Map<String, dynamic>.from(json['metadata']) : {},
      );
}

class ApprovalStats {
  final int pending;
  final int underReview;
  final int approvedToday;
  final double totalAmount;

  ApprovalStats({
    required this.pending,
    required this.underReview,
    required this.approvedToday,
    required this.totalAmount,
  });

  factory ApprovalStats.fromJson(Map<String, dynamic> json) => ApprovalStats(
        pending: (json['pending'] ?? 0).toInt(),
        underReview: (json['underReview'] ?? 0).toInt(),
        approvedToday: (json['approvedToday'] ?? 0).toInt(),
        totalAmount: (json['totalAmount'] ?? 0).toDouble(),
      );
}
