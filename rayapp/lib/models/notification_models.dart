class AppNotification {
  final String id;
  final String type;
  final String title;
  final String message;
  final bool read;
  final String priority;
  final String? actionUrl;
  final DateTime createdAt;
  final DateTime? readAt;

  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.read,
    required this.priority,
    this.actionUrl,
    required this.createdAt,
    this.readAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> j) => AppNotification(
        id: j['_id'] ?? '',
        type: j['type'] ?? 'info',
        title: j['title'] ?? '',
        message: j['message'] ?? '',
        read: j['read'] ?? false,
        priority: j['priority'] ?? 'medium',
        actionUrl: j['actionUrl'],
        createdAt: j['createdAt'] != null ? DateTime.parse(j['createdAt']).toLocal() : DateTime.now(),
        readAt: j['readAt'] != null ? DateTime.parse(j['readAt']).toLocal() : null,
      );

  AppNotification copyWith({bool? read}) => AppNotification(
        id: id,
        type: type,
        title: title,
        message: message,
        read: read ?? this.read,
        priority: priority,
        actionUrl: actionUrl,
        createdAt: createdAt,
        readAt: readAt,
      );
}

class NotificationSettings {
  bool emailNotifications;
  bool pushNotifications;
  bool soundEnabled;
  bool orderNotifications;
  bool inventoryAlerts;
  bool projectUpdates;
  bool taskReminders;
  bool budgetAlerts;
  bool dailyReports;
  bool weeklyReports;
  bool monthlyReports;
  bool systemAlerts;
  bool securityAlerts;
  bool maintenanceNotices;

  NotificationSettings({
    this.emailNotifications = true,
    this.pushNotifications = true,
    this.soundEnabled = true,
    this.orderNotifications = true,
    this.inventoryAlerts = true,
    this.projectUpdates = true,
    this.taskReminders = true,
    this.budgetAlerts = true,
    this.dailyReports = false,
    this.weeklyReports = true,
    this.monthlyReports = true,
    this.systemAlerts = true,
    this.securityAlerts = true,
    this.maintenanceNotices = true,
  });

  factory NotificationSettings.fromJson(Map<String, dynamic> j) => NotificationSettings(
        emailNotifications: j['emailNotifications'] ?? true,
        pushNotifications: j['pushNotifications'] ?? true,
        soundEnabled: j['soundEnabled'] ?? true,
        orderNotifications: j['orderNotifications'] ?? true,
        inventoryAlerts: j['inventoryAlerts'] ?? true,
        projectUpdates: j['projectUpdates'] ?? true,
        taskReminders: j['taskReminders'] ?? true,
        budgetAlerts: j['budgetAlerts'] ?? true,
        dailyReports: j['dailyReports'] ?? false,
        weeklyReports: j['weeklyReports'] ?? true,
        monthlyReports: j['monthlyReports'] ?? true,
        systemAlerts: j['systemAlerts'] ?? true,
        securityAlerts: j['securityAlerts'] ?? true,
        maintenanceNotices: j['maintenanceNotices'] ?? true,
      );

  Map<String, dynamic> toJson() => {
        'emailNotifications': emailNotifications,
        'pushNotifications': pushNotifications,
        'soundEnabled': soundEnabled,
        'orderNotifications': orderNotifications,
        'inventoryAlerts': inventoryAlerts,
        'projectUpdates': projectUpdates,
        'taskReminders': taskReminders,
        'budgetAlerts': budgetAlerts,
        'dailyReports': dailyReports,
        'weeklyReports': weeklyReports,
        'monthlyReports': monthlyReports,
        'systemAlerts': systemAlerts,
        'securityAlerts': securityAlerts,
        'maintenanceNotices': maintenanceNotices,
      };
}

class Broadcast {
  final String id;
  final String senderName;
  final String content;
  final String type;
  final String? departmentName;
  final DateTime timestamp;
  final bool isRead;

  const Broadcast({
    required this.id,
    required this.senderName,
    required this.content,
    required this.type,
    this.departmentName,
    required this.timestamp,
    required this.isRead,
  });

  factory Broadcast.fromJson(Map<String, dynamic> j, String currentUserId) {
    final sender = j['sender'];
    final senderName = sender is Map ? (sender['name'] ?? 'Unknown') : 'Unknown';
    final readBy = (j['readBy'] as List? ?? []).map((r) => r is Map ? r['_id'] ?? r : r.toString()).toList();
    return Broadcast(
      id: j['_id'] ?? '',
      senderName: senderName,
      content: j['content'] ?? '',
      type: j['type'] ?? 'webapp',
      departmentName: j['departmentId'] is Map ? j['departmentId']['name'] : null,
      timestamp: j['timestamp'] != null ? DateTime.parse(j['timestamp']).toLocal() : DateTime.now(),
      isRead: readBy.contains(currentUserId),
    );
  }
}

class ActivityLog {
  final String id;
  final String userName;
  final String action;
  final String resource;
  final String resourceType;
  final String status;
  final String details;
  final DateTime timestamp;
  final String? projectName;
  final String category;
  final String severity;

  const ActivityLog({
    required this.id,
    required this.userName,
    required this.action,
    required this.resource,
    required this.resourceType,
    required this.status,
    required this.details,
    required this.timestamp,
    this.projectName,
    required this.category,
    required this.severity,
  });

  factory ActivityLog.fromJson(Map<String, dynamic> j) => ActivityLog(
        id: j['_id'] ?? '',
        userName: j['userName'] ?? 'System',
        action: j['action'] ?? '',
        resource: j['resource'] ?? '',
        resourceType: j['resourceType'] ?? 'other',
        status: j['status'] ?? 'success',
        details: j['details'] ?? j['description'] ?? '',
        timestamp: j['timestamp'] != null ? DateTime.parse(j['timestamp']).toLocal() : DateTime.now(),
        projectName: j['projectName'],
        category: j['category'] ?? 'user',
        severity: j['severity'] ?? 'low',
      );
}
