class Contact {
  final String id;
  final String name;
  final String phone;
  final String? email;
  final String? company;
  final String? position;
  final String? address;
  final String? notes;
  final List<String> tags;
  final String? reference;
  final String? alternativePhone;
  final String visibilityLevel;
  final ContactRef? department;
  final String contactType;
  final String? role;
  final String priority;
  final String status;
  final bool isCustomer;
  final bool isVendor;
  final String? website;
  final String? linkedIn;
  final String? twitter;
  final DateTime? birthday;
  final DateTime? anniversary;
  final String? industry;
  final String? companySize;
  final String? annualRevenue;
  final ContactRef? createdBy;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Contact({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    this.company,
    this.position,
    this.address,
    this.notes,
    this.tags = const [],
    this.reference,
    this.alternativePhone,
    required this.visibilityLevel,
    this.department,
    required this.contactType,
    this.role,
    required this.priority,
    required this.status,
    required this.isCustomer,
    required this.isVendor,
    this.website,
    this.linkedIn,
    this.twitter,
    this.birthday,
    this.anniversary,
    this.industry,
    this.companySize,
    this.annualRevenue,
    this.createdBy,
    this.createdAt,
    this.updatedAt,
  });

  factory Contact.fromJson(Map<String, dynamic> j) => Contact(
        id: j['_id'] ?? '',
        name: j['name'] ?? '',
        phone: j['phone'] ?? '',
        email: j['email'],
        company: j['company'],
        position: j['position'],
        address: j['address'],
        notes: j['notes'],
        tags: j['tags'] != null ? List<String>.from(j['tags']) : [],
        reference: j['reference'],
        alternativePhone: j['alternativePhone'],
        visibilityLevel: j['visibilityLevel'] ?? 'personal',
        department: j['department'] != null ? ContactRef.fromJson(j['department']) : null,
        contactType: j['contactType'] ?? 'personal',
        role: j['role'],
        priority: j['priority'] ?? 'medium',
        status: j['status'] ?? 'active',
        isCustomer: j['isCustomer'] == true,
        isVendor: j['isVendor'] == true,
        website: j['website'],
        linkedIn: j['linkedIn'],
        twitter: j['twitter'],
        birthday: j['birthday'] != null ? DateTime.tryParse(j['birthday']) : null,
        anniversary: j['anniversary'] != null ? DateTime.tryParse(j['anniversary']) : null,
        industry: j['industry'],
        companySize: j['companySize'],
        annualRevenue: j['annualRevenue'],
        createdBy: j['createdBy'] != null ? ContactRef.fromJson(j['createdBy']) : null,
        createdAt: j['createdAt'] != null ? DateTime.tryParse(j['createdAt']) : null,
        updatedAt: j['updatedAt'] != null ? DateTime.tryParse(j['updatedAt']) : null,
      );

  Contact copyWith({
    String? id,
    String? name,
    String? phone,
    Object? email = _sentinel,
    Object? company = _sentinel,
    Object? position = _sentinel,
    Object? address = _sentinel,
    Object? notes = _sentinel,
    List<String>? tags,
    Object? reference = _sentinel,
    Object? alternativePhone = _sentinel,
    String? visibilityLevel,
    Object? department = _sentinel,
    String? contactType,
    Object? role = _sentinel,
    String? priority,
    String? status,
    bool? isCustomer,
    bool? isVendor,
    Object? website = _sentinel,
    Object? linkedIn = _sentinel,
    Object? twitter = _sentinel,
    Object? birthday = _sentinel,
    Object? anniversary = _sentinel,
    Object? industry = _sentinel,
    Object? companySize = _sentinel,
    Object? annualRevenue = _sentinel,
    Object? createdBy = _sentinel,
    Object? createdAt = _sentinel,
    Object? updatedAt = _sentinel,
  }) =>
      Contact(
        id: id ?? this.id,
        name: name ?? this.name,
        phone: phone ?? this.phone,
        email: email == _sentinel ? this.email : email as String?,
        company: company == _sentinel ? this.company : company as String?,
        position: position == _sentinel ? this.position : position as String?,
        address: address == _sentinel ? this.address : address as String?,
        notes: notes == _sentinel ? this.notes : notes as String?,
        tags: tags ?? this.tags,
        reference: reference == _sentinel ? this.reference : reference as String?,
        alternativePhone: alternativePhone == _sentinel ? this.alternativePhone : alternativePhone as String?,
        visibilityLevel: visibilityLevel ?? this.visibilityLevel,
        department: department == _sentinel ? this.department : department as ContactRef?,
        contactType: contactType ?? this.contactType,
        role: role == _sentinel ? this.role : role as String?,
        priority: priority ?? this.priority,
        status: status ?? this.status,
        isCustomer: isCustomer ?? this.isCustomer,
        isVendor: isVendor ?? this.isVendor,
        website: website == _sentinel ? this.website : website as String?,
        linkedIn: linkedIn == _sentinel ? this.linkedIn : linkedIn as String?,
        twitter: twitter == _sentinel ? this.twitter : twitter as String?,
        birthday: birthday == _sentinel ? this.birthday : birthday as DateTime?,
        anniversary: anniversary == _sentinel ? this.anniversary : anniversary as DateTime?,
        industry: industry == _sentinel ? this.industry : industry as String?,
        companySize: companySize == _sentinel ? this.companySize : companySize as String?,
        annualRevenue: annualRevenue == _sentinel ? this.annualRevenue : annualRevenue as String?,
        createdBy: createdBy == _sentinel ? this.createdBy : createdBy as ContactRef?,
        createdAt: createdAt == _sentinel ? this.createdAt : createdAt as DateTime?,
        updatedAt: updatedAt == _sentinel ? this.updatedAt : updatedAt as DateTime?,
      );

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }
}

// Sentinel for copyWith nullable fields
const Object _sentinel = Object();

class ContactRef {
  final String id;
  final String name;
  final String? email;

  const ContactRef({required this.id, required this.name, this.email});

  factory ContactRef.fromJson(dynamic j) {
    if (j is String) return ContactRef(id: j, name: '');
    final m = j as Map<String, dynamic>;
    return ContactRef(id: m['_id'] ?? '', name: m['name'] ?? '', email: m['email']);
  }
}

class ContactStats {
  final int total;
  final int active;
  final int inactive;
  final int archived;
  final int customers;
  final int vendors;
  final int byTypeCompany;
  final int byTypePersonal;
  final int byTypeClient;
  final int byTypeVendor;
  final int byTypePartner;

  const ContactStats({
    required this.total,
    required this.active,
    required this.inactive,
    required this.archived,
    required this.customers,
    required this.vendors,
    required this.byTypeCompany,
    required this.byTypePersonal,
    required this.byTypeClient,
    required this.byTypeVendor,
    required this.byTypePartner,
  });
}
