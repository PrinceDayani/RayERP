import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/analytics_service.dart';

enum _ReportType {
  profitLoss('P&L', Icons.trending_up_outlined),
  balanceSheet('Balance Sheet', Icons.account_balance_outlined),
  cashFlow('Cash Flow', Icons.water_outlined),
  trialBalance('Trial Balance', Icons.balance_outlined),
  generalLedger('General Ledger', Icons.menu_book_outlined),
  accountsReceivable('Receivable', Icons.arrow_downward_outlined),
  accountsPayable('Payable', Icons.arrow_upward_outlined),
  expenseReport('Expenses', Icons.receipt_outlined),
  revenueReport('Revenue', Icons.bar_chart_outlined);

  final String label;
  final IconData icon;
  const _ReportType(this.label, this.icon);
}

class FinancialReportsScreen extends StatefulWidget {
  const FinancialReportsScreen({super.key});
  @override
  State<FinancialReportsScreen> createState() => _FinancialReportsScreenState();
}

class _FinancialReportsScreenState extends State<FinancialReportsScreen> {
  final _svc = AnalyticsService();
  _ReportType _selected = _ReportType.profitLoss;
  Map<String, dynamic> _data = {};
  bool _loading = false;
  String? _error;

  DateTime _startDate = DateTime(DateTime.now().year, 1, 1);
  DateTime _endDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final s = _startDate.toIso8601String().split('T')[0];
      final e = _endDate.toIso8601String().split('T')[0];
      final Map<String, dynamic> result;
      switch (_selected) {
        case _ReportType.profitLoss:
          result = await _svc.getProfitLoss(startDate: s, endDate: e);
        case _ReportType.balanceSheet:
          result = await _svc.getBalanceSheet(date: e);
        case _ReportType.cashFlow:
          result = await _svc.getCashFlow(startDate: s, endDate: e);
        case _ReportType.trialBalance:
          result = await _svc.getTrialBalance(date: e);
        case _ReportType.generalLedger:
          result = await _svc.getGeneralLedger(startDate: s, endDate: e);
        case _ReportType.accountsReceivable:
          result = await _svc.getAccountsReceivable();
        case _ReportType.accountsPayable:
          result = await _svc.getAccountsPayable();
        case _ReportType.expenseReport:
          result = await _svc.getExpenseReport(startDate: s, endDate: e);
        case _ReportType.revenueReport:
          result = await _svc.getRevenueReport(startDate: s, endDate: e);
      }
      if (!mounted) return;
      setState(() { _data = result; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _pickDate(bool isStart) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isStart ? _startDate : _endDate,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() { if (isStart) {
        _startDate = picked;
      } else {
        _endDate = picked;
      } });
      _load();
    }
  }

  bool get _needsDates => _selected != _ReportType.accountsReceivable &&
      _selected != _ReportType.accountsPayable;

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final p = w < 400 ? 12.0 : w < 768 ? 16.0 : 24.0;
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Financial Reports'),
        actions: [IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: _load)],
      ),
      body: Column(children: [
        _buildTypeSelector(),
        if (_needsDates) _buildDateBar(p),
        Expanded(child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
            : _error != null
                ? _ErrView(error: _error!, onRetry: _load)
                : _data.isEmpty
                    ? const _Empty('No data available for this report')
                    : _ReportBody(type: _selected, data: _data, hPad: p)),
      ]),
    );
  }

  Widget _buildTypeSelector() {
    return Container(
      color: Theme.of(context).cardColor,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(children: _ReportType.values.map((t) {
          final active = _selected == t;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () { setState(() => _selected = t); _load(); },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                decoration: BoxDecoration(
                  color: active ? AppTheme.primary : AppTheme.primary.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: active ? AppTheme.primary : AppTheme.primary.withOpacity(0.2)),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(t.icon, size: 13, color: active ? Colors.white : AppTheme.primary),
                  const SizedBox(width: 5),
                  Text(t.label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                      color: active ? Colors.white : AppTheme.primary)),
                ]),
              ),
            ),
          );
        }).toList()),
      ),
    );
  }

  Widget _buildDateBar(double p) {
    return Container(
      color: Theme.of(context).cardColor,
      padding: EdgeInsets.fromLTRB(p, 0, p, 10),
      child: Row(children: [
        Expanded(child: _DateBtn(label: 'From', date: _startDate, onTap: () => _pickDate(true))),
        const SizedBox(width: 8),
        Expanded(child: _DateBtn(label: 'To', date: _endDate, onTap: () => _pickDate(false))),
      ]),
    );
  }
}

