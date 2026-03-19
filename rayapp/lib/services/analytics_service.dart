import 'api_service.dart';

class AnalyticsService extends ApiService {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getUserDashboard() async {
    final d = await get('/dashboard/user-dashboard');
    return _m(d);
  }

  Future<Map<String, dynamic>> getDashboardStats() async {
    final d = await get('/dashboard/stats');
    return _m(d);
  }

  Future<Map<String, dynamic>> getDashboardAnalytics() async {
    final d = await get('/dashboard/analytics');
    return _m(d);
  }

  Future<Map<String, dynamic>> getTrends() async {
    final d = await get('/dashboard/trends');
    return _m(d);
  }

  // ── Analytics ──────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getBudgetAnalytics() async {
    final d = await get('/analytics/budget-analytics');
    return _m(d);
  }

  Future<Map<String, dynamic>> getProductivityTrends() async {
    final d = await get('/analytics/productivity-trends');
    return _m(d);
  }

  Future<Map<String, dynamic>> getTopPerformers() async {
    final d = await get('/analytics/top-performers');
    return _m(d);
  }

  // ── Financial Reports ──────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getProfitLoss({String? startDate, String? endDate}) async {
    final d = await get('/financial-reports/profit-loss${_dq(startDate, endDate)}');
    return _m(d);
  }

  Future<Map<String, dynamic>> getBalanceSheet({String? date}) async {
    final d = await get('/financial-reports/balance-sheet${date != null ? '?date=$date' : ''}');
    return _m(d);
  }

  Future<Map<String, dynamic>> getCashFlow({String? startDate, String? endDate}) async {
    final d = await get('/financial-reports/cash-flow${_dq(startDate, endDate)}');
    return _m(d);
  }

  Future<Map<String, dynamic>> getTrialBalance({String? date}) async {
    final d = await get('/financial-reports/trial-balance${date != null ? '?date=$date' : ''}');
    return _m(d);
  }

  Future<Map<String, dynamic>> getGeneralLedger({String? startDate, String? endDate}) async {
    final d = await get('/financial-reports/general-ledger${_dq(startDate, endDate)}');
    return _m(d);
  }

  Future<Map<String, dynamic>> getAccountsReceivable() async {
    final d = await get('/financial-reports/accounts-receivable');
    return _m(d);
  }

  Future<Map<String, dynamic>> getAccountsPayable() async {
    final d = await get('/financial-reports/accounts-payable');
    return _m(d);
  }

  Future<Map<String, dynamic>> getExpenseReport({String? startDate, String? endDate}) async {
    final d = await get('/financial-reports/expense-report${_dq(startDate, endDate)}');
    return _m(d);
  }

  Future<Map<String, dynamic>> getRevenueReport({String? startDate, String? endDate}) async {
    final d = await get('/financial-reports/revenue-report${_dq(startDate, endDate)}');
    return _m(d);
  }

  // ── Invoices ───────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getInvoiceAnalytics() async {
    final d = await get('/finance/invoices/analytics');
    return _m(d);
  }

  Future<List<dynamic>> getInvoices({String? status, int limit = 50}) async {
    final q = '?${status != null ? 'status=$status&' : ''}limit=$limit';
    final d = await get('/finance/invoices$q');
    if (d is List) return d;
    return _l(d['invoices'] ?? d['data'] ?? []);
  }

  // ── Approvals ─────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getApprovalStats() async {
    final d = await get('/approvals/stats');
    return _m(d);
  }

  Future<List<dynamic>> getApprovals({String? status}) async {
    final q = status != null ? '?status=$status' : '';
    final d = await get('/approvals$q');
    if (d is List) return d;
    return _l(d['approvals'] ?? d['data'] ?? []);
  }

  // ── Budget ─────────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getBudgetReportStats() async {
    final d = await get('/budget-reports/statistics');
    return _m(d);
  }

  Future<List<dynamic>> getBudgetReports() async {
    final d = await get('/budget-reports');
    if (d is List) return d;
    return _l(d['reports'] ?? d['data'] ?? []);
  }

  // ── Employee Reports ───────────────────────────────────────────────────────
  Future<Map<String, dynamic>> getEmployeeReports() async {
    final d = await get('/reports/employees');
    return _m(d);
  }

  Future<Map<String, dynamic>> getOverviewStats() async {
    final d = await get('/reports/overview');
    return _m(d);
  }

  Future<Map<String, dynamic>> getTeamProductivity() async {
    final d = await get('/reports/team-productivity');
    return _m(d);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  Map<String, dynamic> _m(dynamic d) {
    if (d is Map<String, dynamic>) {
      final inner = d['data'] ?? d['result'] ?? d;
      if (inner is Map<String, dynamic>) return inner;
    }
    return {};
  }

  List<dynamic> _l(dynamic d) => d is List ? d : [];

  String _dq(String? s, String? e) {
    final p = <String>[];
    if (s != null) p.add('startDate=$s');
    if (e != null) p.add('endDate=$e');
    return p.isEmpty ? '' : '?${p.join('&')}';
  }
}
