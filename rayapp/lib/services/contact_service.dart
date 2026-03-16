import '../models/contact.dart';
import 'api_service.dart';

class ContactService extends ApiService {
  ContactService._();
  static final ContactService instance = ContactService._();

  Future<({List<Contact> contacts, int total, int pages})> getAll({
    int page = 1,
    int limit = 50,
    String search = '',
    String status = '',
    String type = '',
  }) async {
    var path = '/contacts?page=$page&limit=$limit';
    if (search.isNotEmpty) path += '&search=${Uri.encodeComponent(search)}';
    if (status.isNotEmpty && status != 'all') path += '&status=$status';
    if (type.isNotEmpty) path += '&contactType=$type';
    final data = await get(path);
    final list = (data['data'] ?? data['contacts'] ?? []) as List;
    final pagination = data['pagination'] ?? {};
    return (
      contacts: list.map((c) => Contact.fromJson(c)).toList(),
      total: (pagination['total'] ?? list.length) as int,
      pages: (pagination['pages'] ?? 1) as int,
    );
  }

  Future<Contact> getById(String id) async {
    final data = await get('/contacts/$id');
    return Contact.fromJson(data['data'] ?? data);
  }

  Future<Contact> create(Map<String, dynamic> body) async {
    final data = await post('/contacts', body);
    return Contact.fromJson(data['data'] ?? data);
  }

  Future<Contact> update(String id, Map<String, dynamic> body) async {
    final data = await put('/contacts/$id', body);
    return Contact.fromJson(data['data'] ?? data);
  }

  Future<void> deleteContact(String id) => delete('/contacts/$id');

  Future<List<Contact>> search(String query, {int limit = 20}) async {
    final data = await get('/contacts/search?query=${Uri.encodeComponent(query)}&limit=$limit');
    final list = (data['data'] ?? []) as List;
    return list.map((c) => Contact.fromJson(c)).toList();
  }

  Future<ContactStats?> getStats() async {
    try {
      final data = await get('/contacts/stats');
      final s = data['data'] ?? data;
      return ContactStats(
        total:          (s['total']          ?? 0) as int,
        active:         (s['active']         ?? 0) as int,
        inactive:       (s['inactive']       ?? 0) as int,
        archived:       (s['archived']       ?? 0) as int,
        customers:      (s['customers']      ?? 0) as int,
        vendors:        (s['vendors']        ?? 0) as int,
        byTypeCompany:  (s['byTypeCompany']  ?? 0) as int,
        byTypePersonal: (s['byTypePersonal'] ?? 0) as int,
        byTypeClient:   (s['byTypeClient']   ?? 0) as int,
        byTypeVendor:   (s['byTypeVendor']   ?? 0) as int,
        byTypePartner:  (s['byTypePartner']  ?? 0) as int,
      );
    } on UnauthorizedException {
      rethrow;
    } catch (_) {
      return null;
    }
  }

  Future<List<Contact>> getCustomers({int limit = 50}) async {
    final data = await get('/contacts/customers?limit=$limit');
    final list = (data['data'] ?? []) as List;
    return list.map((c) => Contact.fromJson(c)).toList();
  }
}
