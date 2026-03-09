class TaskStats {
  final int completed;
  final int inProgress;
  final int overdue;
  final int total;
  TaskStats({this.completed = 0, this.inProgress = 0, this.overdue = 0, this.total = 0});
  factory TaskStats.fromJson(Map<String, dynamic> j) => TaskStats(
        completed: (j['completed'] ?? 0).toInt(),
        inProgress: (j['inProgress'] ?? 0).toInt(),
        overdue: (j['overdue'] ?? 0).toInt(),
        total: (j['total'] ?? 0).toInt(),
      );
}

class CareerEvent {
  final String type;
  final String title;
  final String description;
  final DateTime date;
  final String? from;
  final String? to;

  CareerEvent({required this.type, required this.title, required this.description, required this.date, this.from, this.to});

  factory CareerEvent.fromJson(Map<String, dynamic> j) {
    final meta = j['metadata'] as Map<String, dynamic>? ?? {};
    return CareerEvent(
      type: j['type'] ?? 'milestone',
      title: j['title'] ?? '',
      description: j['description'] ?? '',
      date: DateTime.tryParse(j['date'] ?? '') ?? DateTime.now(),
      from: meta['from'],
      to: meta['to'],
    );
  }
}

class Achievement {
  final String title;
  final String description;
  final String category;
  final DateTime date;
  final String? issuer;
  final String? credentialId;
  final DateTime? expiryDate;

  Achievement({required this.title, required this.description, required this.category, required this.date, this.issuer, this.credentialId, this.expiryDate});

  factory Achievement.fromJson(Map<String, dynamic> j) => Achievement(
        title: j['title'] ?? '',
        description: j['description'] ?? '',
        category: j['category'] ?? 'milestone',
        date: DateTime.tryParse(j['date'] ?? '') ?? DateTime.now(),
        issuer: j['issuer'],
        credentialId: j['credentialId'],
        expiryDate: j['expiryDate'] != null ? DateTime.tryParse(j['expiryDate']) : null,
      );

  bool get isExpired => expiryDate != null && expiryDate!.isBefore(DateTime.now());
}

class SalaryHistory {
  final double salary;
  final DateTime effectiveDate;
  final String? reason;

  SalaryHistory({required this.salary, required this.effectiveDate, this.reason});

  factory SalaryHistory.fromJson(Map<String, dynamic> j) => SalaryHistory(
        salary: (j['salary'] ?? 0).toDouble(),
        effectiveDate: DateTime.tryParse(j['effectiveDate'] ?? '') ?? DateTime.now(),
        reason: j['reason'],
      );
}

class AttendanceStats {
  final int totalDays;
  final int presentDays;
  final int lateDays;
  final int halfDays;
  final double totalHours;
  final double averageHours;

  AttendanceStats({
    this.totalDays = 0,
    this.presentDays = 0,
    this.lateDays = 0,
    this.halfDays = 0,
    this.totalHours = 0,
    this.averageHours = 0,
  });

  factory AttendanceStats.fromJson(Map<String, dynamic> j) => AttendanceStats(
        totalDays: (j['totalDays'] ?? 0).toInt(),
        presentDays: (j['presentDays'] ?? 0).toInt(),
        lateDays: (j['lateDays'] ?? 0).toInt(),
        halfDays: (j['halfDays'] ?? 0).toInt(),
        totalHours: (j['totalHours'] ?? 0).toDouble(),
        averageHours: (j['averageHours'] ?? 0).toDouble(),
      );

  int get attendanceRate =>
      totalDays == 0 ? 0 : ((presentDays / totalDays) * 100).round();
}

class LeaveBalance {
  final int sickUsed, sickTotal;
  final int vacationUsed, vacationTotal;
  final int personalUsed, personalTotal;

  LeaveBalance({
    this.sickUsed = 0,
    this.sickTotal = 12,
    this.vacationUsed = 0,
    this.vacationTotal = 21,
    this.personalUsed = 0,
    this.personalTotal = 5,
  });

  factory LeaveBalance.fromJson(Map<String, dynamic> j) {
    Map<String, dynamic> s = j['sick'] ?? {};
    Map<String, dynamic> v = j['vacation'] ?? {};
    Map<String, dynamic> p = j['personal'] ?? {};
    return LeaveBalance(
      sickUsed: (s['used'] ?? 0).toInt(),
      sickTotal: (s['total'] ?? 12).toInt(),
      vacationUsed: (v['used'] ?? 0).toInt(),
      vacationTotal: (v['total'] ?? 21).toInt(),
      personalUsed: (p['used'] ?? 0).toInt(),
      personalTotal: (p['total'] ?? 5).toInt(),
    );
  }
}

class DeptSummary {
  final String department;
  final int count;
  final double avgSalary;

  DeptSummary({required this.department, required this.count, required this.avgSalary});

  factory DeptSummary.fromJson(Map<String, dynamic> j) => DeptSummary(
        department: j['_id'] ?? '',
        count: (j['count'] ?? 0).toInt(),
        avgSalary: (j['avgSalary'] ?? 0).toDouble(),
      );
}

class AttendanceSummaryItem {
  final String status;
  final int count;
  final double totalHours;

  AttendanceSummaryItem({required this.status, required this.count, required this.totalHours});

  factory AttendanceSummaryItem.fromJson(Map<String, dynamic> j) => AttendanceSummaryItem(
        status: j['_id'] ?? '',
        count: (j['count'] ?? 0).toInt(),
        totalHours: (j['totalHours'] ?? 0).toDouble(),
      );
}