class _ReportBody extends StatelessWidget {
  final _ReportType type;
  final Map<String, dynamic> data;
  final double hPad;
  const _ReportBody({required this.type, required this.data, required this.hPad});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(hPad),
      child: switch (type) {
        _ReportType.profitLoss => _PLReport(data: data),
        _ReportType.balanceSheet => _BSReport(data: data),
        _ReportType.cashFlow => _CFReport(data: data),
        _ReportType.trialBalance => _TBReport(data: data),
        _ReportType.generalLedger => _GLReport(data: data),
        _ReportType.accountsReceivable => _ARReport(data: data),
        _ReportType.accountsPayable => _APReport(data: data),
        _ReportType.expenseReport => _ExpReport(data: data),
        _ReportType.revenueReport => _RevReport(data: data),
      },
    );
  }
}

// ── P&L ───────────────────────────────────────────────────────────────────────

class _PLReport extends StatelessWidget {
  final Map<String, dynamic> data;
  const _PLReport({required this.data});

  @override
  Widget build(BuildContext context) {
    final revenue = (data['totalRevenue'] ?? data['revenue'] ?? 0) as num;
    final expenses = (data['totalExpenses'] ?? data['expenses'] ?? 0) as num;
    final netProfit = (data['netProfit'] ?? data['profit'] ?? revenue - expenses) as num;
    final grossProfit = (data['grossProfit'] ?? revenue) as num;
    final items = data['items'] as List? ?? data['lineItems'] as List? ?? [];

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _SummaryRow3('Revenue', revenue, 'Expenses', expenses, 'Net Profit', netProfit,
          AppTheme.green, AppTheme.red, netProfit >= 0 ? AppTheme.teal : AppTheme.red),
      const SizedBox(height: 16),
      _ReportCard(title: 'Summary', children: [
        _RRow('Gross Revenue', revenue),
        _RRow('Total Expenses', expenses),
        _RDivider(),
        _RRow('Gross Profit', grossProfit, bold: true),
        _RRow('Net Profit', netProfit, bold: true,
            color: netProfit >= 0 ? AppTheme.green : AppTheme.red),
      ]),
      if (items.isNotEmpty) ...[
        const SizedBox(height: 16),
        _ReportCard(title: 'Line Items', children: items.map<Widget>((i) =>
            _RRow(i['name']?.toString() ?? i['account']?.toString() ?? '',
                i['amount'] ?? i['value'] ?? 0)).toList()),
      ],
    ]);
  }
}

// ── Balance Sheet ─────────────────────────────────────────────────────────────

class _BSReport extends StatelessWidget {
  final Map<String, dynamic> data;
  const _BSReport({required this.data});

  @override
  Widget build(BuildContext context) {
    final assets = (data['totalAssets'] ?? data['assets'] ?? 0) as num;
    final liabilities = (data['totalLiabilities'] ?? data['liabilities'] ?? 0) as num;
    final equity = (data['totalEquity'] ?? data['equity'] ?? assets - liabilities) as num;
    final assetItems = data['assetItems'] as List? ?? data['assets_detail'] as List? ?? [];
    final liabItems = data['liabilityItems'] as List? ?? data['liabilities_detail'] as List? ?? [];

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _SummaryRow3('Assets', assets, 'Liabilities', liabilities, 'Equity', equity,
          AppTheme.blue, AppTheme.red, AppTheme.green),
      const SizedBox(height: 16),
      _ReportCard(title: 'Assets', children: [
        ...assetItems.map<Widget>((i) => _RRow(
            i['name']?.toString() ?? i['account']?.toString() ?? '',
            i['amount'] ?? i['value'] ?? 0)),
        _RDivider(),
        _RRow('Total Assets', assets, bold: true, color: AppTheme.blue),
      ]),
      const SizedBox(height: 12),
      _ReportCard(title: 'Liabilities & Equity', children: [
        ...liabItems.map<Widget>((i) => _RRow(
            i['name']?.toString() ?? i['account']?.toString() ?? '',
            i['amount'] ?? i['value'] ?? 0)),
        _RDivider(),
        _RRow('Total Liabilities', liabilities, bold: true, color: AppTheme.red),
        _RRow('Total Equity', equity, bold: true, color: AppTheme.green),
      ]),
    ]);
  }
}

