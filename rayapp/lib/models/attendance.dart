class Attendance {
  final String id;
  final String employeeId;
  final String employeeName;
  final DateTime date;
  final DateTime checkIn;
  final DateTime? checkOut;
  final double totalHours;
  final double breakTime;
  final String status;
  final String approvalStatus;
  final String entrySource;
  final String? notes;

  Attendance({
    required this.id,
    required this.employeeId,
    this.employeeName = '',
    required this.date,
    required this.checkIn,
    this.checkOut,
    required this.totalHours,
    required this.breakTime,
    required this.status,
    required this.approvalStatus,
    required this.entrySource,
    this.notes,
  });

  factory Attendance.fromJson(Map<String, dynamic> json) {
    final emp = json['employee'];
    final empId = emp is Map ? emp['_id'] ?? '' : emp ?? '';
    final empName = emp is Map
        ? '${emp['firstName'] ?? ''} ${emp['lastName'] ?? ''}'.trim()
        : '';
    return Attendance(
      id: json['_id'] ?? '',
      employeeId: empId,
      employeeName: empName,
      date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
      checkIn: DateTime.tryParse(json['checkIn'] ?? '') ?? DateTime.now(),
      checkOut: json['checkOut'] != null ? DateTime.tryParse(json['checkOut']) : null,
      totalHours: (json['totalHours'] ?? 0).toDouble(),
      breakTime: (json['breakTime'] ?? 0).toDouble(),
      status: json['status'] ?? 'present',
      approvalStatus: json['approvalStatus'] ?? 'auto-approved',
      entrySource: json['entrySource'] ?? 'manual',
      notes: json['notes'],
    );
  }
}
