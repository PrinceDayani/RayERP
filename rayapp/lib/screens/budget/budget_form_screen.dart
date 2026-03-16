import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/project_budget_service.dart';

class BudgetFormScreen extends StatefulWidget {
  final Budget? existing;
  const BudgetFormScreen({super.key, this.existing});
  @override
  State<BudgetFormScreen> createState() => _BudgetFormScreenState();
}

class _BudgetFormScreenState extends State<BudgetFormScreen> {
  final _svc = BudgetService();
  final _formKey = GlobalKey<FormState>();

  final _nameCtrl = TextEditingController();
  final _totalCtrl = TextEditingController();
  final _projectIdCtrl = TextEditingController();
  final _deptIdCtrl = TextEditingController();

  String _budgetType = 'project';
  String _currency = 'USD';
  String _fiscalPeriod = 'Q1';
  int _fiscalYear = DateTime.now().year;
  bool _saving = false;

  final List<_CatEntry> _categories = [];

  static const _currencies = [
    'USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD'
  ];
  static const _types = ['project', 'department', 'special'];
  static const _periods = ['Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2', 'Annual'];
  static const _catTypes = [
    'personnel', 'equipment', 'software', 'travel',
    'marketing', 'operations', 'other'
  ];

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    if (e != null) {
      _nameCtrl.text = e.budgetName ?? '';
      _totalCtrl.text = e.totalBudget.toStringAsFixed(0);
      _budgetType = e.budgetType;
      _currency = e.currency;
      _fiscalPeriod = e.fiscalPeriod;
      _fiscalYear = e.fiscalYear;
      _projectIdCtrl.text = e.projectId ?? '';
      _deptIdCtrl.text = e.departmentId ?? '';
      for (final c in e.categories) {
        _categories.add(_CatEntry(
          nameCtrl: TextEditingController(text: c.name),
          amountCtrl:
              TextEditingController(text: c.allocated.toStringAsFixed(0)),
          type: c.type.isNotEmpty ? c.type : 'other',
        ));
      }
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _totalCtrl.dispose();
    _projectIdCtrl.dispose();
    _deptIdCtrl.dispose();
    for (final c in _categories) {
      c.nameCtrl.dispose();
      c.amountCtrl.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_budgetType == 'project' && _projectIdCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Project ID is required for project budgets')));
      return;
    }
    if (_budgetType == 'department' && _deptIdCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Department ID is required for department budgets')));
      return;
    }

    setState(() => _saving = true);
    try {
      final body = <String, dynamic>{
        'totalBudget': double.parse(_totalCtrl.text.trim()),
        'currency': _currency,
        'budgetType': _budgetType,
        'fiscalYear': _fiscalYear,
        'fiscalPeriod': _fiscalPeriod,
        if (_nameCtrl.text.trim().isNotEmpty) 'budgetName': _nameCtrl.text.trim(),
        if (_projectIdCtrl.text.trim().isNotEmpty)
          'projectId': _projectIdCtrl.text.trim(),
        if (_deptIdCtrl.text.trim().isNotEmpty)
          'departmentId': _deptIdCtrl.text.trim(),
        if (_categories.isNotEmpty)
          'categories': _categories
              .where((c) => c.nameCtrl.text.trim().isNotEmpty)
              .map((c) => {
                    'name': c.nameCtrl.text.trim(),
                    'allocatedAmount':
                        double.tryParse(c.amountCtrl.text.trim()) ?? 0,
                    'type': c.type,
                  })
              .toList(),
      };

      if (widget.existing != null) {
        await _svc.update(widget.existing!.id, body);
      } else {
        await _svc.create(body);
      }

      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
    if (mounted) setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.existing != null;
    final now = DateTime.now().year;
    final years = List.generate(5, (i) => now - 2 + i);

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: Text(isEdit ? 'Edit Budget' : 'New Budget'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: AppTheme.primary))
                : Text(isEdit ? 'Update' : 'Create',
                    style: const TextStyle(
                        color: AppTheme.primary, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _Section('Basic Info'),
            const SizedBox(height: 10),
            TextFormField(
              controller: _nameCtrl,
              decoration: const InputDecoration(
                  labelText: 'Budget Name', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _totalCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                  labelText: 'Total Budget *', border: OutlineInputBorder()),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Required';
                if (double.tryParse(v.trim()) == null) return 'Invalid number';
                if (double.parse(v.trim()) <= 0) return 'Must be > 0';
                return null;
              },
            ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _currency,
                  decoration: const InputDecoration(
                      labelText: 'Currency', border: OutlineInputBorder()),
                  items: _currencies
                      .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                      .toList(),
                  onChanged: (v) => setState(() => _currency = v ?? _currency),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _budgetType,
                  decoration: const InputDecoration(
                      labelText: 'Type *', border: OutlineInputBorder()),
                  items: _types
                      .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                      .toList(),
                  onChanged: (v) => setState(() => _budgetType = v ?? _budgetType),
                ),
              ),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: DropdownButtonFormField<int>(
                  initialValue: _fiscalYear,
                  decoration: const InputDecoration(
                      labelText: 'Fiscal Year', border: OutlineInputBorder()),
                  items: years
                      .map((y) =>
                          DropdownMenuItem(value: y, child: Text(y.toString())))
                      .toList(),
                  onChanged: (v) =>
                      setState(() => _fiscalYear = v ?? _fiscalYear),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _fiscalPeriod,
                  decoration: const InputDecoration(
                      labelText: 'Period', border: OutlineInputBorder()),
                  items: _periods
                      .map((p) => DropdownMenuItem(value: p, child: Text(p)))
                      .toList(),
                  onChanged: (v) =>
                      setState(() => _fiscalPeriod = v ?? _fiscalPeriod),
                ),
              ),
            ]),
            const SizedBox(height: 16),
            _Section('Association'),
            const SizedBox(height: 10),
            if (_budgetType == 'project' || _budgetType == 'special')
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: TextFormField(
                  controller: _projectIdCtrl,
                  decoration: InputDecoration(
                    labelText: _budgetType == 'project'
                        ? 'Project ID *'
                        : 'Project ID (optional)',
                    border: const OutlineInputBorder(),
                  ),
                ),
              ),
            if (_budgetType == 'department' || _budgetType == 'special')
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: TextFormField(
                  controller: _deptIdCtrl,
                  decoration: InputDecoration(
                    labelText: _budgetType == 'department'
                        ? 'Department ID *'
                        : 'Department ID (optional)',
                    border: const OutlineInputBorder(),
                  ),
                ),
              ),
            const SizedBox(height: 4),
            _Section('Categories'),
            const SizedBox(height: 10),
            ..._categories.asMap().entries.map((entry) {
              final i = entry.key;
              final cat = entry.value;
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.border)),
                child: Column(children: [
                  Row(children: [
                    Expanded(
                        child: TextFormField(
                      controller: cat.nameCtrl,
                      decoration: const InputDecoration(
                          labelText: 'Category Name',
                          border: OutlineInputBorder(),
                          isDense: true),
                    )),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.delete_outline,
                          color: AppTheme.red, size: 20),
                      onPressed: () =>
                          setState(() => _categories.removeAt(i)),
                    ),
                  ]),
                  const SizedBox(height: 8),
                  Row(children: [
                    Expanded(
                        child: TextFormField(
                      controller: cat.amountCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                          labelText: 'Amount',
                          border: OutlineInputBorder(),
                          isDense: true),
                    )),
                    const SizedBox(width: 8),
                    Expanded(
                        child: DropdownButtonFormField<String>(
                      initialValue: cat.type,
                      isDense: true,
                      decoration: const InputDecoration(
                          labelText: 'Type',
                          border: OutlineInputBorder(),
                          isDense: true),
                      items: _catTypes
                          .map((t) =>
                              DropdownMenuItem(value: t, child: Text(t)))
                          .toList(),
                      onChanged: (v) =>
                          setState(() => cat.type = v ?? cat.type),
                    )),
                  ]),
                ]),
              );
            }),
            OutlinedButton.icon(
              onPressed: () => setState(() => _categories.add(_CatEntry(
                    nameCtrl: TextEditingController(),
                    amountCtrl: TextEditingController(),
                    type: 'other',
                  ))),
              icon: const Icon(Icons.add, size: 16),
              label: const Text('Add Category'),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : Text(isEdit ? 'Update Budget' : 'Create Budget'),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _CatEntry {
  TextEditingController nameCtrl;
  TextEditingController amountCtrl;
  String type;
  _CatEntry(
      {required this.nameCtrl, required this.amountCtrl, required this.type});
}

class _Section extends StatelessWidget {
  final String title;
  const _Section(this.title);
  @override
  Widget build(BuildContext context) => Text(title,
      style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: AppTheme.textPrimary));
}