// ── Cash Flow ─────────────────────────────────────────────────────────────────

class _CFReport extends StatelessWidget {
  final Map<String, dynamic> data;
  const _CFReport({required this.data});

  @override
  Widget build(BuildContext context) {
    final operating = (data['operatingActivities'] ?? data['operating'] ?? 0) as num;
    final investing = (data['investingActivities'] ?? data['investing'] ?? 0) as num;
    final financing = (data['financingActivities'] ?? data['financing'] ?? 0) as num;
    final net = (data['netCashFlow'] ?? data['net'] ?? operating + investing + financing) as num;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _SummaryRow2('Net Cash Flow', net, 'Operating', operating,
          net >= 0 ? AppTheme.green : AppTheme.red, AppTheme.blue),
      const SizedBox(height: 16),
      _ReportCard(title: 'Cash Flow Statement', children: [
        _RRow('Operating Activities', operating,
            color: operating >= 0 ? AppTheme.green : AppTheme.red),
        _RRow('Investing Activities', investing,
            color: investing >= 0 ? AppTheme.green : AppTheme.red),
        _RRow('Financing Activities', financing,
            color: financing >= 0 ? AppTheme.green : AppTheme.red),
        _RDivider(),
        _RRow('Net Cash Flow', net, bold: true,
            color: net >= 0 ? AppTheme.green : AppTheme.red),
      ]),
    ]);
  }
}

// ── Trial Balance ─────────────────────────────────────────────────────────────

class _TBReport extends StatelessWidget {
  final Map<String, dynamic> data;
  const _TBReport({required this.data});

  @override
  Widget build(BuildContext context) {
    final totalDebit = (data['totalDebit'] ?? data['debit'] ?? 0) as num;
    final totalCredit = (data['totalCredit'] ?? data['credit'] ?? 0) as num;
    final accounts = data['accounts'] as List? ?? data['entries'] as List? ?? [];
    final balanced = (totalDebit - totalCredit).abs() < 0.01;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _SummaryRow2('Total Debit', totalDebit, 'Total Credit', totalCredit,
          AppTheme.blue, AppTheme.primary),
      const SizedBox(height: 8),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: balanced ? AppTheme.greenBg : AppTheme.redBg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: balanced ? AppTheme.green.withOpacity(0.3) : AppTheme.red.withOpacity(0.3)),
        ),
        child: Row(children: [
          Icon(balanced ? Icons.check_circle_outline : Icons.warning_amber_outlined,
              size: 16, color: balanced ? AppTheme.green : AppTheme.red),
          const SizedBox(width: 8),
          Text(balanced ? 'Trial balance is balanced' : 'Trial balance is NOT balanced',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
                  color: balanced ? AppTheme.green : AppTheme.red)),
        ]),
      ),
      if (accounts.isNotEmpty) ...[
        const SizedBox(height: 16),
        _ReportCard(title: 'Accounts', children: [
          _TBHeader(),
          ...accounts.map<Widget>((a) => _TBRow(
              name: a['name']?.toString() ?? a['account']?.toString() ?? '',
              debit: a['debit'] ?? 0,
              credit: a['credit'] ?? 0)),
          _RDivider(),
          _TBTotalRow(debit: totalDebit, credit: totalCredit),
        ]),
      ],
    ]);
  }
}

