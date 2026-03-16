import '../models/approval.dart';
import 'api_service.dart';

class ApprovalService extends ApiService {
  Future<ApprovalStats> getStats() async {
    final d = await get('/approvals/stats');
    final data = d is Map ? (d['data'] ?? d) : {};
    return ApprovalStats.fromJson(Map<String, dynamic>.from(data));
  }

  Future<List<ApprovalRequest>> getPending() async {
    final d = await get('/approvals/pending');
    final list = d is List ? d : (d['data'] ?? []);
    return (list as List).map((e) => ApprovalRequest.fromJson(Map<String, dynamic>.from(e))).toList();
  }

  Future<({List<ApprovalRequest> items, int total, int pages})> getAll({
    String? status,
    String? priority,
    int page = 1,
    int limit = 20,
  }) async {
    final q = StringBuffer('?page=$page&limit=$limit');
    if (status != null && status != 'all') q.write('&status=$status');
    if (priority != null) q.write('&priority=$priority');
    final d = await get('/approvals$q');
    final raw = d is Map ? d : {};
    final list = raw['data'] ?? [];
    final pagination = raw['pagination'] ?? {};
    return (
      items: (list as List).map((e) => ApprovalRequest.fromJson(Map<String, dynamic>.from(e))).toList(),
      total: ((pagination['total'] ?? 0) as num).toInt(),
      pages: ((pagination['pages'] ?? 1) as num).toInt(),
    );
  }

  Future<({List<ApprovalRequest> items, int total, int pages})> getHistory({int page = 1, int limit = 20}) async {
    final d = await get('/approvals/history?page=$page&limit=$limit');
    final raw = d is Map ? d : {};
    final list = raw['data'] ?? [];
    final pagination = raw['pagination'] ?? {};
    return (
      items: (list as List).map((e) => ApprovalRequest.fromJson(Map<String, dynamic>.from(e))).toList(),
      total: ((pagination['total'] ?? 0) as num).toInt(),
      pages: ((pagination['pages'] ?? 1) as num).toInt(),
    );
  }

  Future<ApprovalRequest> getById(String id) async {
    final d = await get('/approvals/$id');
    final data = d is Map ? (d['data'] ?? d) : d;
    return ApprovalRequest.fromJson(Map<String, dynamic>.from(data));
  }

  Future<ApprovalRequest> approve(String id, {String? comments}) async {
    final d = await post('/approvals/$id/approve', {'comments': comments ?? ''});
    final data = d is Map ? (d['data'] ?? d) : d;
    return ApprovalRequest.fromJson(Map<String, dynamic>.from(data));
  }

  Future<ApprovalRequest> reject(String id, {required String reason}) async {
    final d = await post('/approvals/$id/reject', {'reason': reason});
    final data = d is Map ? (d['data'] ?? d) : d;
    return ApprovalRequest.fromJson(Map<String, dynamic>.from(data));
  }

  Future<void> sendReminder(String id) async {
    await post('/approvals/$id/remind', {});
  }
}
