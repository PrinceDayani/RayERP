class TaskAssignee {
  final String id;
  final String firstName;
  final String lastName;

  TaskAssignee({required this.id, required this.firstName, required this.lastName});

  String get name => '$firstName $lastName'.trim();

  factory TaskAssignee.fromJson(dynamic json) {
    if (json is Map<String, dynamic>) {
      return TaskAssignee(
        id: json['_id'] ?? '',
        firstName: json['firstName'] ?? '',
        lastName: json['lastName'] ?? '',
      );
    }
    return TaskAssignee(id: json?.toString() ?? '', firstName: '', lastName: '');
  }
}

class TaskTag {
  final String name;
  final String color;

  TaskTag({required this.name, required this.color});

  factory TaskTag.fromJson(Map<String, dynamic> json) => TaskTag(
        name: json['name'] ?? '',
        color: json['color'] ?? '#3b82f6',
      );

  Map<String, dynamic> toJson() => {'name': name, 'color': color};
}

class TaskComment {
  final String id;
  final TaskAssignee? user;
  final String comment;
  final DateTime createdAt;

  TaskComment({required this.id, this.user, required this.comment, required this.createdAt});

  factory TaskComment.fromJson(Map<String, dynamic> json) => TaskComment(
        id: json['_id'] ?? '',
        user: json['user'] != null ? TaskAssignee.fromJson(json['user']) : null,
        comment: json['comment'] ?? '',
        createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      );
}

class ChecklistItem {
  final String id;
  final String text;
  final bool completed;

  ChecklistItem({required this.id, required this.text, required this.completed});

  factory ChecklistItem.fromJson(Map<String, dynamic> json) => ChecklistItem(
        id: json['_id'] ?? '',
        text: json['text'] ?? '',
        completed: json['completed'] ?? false,
      );
}

class TimeEntry {
  final String id;
  final String userId;
  final DateTime startTime;
  final DateTime? endTime;
  final int duration; // minutes
  final String? description;

  TimeEntry({
    required this.id,
    required this.userId,
    required this.startTime,
    this.endTime,
    required this.duration,
    this.description,
  });

  bool get isActive => endTime == null;

  factory TimeEntry.fromJson(Map<String, dynamic> json) => TimeEntry(
        id: json['_id'] ?? '',
        userId: json['user'] is Map ? (json['user']['_id'] ?? '') : (json['user'] ?? ''),
        startTime: DateTime.tryParse(json['startTime'] ?? '') ?? DateTime.now(),
        endTime: json['endTime'] != null ? DateTime.tryParse(json['endTime']) : null,
        duration: (json['duration'] ?? 0).toInt(),
        description: json['description'],
      );
}

class TaskAttachment {
  final String id;
  final String filename;
  final String originalName;
  final String mimetype;
  final int size;
  final String url;
  final DateTime uploadedAt;

  TaskAttachment({
    required this.id,
    required this.filename,
    required this.originalName,
    required this.mimetype,
    required this.size,
    required this.url,
    required this.uploadedAt,
  });

  String get sizeLabel {
    if (size < 1024) return '${size}B';
    if (size < 1024 * 1024) return '${(size / 1024).toStringAsFixed(1)}KB';
    return '${(size / 1024 / 1024).toStringAsFixed(1)}MB';
  }

  factory TaskAttachment.fromJson(Map<String, dynamic> json) => TaskAttachment(
        id: json['_id'] ?? '',
        filename: json['filename'] ?? '',
        originalName: json['originalName'] ?? '',
        mimetype: json['mimetype'] ?? '',
        size: (json['size'] ?? 0).toInt(),
        url: json['url'] ?? '',
        uploadedAt: DateTime.tryParse(json['uploadedAt'] ?? '') ?? DateTime.now(),
      );
}

class CustomField {
  final String fieldName;
  final String fieldType;
  final dynamic value;

  CustomField({required this.fieldName, required this.fieldType, this.value});

  factory CustomField.fromJson(Map<String, dynamic> json) => CustomField(
        fieldName: json['fieldName'] ?? '',
        fieldType: json['fieldType'] ?? 'text',
        value: json['value'],
      );
}

class TaskDependency {
  final String id;
  final String taskId;
  final String taskTitle;
  final String type;

  TaskDependency({
    required this.id,
    required this.taskId,
    required this.taskTitle,
    required this.type,
  });

  factory TaskDependency.fromJson(Map<String, dynamic> json) {
    final taskRef = json['taskId'];
    return TaskDependency(
      id: json['_id'] ?? '',
      taskId: taskRef is Map ? (taskRef['_id'] ?? '') : (taskRef?.toString() ?? ''),
      taskTitle: taskRef is Map ? (taskRef['title'] ?? '') : '',
      type: json['type'] ?? 'finish-to-start',
    );
  }
}

class SubtaskRef {
  final String id;
  final String title;
  final String status;

  SubtaskRef({required this.id, required this.title, required this.status});

  factory SubtaskRef.fromJson(dynamic json) {
    if (json is Map<String, dynamic>) {
      return SubtaskRef(
        id: json['_id'] ?? '',
        title: json['title'] ?? '',
        status: json['status'] ?? 'todo',
      );
    }
    return SubtaskRef(id: json?.toString() ?? '', title: '', status: 'todo');
  }
}