// ── General Ledger ────────────────────────────────────────────────────────────

class _GLReport extends StatelessWidget {
  final Map<String, dynamic> data;
  const _GLReport({required this.data});

  @override
  Widget build(BuildContext context) {
    final entries = data['entries'] as List? ?? data['transactions'] as List? ?? [];
    final totalDebit = (data['totalDebit'] ?? 0) as num;
    final totalCredit = (data['totalCredit'] ?? 0) as num;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _SummaryRow2('Total Debit', totalDebit, 'Total Credit', totalCredit,
          AppTheme.blue, AppTheme.primary),
      const SizedBox(height: 16),
      if (entries.isNotEmpty)
        _ReportCard(title: 'Ledger Entries (${entries.length})', children: entries.map<Widget>((e) {
          final date = e['date']?.toString() ?? '';
          final desc = e['description']?.toString() ?? e['narration']?.toString() ?? '';
          final debit = (e['debit'] ?? 0) as num;
          final credit = (e['credit'] ?? 0) as num;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(desc, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                    maxLines: 2, overflow: TextOverflow.ellipsis),
                Text(date, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
              ])),
              const SizedBox(width: 8),
              if (debit > 0) Text(_fmtN(debit),
                  style: const TextStyle(fontSize: 12, color: AppTheme.blue, fontWeight: FontWeight.w600)),
              if (credit > 0) Text(_fmtN(credit),
                  style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w600)),
            ]),
          );
        }).toList()),
      if (entries.isEmpty) const _Empty('No ledger entries found'),
    ]);
  }
}

// ── AR ────────────────────────────────────────────────────────────────────────

class _ARReport extends StatelessWidget {
  final Map<String, dynamic> data;
  const _ARReport({required this.data});

  @override
  Widget build(BuildContext context) {
    final total = (data['totalReceivable'] ?? data['total'] ?? 0) as num;
    final overdue = (data['overdueAmount'] ?? data['overdue'] ?? 0) as num;
    final current = (data['currentAmount'] ?? data['current'] ?? total - overdue) as num;
    final items = data['invoices'] as List? ?? data['items'] as List? ?? [];

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _SummaryRow3('Total AR', total, 'Current', current, 'Overdue', overdue,
          AppTheme.blue, AppTheme.green, AppTheme.red),
      const SizedBox(height: 16),
      if (items.isNotEmpty)
        _ReportCard(title: 'Receivables (${items.length})', children: items.map<Widget>((i) {
          final name = i['customerName']?.toString() ?? i['name']?.toString() ?? '';
          final amount = (i['amount'] ?? i['balance'] ?? 0) as num;
          final due = i['dueDate']?.toString() ?? '';
          final isOverdue = i['isOverdue'] == true || i['status'] == 'overdue';
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                if (due.isNotEmpty)
                  Text('Due: $due', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
              ])),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(_fmtN(amount), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                    color: isOverdue ? AppTheme.red : AppTheme.textPrimary)),
                if (isOverdue)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(color: AppTheme.redBg, borderRadius: BorderRadius.circular(4)),
                    child: const Text('OVERDUE', style: TextStyle(fontSize: 9, color: AppTheme.red, fontWeight: FontWeight.w700)),
                  ),
              ]),
            ]),
          );
        }).toList()),
      if (items.isEmpty) const _Empty('No receivables found'),
    ]);
  }
}

// ── AP ────────────────────────────────────────────────────────────────────────

class _APReport extends StatelessWidget {
  final Map<String, dynamic> data;
  const _APReport({required this.data});

