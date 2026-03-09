class Employee {
  final String id;
  final String employeeId;
  final String firstName;
  final String lastName;
  final String email;
  final String phone;
  final String position;
  final String? jobTitle;
  final String status;
  final String? department;
  final List<String> departments;
  final String? avatarUrl;
  final double? salary;
  final DateTime? hireDate;
  final String? bio;
  final List<String> skills;
  final List<SkillEnhanced> skillsEnhanced;
  final Address? address;
  final EmergencyContact? emergencyContact;

  Employee({
    required this.id,
    required this.employeeId,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phone,
    required this.position,
    this.jobTitle,
    required this.status,
    this.department,
    this.departments = const [],
    this.avatarUrl,
    this.salary,
    this.hireDate,
    this.bio,
    this.skills = const [],
    this.skillsEnhanced = const [],
    this.address,
    this.emergencyContact,
  });

  String get fullName => '$firstName $lastName';

  factory Employee.fromJson(Map<String, dynamic> json) => Employee(
        id: json['_id'] ?? '',
        employeeId: json['employeeId'] ?? '',
        firstName: json['firstName'] ?? '',
        lastName: json['lastName'] ?? '',
        email: json['email'] ?? '',
        phone: json['phone'] ?? '',
        position: json['position'] ?? '',
        jobTitle: json['jobTitle'],
        status: json['status'] ?? 'active',
        department: json['department'],
        departments: json['departments'] != null ? List<String>.from(json['departments']) : [],
        avatarUrl: json['avatarUrl'],
        salary: json['salary'] != null ? (json['salary'] as num).toDouble() : null,
        hireDate: json['hireDate'] != null ? DateTime.tryParse(json['hireDate']) : null,
        bio: json['bio'],
        skills: json['skills'] != null ? List<String>.from(json['skills']) : [],
        skillsEnhanced: (json['skillsEnhanced'] as List? ?? []).map((e) => SkillEnhanced.fromJson(e)).toList(),
        address: json['address'] != null ? Address.fromJson(json['address']) : null,
        emergencyContact: json['emergencyContact'] != null ? EmergencyContact.fromJson(json['emergencyContact']) : null,
      );
}

class Address {
  final String? street;
  final String? city;
  final String? state;
  final String? zipCode;
  final String? country;

  Address({this.street, this.city, this.state, this.zipCode, this.country});

  factory Address.fromJson(Map<String, dynamic> json) => Address(
        street: json['street'],
        city: json['city'],
        state: json['state'],
        zipCode: json['zipCode'],
        country: json['country'],
      );

  bool get isEmpty => (street ?? '').isEmpty && (city ?? '').isEmpty && (country ?? '').isEmpty;
  String get display => [street, city, state, zipCode, country].where((s) => s != null && s.isNotEmpty).join(', ');
}

class EmergencyContact {
  final String? name;
  final String? relationship;
  final String? phone;

  EmergencyContact({this.name, this.relationship, this.phone});

  factory EmergencyContact.fromJson(Map<String, dynamic> json) => EmergencyContact(
        name: json['name'],
        relationship: json['relationship'],
        phone: json['phone'],
      );

  bool get isEmpty => (name ?? '').isEmpty && (phone ?? '').isEmpty;
}

class SkillEnhanced {
  final String skill;
  final String level; // Beginner | Intermediate | Advanced | Expert
  final int? yearsOfExperience;

  SkillEnhanced({required this.skill, required this.level, this.yearsOfExperience});

  factory SkillEnhanced.fromJson(Map<String, dynamic> j) => SkillEnhanced(
        skill: j['skill'] ?? '',
        level: j['level'] ?? 'Beginner',
        yearsOfExperience: j['yearsOfExperience'] != null ? (j['yearsOfExperience'] as num).toInt() : null,
      );

  Map<String, dynamic> toJson() => {
        'skill': skill,
        'level': level,
        if (yearsOfExperience != null) 'yearsOfExperience': yearsOfExperience,
      };

  static const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  int get levelIndex => levels.indexOf(level).clamp(0, 3);
}
