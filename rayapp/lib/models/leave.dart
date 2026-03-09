class Leave {
  final String id;
  final String employeeId;
  final String employeeName;
  final String leaveType;
  final DateTime startDate;
  final DateTime endDate;
  final int totalDays;
  final String reason;
  final String status;
  final DateTime appliedDate;
  final String? rejectionReason;

  Leave({
    required this.id,
    required this.employeeId,
    this.employeeName = '',
    required this.leaveType,
    required this.startDate,
    required this.endDate,
    required this.totalDays,
    required this.reason,
    required this.status,
    required this.appliedDate,
    this.rejectionReason,
  });

  factory Leave.fromJson(Map<String, dynamic> json) {
    final emp = json['employee'];
    final empId = emp is Map ? emp['_id'] ?? '' : emp ?? '';
    final empName = emp is Map
        ? '${emp['firstName'] ?? ''} ${emp['lastName'] ?? ''}'.trim()
        : '';
    return Leave(
      id: json['_id'] ?? '',
      employeeId: empId,
      employeeName: empName,
      leaveType: json['leaveType'] ?? '',
      startDate: DateTime.tryParse(json['startDate'] ?? '') ?? DateTime.now(),
      endDate: DateTime.tryParse(json['endDate'] ?? '') ?? DateTime.now(),
      totalDays: (json['totalDays'] ?? 0).toInt(),
      reason: json['reason'] ?? '',
      status: json['status'] ?? 'pending',
      appliedDate: DateTime.tryParse(json['appliedDate'] ?? '') ?? DateTime.now(),
      rejectionReason: json['rejectionReason'],
    );
  }
}