  @override
  Widget build(BuildContext context) {
    final total = (data['totalPayable'] ?? data['total'] ?? 0) as num;
    final overdue = (data['overdueAmount'] ?? data['overdue'] ?? 0) as num;
    final current = (data['currentAmount'] ?? data['current'] ?? total - overdue) as num;
    final items = data['bills'] as List? ?? data['items'] as List? ?? [];

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _SummaryRow3('Total AP', total, 'Current', current, 'Overdue', overdue,
          AppTheme.primary, AppTheme.green, AppTheme.red),
      const SizedBox(height: 16),
      if (items.isNotEmpty)
        _ReportCard(title: 'Payables (${items.length})', children: items.map<Widget>((i) {
          final name = i['vendorName']?.toString() ?? i['name']?.toString() ?? '';
          final amount = (i['amount'] ?? i['balance'] ?? 0) as num;
          final due = i['dueDate']?.toString() ?? '';
          final isOverdue = i['isOverdue'] == true || i['status'] == 'overdue';
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                if (due.isNotEmpty)
                  Text('Due: $due', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
              ])),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(_fmtN(amount), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                    color: isOverdue ? AppTheme.red : AppTheme.textPrimary)),
                if (isOverdue)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(color: AppTheme.redBg, borderRadius: BorderRadius.circular(4)),
                    child: const Text('OVERDUE', style: TextStyle(fontSize: 9, color: AppTheme.red, fontWeight: FontWeight.w700)),
                  ),
              ]),
            ]),
          );
        }).toList()),
      if (items.isEmpty) const _Empty('No payables found'),
    ]);
  }
}

// ── Expense Report ────────────────────────────────────────────────────────────

class _ExpReport extends StatelessWidget {
  final Map<String, dynamic> data;
  const _ExpReport({required this.data});

  @override
  Widget build(BuildContext context) {
    final total = (data['totalExpenses'] ?? data['total'] ?? 0) as num;
    final categories = data['categories'] as List? ?? data['byCategory'] as List? ?? [];
    final items = data['expenses'] as List? ?? data['items'] as List? ?? [];

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _SummaryRow2('Total Expenses', total, 'Categories', categories.length,
          AppTheme.red, AppTheme.amber),
      const SizedBox(height: 16),
      if (categories.isNotEmpty) ...[
        _ReportCard(title: 'By Category', children: categories.map<Widget>((c) {
          final name = c['category']?.toString() ?? c['name']?.toString() ?? '';
          final amount = (c['amount'] ?? c['total'] ?? 0) as num;
          final pct = total > 0 ? (amount / total).clamp(0.0, 1.0) : 0.0;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Expanded(child: Text(name, style: const TextStyle(fontSize: 12),
                    maxLines: 1, overflow: TextOverflow.ellipsis)),
                Text(_fmtN(amount), style: const TextStyle(fontSize: 12,
                    fontWeight: FontWeight.w700, color: AppTheme.red)),
              ]),
              const SizedBox(height: 4),
              ClipRRect(borderRadius: BorderRadius.circular(3),
                  child: LinearProgressIndicator(value: pct, minHeight: 5,
                      backgroundColor: AppTheme.border,
                      valueColor: const AlwaysStoppedAnimation(AppTheme.red))),
            ]),
          );
        }).toList()),
        const SizedBox(height: 12),
      ],
      if (items.isNotEmpty)
        _ReportCard(title: 'Expense Items (${items.length})', children: items.take(20).map<Widget>((i) =>
            _RRow(i['description']?.toString() ?? i['name']?.toString() ?? '',
                i['amount'] ?? i['value'] ?? 0)).toList()),
    ]);
  }
}

// ── Revenue Report ────────────────────────────────────────────────────────────

class _RevReport extends StatelessWidget {
  final Map<String, dynamic> data;
  const _RevReport({required this.data});

