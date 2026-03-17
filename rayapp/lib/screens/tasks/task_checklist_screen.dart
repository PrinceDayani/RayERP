import 'package:flutter/material.dart';
import '../../models/task.dart';
import '../../services/task_service.dart';

class TaskChecklistScreen extends StatefulWidget {
  final String taskId;

  const TaskChecklistScreen({super.key, required this.taskId});

  @override
  State<TaskChecklistScreen> createState() => _TaskChecklistScreenState();
}

class _TaskChecklistScreenState extends State<TaskChecklistScreen> {
  final TaskService _taskService = TaskService();
  List<ChecklistItem> _checklist = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadChecklist();
  }

  Future<void> _loadChecklist() async {
    try {
      final task = await _taskService.getTaskById(widget.taskId);
      setState(() {
        _checklist = task.checklist;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _addItem() async {
    final controller = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Checklist Item'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'Item text',
            border: OutlineInputBorder(),
          ),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('Add'),
          ),
        ],
      ),
    );

    if (result != null && result.trim().isNotEmpty) {
      try {
        await _taskService.addChecklistItem(widget.taskId, result.trim());
        _loadChecklist();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Item added')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }

  Future<void> _toggleItem(String itemId, bool completed) async {
    try {
      await _taskService.toggleChecklistItem(widget.taskId, itemId, !completed);
      _loadChecklist();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _deleteItem(String itemId) async {
    try {
      await _taskService.deleteChecklistItem(widget.taskId, itemId);
      _loadChecklist();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Item deleted')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final completed = _checklist.where((i) => i.completed).length;
    final total = _checklist.length;
    final progress = total > 0 ? completed / total : 0.0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Checklist'),
      ),
      body: Column(
        children: [
          if (total > 0)
            Container(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('$completed of $total completed'),
                      Text('${(progress * 100).toInt()}%'),
                    ],
                  ),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(value: progress, minHeight: 8),
                ],
              ),
            ),
          Expanded(
            child: _checklist.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.checklist, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('No checklist items yet', style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  )
                : ReorderableListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _checklist.length,
                    onReorder: (oldIndex, newIndex) {
                      // Handle reorder if needed
                    },
                    itemBuilder: (context, index) {
                      final item = _checklist[index];
                      return Card(
                        key: ValueKey(item.id),
                        child: ListTile(
                          leading: Checkbox(
                            value: item.completed,
                            onChanged: (value) => _toggleItem(item.id, item.completed),
                          ),
                          title: Text(
                            item.text,
                            style: TextStyle(
                              decoration: item.completed ? TextDecoration.lineThrough : null,
                              color: item.completed ? Colors.grey : null,
                            ),
                          ),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete, color: Colors.red),
                            onPressed: () => _deleteItem(item.id),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addItem,
        child: const Icon(Icons.add),
      ),
    );
  }
}
