import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/task.dart';
import '../../services/task_service.dart';

class TaskRecurringScreen extends StatefulWidget {
  final Task task;
  const TaskRecurringScreen({super.key, required this.task});

  @override
  State<TaskRecurringScreen> createState() => _TaskRecurringScreenState();
}

class _TaskRecurringScreenState extends State<TaskRecurringScreen> {
  final _svc = TaskService();
  bool _enabled = false;
  String _pattern = 'daily';
  bool _saving = false;

  static const _patterns = [
    ('daily', 'Daily'),
    ('weekly', 'Weekly'),
    ('biweekly', 'Every 2 Weeks'),
    ('monthly', 'Monthly'),
    ('quarterly', 'Quarterly'),
  ];

  @override
  void initState() {
    super.initState();
    _enabled = widget.task.isRecurring;
    _pattern = widget.task.recurrencePattern ?? 'daily';
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await _svc.setRecurring(widget.task.id, _pattern, _enabled);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Recurrence updated'),
              backgroundColor: AppTheme.green),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.red));
    }
    if (mounted) setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        title: const Text('Recurring Task'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    width: 18, height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Text('Save',
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
      body: AppTheme.constrain(ListView(
        padding: EdgeInsets.all(AppTheme.hPad(context)),
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE5E7EB)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(children: [
              const Icon(Icons.repeat, color: AppTheme.purple, size: 20),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                  Text('Enable Recurrence',
                      style: TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w600)),
                  Text('Task will repeat automatically',
                      style: TextStyle(
                          fontSize: 12, color: AppTheme.textSecondary)),
                ]),
              ),
              Switch(
                value: _enabled,
                onChanged: (v) => setState(() => _enabled = v),
                activeColor: AppTheme.primary,
              ),
            ]),
          ),
          if (_enabled) ...[
            const SizedBox(height: 16),
            const Text('Repeat Pattern',
                style:
                    TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            ..._patterns.map((p) {
              final selected = _pattern == p.$1;
              return GestureDetector(
                onTap: () => setState(() => _pattern = p.$1),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: selected
                        ? AppTheme.primary.withOpacity(0.06)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: selected
                            ? AppTheme.primary
                            : AppTheme.border),
                  ),
                  child: Row(children: [
                    Icon(
                      selected
                          ? Icons.radio_button_checked
                          : Icons.radio_button_unchecked,
                      color: selected
                          ? AppTheme.primary
                          : AppTheme.textSecondary,
                      size: 18,
                    ),
                    const SizedBox(width: 10),
                    Text(p.$2,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: selected
                              ? FontWeight.w600
                              : FontWeight.normal,
                          color: selected
                              ? AppTheme.primary
                              : AppTheme.textPrimary,
                        )),
                  ]),
                ),
              );
            }),
          ],
        ],
      )),
    );
  }
}