  @override
  Widget build(BuildContext context) {
    final total = (data['totalRevenue'] ?? data['total'] ?? 0) as num;
    final collected = (data['collected'] ?? data['paid'] ?? 0) as num;
    final pending = (data['pending'] ?? data['outstanding'] ?? total - collected) as num;
    final sources = data['sources'] as List? ?? data['bySource'] as List? ?? [];
    final items = data['invoices'] as List? ?? data['items'] as List? ?? [];

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _SummaryRow3('Total Revenue', total, 'Collected', collected, 'Pending', pending,
          AppTheme.green, AppTheme.teal, AppTheme.amber),
      const SizedBox(height: 16),
      if (sources.isNotEmpty) ...[
        _ReportCard(title: 'By Source', children: sources.map<Widget>((s) {
          final name = s['source']?.toString() ?? s['name']?.toString() ?? '';
          final amount = (s['amount'] ?? s['total'] ?? 0) as num;
          final pct = total > 0 ? (amount / total).clamp(0.0, 1.0) : 0.0;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Expanded(child: Text(name, style: const TextStyle(fontSize: 12),
                    maxLines: 1, overflow: TextOverflow.ellipsis)),
                Text(_fmtN(amount), style: const TextStyle(fontSize: 12,
                    fontWeight: FontWeight.w700, color: AppTheme.green)),
              ]),
              const SizedBox(height: 4),
              ClipRRect(borderRadius: BorderRadius.circular(3),
                  child: LinearProgressIndicator(value: pct, minHeight: 5,
                      backgroundColor: AppTheme.border,
                      valueColor: const AlwaysStoppedAnimation(AppTheme.green))),
            ]),
          );
        }).toList()),
        const SizedBox(height: 12),
      ],
      if (items.isNotEmpty)
        _ReportCard(title: 'Revenue Items (${items.length})', children: items.take(20).map<Widget>((i) =>
            _RRow(i['description']?.toString() ?? i['name']?.toString() ?? '',
                i['amount'] ?? i['value'] ?? 0)).toList()),
    ]);
  }
}

// ── Shared Report Primitives ──────────────────────────────────────────────────

class _ReportCard extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _ReportCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
          color: AppTheme.textPrimary)),
      const SizedBox(height: 12),
      ...children,
    ]),
  );
}

class _RRow extends StatelessWidget {
  final String label;
  final dynamic value;
  final bool bold;
  final Color? color;
  const _RRow(this.label, this.value, {this.bold = false, this.color});

  @override
  Widget build(BuildContext context) {
    final n = (value ?? 0) as num;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Expanded(child: Text(label,
            style: TextStyle(fontSize: 12,
                fontWeight: bold ? FontWeight.w700 : FontWeight.normal,
                color: bold ? AppTheme.textPrimary : AppTheme.textSecondary),
            maxLines: 2, overflow: TextOverflow.ellipsis)),
        const SizedBox(width: 8),
        Text(_fmtN(n), style: TextStyle(fontSize: 12,
            fontWeight: bold ? FontWeight.w700 : FontWeight.w600,
            color: color ?? (bold ? AppTheme.textPrimary : AppTheme.textSecondary))),
      ]),
    );
  }
}

class _RDivider extends StatelessWidget {
  const _RDivider();
  @override
  Widget build(BuildContext context) => const Padding(
    padding: EdgeInsets.symmetric(vertical: 6),
    child: Divider(height: 1, color: AppTheme.border),
  );
}

class _TBHeader extends StatelessWidget {
  const _TBHeader();
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(children: const [
      Expanded(child: Text('Account', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
          color: AppTheme.textSecondary))),
      SizedBox(width: 60, child: Text('Debit', textAlign: TextAlign.right,
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.blue))),
      SizedBox(width: 60, child: Text('Credit', textAlign: TextAlign.right,
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.primary))),
    ]),
  );
}

class _TBRow extends StatelessWidget {
  final String name;
  final dynamic debit, credit;
  const _TBRow({required this.name, required this.debit, required this.credit});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Row(children: [
      Expanded(child: Text(name, style: const TextStyle(fontSize: 12),
          maxLines: 1, overflow: TextOverflow.ellipsis)),
      SizedBox(width: 60, child: Text(_fmtN(debit as num), textAlign: TextAlign.right,
          style: const TextStyle(fontSize: 12, color: AppTheme.blue))),
      SizedBox(width: 60, child: Text(_fmtN(credit as num), textAlign: TextAlign.right,
          style: const TextStyle(fontSize: 12, color: AppTheme.primary))),
    ]),
  );
}