class Task {
  final String id;
  final String title;
  final String description;
  final String status;
  final String priority;
  final String projectId;
  final String projectName;
  final TaskAssignee? assignedTo;
  final TaskAssignee? assignedBy;
  final DateTime? dueDate;
  final double estimatedHours;
  final double actualHours;
  final String column;
  final int order;
  final List<TaskTag> tags;
  final List<TaskComment> comments;
  final List<ChecklistItem> checklist;
  final List<TimeEntry> timeEntries;
  final List<TaskAttachment> attachments;
  final List<CustomField> customFields;
  final List<TaskDependency> dependencies;
  final List<SubtaskRef> subtasks;
  final String? parentTaskId;
  final bool isRecurring;
  final String? recurrencePattern;
  final bool isTemplate;
  final String? templateName;
  final DateTime createdAt;
  final DateTime updatedAt;

  Task({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.priority,
    required this.projectId,
    required this.projectName,
    this.assignedTo,
    this.assignedBy,
    this.dueDate,
    required this.estimatedHours,
    required this.actualHours,
    required this.column,
    required this.order,
    required this.tags,
    required this.comments,
    required this.checklist,
    required this.timeEntries,
    required this.attachments,
    required this.customFields,
    required this.dependencies,
    required this.subtasks,
    this.parentTaskId,
    required this.isRecurring,
    this.recurrencePattern,
    required this.isTemplate,
    this.templateName,
    required this.createdAt,
    required this.updatedAt,
  });

  bool get hasActiveTimer => timeEntries.any((e) => e.isActive);

  int get totalLoggedMinutes => timeEntries.fold(0, (sum, e) => sum + e.duration);

  int get checklistDone => checklist.where((c) => c.completed).length;

  factory Task.fromJson(Map<String, dynamic> json) {
    final project = json['project'];
    return Task(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      status: json['status'] ?? 'todo',
      priority: json['priority'] ?? 'medium',
      projectId: project is Map ? (project['_id'] ?? '') : (project?.toString() ?? ''),
      projectName: project is Map ? (project['name'] ?? '') : '',
      assignedTo: json['assignedTo'] != null ? TaskAssignee.fromJson(json['assignedTo']) : null,
      assignedBy: json['assignedBy'] != null ? TaskAssignee.fromJson(json['assignedBy']) : null,
      dueDate: json['dueDate'] != null ? DateTime.tryParse(json['dueDate']) : null,
      estimatedHours: (json['estimatedHours'] ?? 0).toDouble(),
      actualHours: (json['actualHours'] ?? 0).toDouble(),
      column: json['column'] ?? 'todo',
      order: (json['order'] ?? 0).toInt(),
      tags: (json['tags'] as List? ?? []).map((e) => TaskTag.fromJson(e)).toList(),
      comments: (json['comments'] as List? ?? []).map((e) => TaskComment.fromJson(e)).toList(),
      checklist: (json['checklist'] as List? ?? []).map((e) => ChecklistItem.fromJson(e)).toList(),
      timeEntries: (json['timeEntries'] as List? ?? []).map((e) => TimeEntry.fromJson(e)).toList(),
      attachments: (json['attachments'] as List? ?? []).map((e) => TaskAttachment.fromJson(e)).toList(),
      customFields: (json['customFields'] as List? ?? []).map((e) => CustomField.fromJson(e)).toList(),
      dependencies: (json['dependencies'] as List? ?? []).map((e) => TaskDependency.fromJson(e)).toList(),
      subtasks: (json['subtasks'] as List? ?? []).map((e) => SubtaskRef.fromJson(e)).toList(),
      parentTaskId: json['parentTask'] is Map ? json['parentTask']['_id'] : json['parentTask']?.toString(),
      isRecurring: json['isRecurring'] ?? false,
      recurrencePattern: json['recurrencePattern'],
      isTemplate: json['isTemplate'] ?? false,
      templateName: json['templateName'],
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt'] ?? '') ?? DateTime.now(),
    );
  }
}

class TaskAnalytics {
  final int total;
  final int completed;
  final int inProgress;
  final int todo;
  final int blocked;
  final int overdue;
  final double completionRate;
  final List<Map<String, dynamic>> burndown;
  final List<Map<String, dynamic>> velocity;
  final List<Map<String, dynamic>> teamPerformance;

  TaskAnalytics({
    required this.total,
    required this.completed,
    required this.inProgress,
    required this.todo,
    required this.blocked,
    required this.overdue,
    required this.completionRate,
    required this.burndown,
    required this.velocity,
    required this.teamPerformance,
  });

  factory TaskAnalytics.fromJson(Map<String, dynamic> json) => TaskAnalytics(
        total: (json['total'] ?? json['totalTasks'] ?? 0).toInt(),
        completed: (json['completed'] ?? json['completedTasks'] ?? 0).toInt(),
        inProgress: (json['inProgress'] ?? json['inProgressTasks'] ?? 0).toInt(),
        todo: (json['todo'] ?? json['todoTasks'] ?? 0).toInt(),
        blocked: (json['blocked'] ?? json['blockedTasks'] ?? 0).toInt(),
        overdue: (json['overdue'] ?? json['overdueTasks'] ?? 0).toInt(),
        completionRate: (json['completionRate'] ?? 0).toDouble(),
        burndown: (json['burndown'] as List? ?? []).map((e) => Map<String, dynamic>.from(e)).toList(),
        velocity: (json['velocity'] as List? ?? []).map((e) => Map<String, dynamic>.from(e)).toList(),
        teamPerformance: (json['teamPerformance'] as List? ?? []).map((e) => Map<String, dynamic>.from(e)).toList(),
      );
}