class _TBTotalRow extends StatelessWidget {
  final num debit, credit;
  const _TBTotalRow({required this.debit, required this.credit});
  @override
  Widget build(BuildContext context) => Row(children: [
    const Expanded(child: Text('TOTAL', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700))),
    SizedBox(width: 60, child: Text(_fmtN(debit), textAlign: TextAlign.right,
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.blue))),
    SizedBox(width: 60, child: Text(_fmtN(credit), textAlign: TextAlign.right,
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primary))),
  ]);
}

class _SummaryRow2 extends StatelessWidget {
  final String l1, l2;
  final num v1, v2;
  final Color c1, c2;
  const _SummaryRow2(this.l1, this.v1, this.l2, this.v2, this.c1, this.c2);
  @override
  Widget build(BuildContext context) => LayoutBuilder(builder: (_, c) {
    final w = (c.maxWidth - 8) / 2;
    return Row(children: [
      _SumTile(l1, v1, c1, w),
      const SizedBox(width: 8),
      _SumTile(l2, v2, c2, w),
    ]);
  });
}

class _SummaryRow3 extends StatelessWidget {
  final String l1, l2, l3;
  final num v1, v2, v3;
  final Color c1, c2, c3;
  const _SummaryRow3(this.l1, this.v1, this.l2, this.v2, this.l3, this.v3, this.c1, this.c2, this.c3);
  @override
  Widget build(BuildContext context) => LayoutBuilder(builder: (_, c) {
    final cols = c.maxWidth < 360 ? 2 : 3;
    if (cols == 2) {
      final w = (c.maxWidth - 8) / 2;
      return Column(children: [
        Row(children: [_SumTile(l1, v1, c1, w), const SizedBox(width: 8), _SumTile(l2, v2, c2, w)]),
        const SizedBox(height: 8),
        _SumTile(l3, v3, c3, c.maxWidth),
      ]);
    }
    final w = (c.maxWidth - 16) / 3;
    return Row(children: [
      _SumTile(l1, v1, c1, w), const SizedBox(width: 8),
      _SumTile(l2, v2, c2, w), const SizedBox(width: 8),
      _SumTile(l3, v3, c3, w),
    ]);
  });
}

class _SumTile extends StatelessWidget {
  final String label;
  final num value;
  final Color color;
  final double width;
  const _SumTile(this.label, this.value, this.color, this.width);
  @override
  Widget build(BuildContext context) => SizedBox(width: width, child: Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: color.withOpacity(0.06), borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.18))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
      const SizedBox(height: 4),
      FittedBox(child: Text(_fmtN(value),
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: color))),
    ]),
  ));
}

class _DateBtn extends StatelessWidget {
  final String label;
  final DateTime date;
  final VoidCallback onTap;
  const _DateBtn({required this.label, required this.date, required this.onTap});
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(8),
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        border: Border.all(color: AppTheme.primary.withOpacity(0.4)),
        borderRadius: BorderRadius.circular(8),
        color: AppTheme.primary.withOpacity(0.04),
      ),
      child: Row(children: [
        const Icon(Icons.calendar_today_outlined, size: 13, color: AppTheme.primary),
        const SizedBox(width: 6),
        Expanded(child: Text('$label: ${AppTheme.fmtDate(date)}',
            style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w500),
            overflow: TextOverflow.ellipsis)),
      ]),
    ),
  );
}

class _Empty extends StatelessWidget {
  final String message;
  const _Empty(this.message);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 40),
    child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.description_outlined, size: 40, color: AppTheme.textMuted),
      const SizedBox(height: 10),
      Text(message, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
    ])),
  );
}

class _ErrView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _ErrView({required this.error, required this.onRetry});
  @override
  Widget build(BuildContext context) => Center(child: Padding(
    padding: const EdgeInsets.all(24),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.error_outline, color: AppTheme.red, size: 44),
      const SizedBox(height: 12),
      Text(error, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
          textAlign: TextAlign.center),
      const SizedBox(height: 16),
      ElevatedButton.icon(onPressed: onRetry,
          icon: const Icon(Icons.refresh, size: 16), label: const Text('Retry')),
    ]),
  ));
}

String _fmtN(num v) {
  if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(1)}M';
  if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
  return v.toStringAsFixed(0);
}
