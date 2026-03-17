import 'package:flutter/material.dart';
import '../../models/task.dart';
import '../../services/task_service.dart';

class TaskSubtasksScreen extends StatefulWidget {
  final String taskId;

  const TaskSubtasksScreen({super.key, required this.taskId});

  @override
  State<TaskSubtasksScreen> createState() => _TaskSubtasksScreenState();
}

class _TaskSubtasksScreenState extends State<TaskSubtasksScreen> {
  final TaskService _taskService = TaskService();
  List<SubtaskRef> _subtasks = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadSubtasks();
  }

  Future<void> _loadSubtasks() async {
    try {
      final task = await _taskService.getTaskById(widget.taskId);
      setState(() {
        _subtasks = task.subtasks;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'completed':
        return Colors.green;
      case 'in-progress':
        return Colors.blue;
      case 'blocked':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final completed = _subtasks.where((s) => s.status == 'completed').length;
    final total = _subtasks.length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Subtasks'),
      ),
      body: Column(
        children: [
          if (total > 0)
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.blue.shade50,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '$completed of $total completed',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Text('${total > 0 ? ((completed / total) * 100).toInt() : 0}%'),
                ],
              ),
            ),
          Expanded(
            child: _subtasks.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.subdirectory_arrow_right, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('No subtasks yet', style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _subtasks.length,
                    itemBuilder: (context, index) {
                      final subtask = _subtasks[index];
                      return Card(
                        child: ListTile(
                          leading: Container(
                            width: 12,
                            height: 12,
                            decoration: BoxDecoration(
                              color: _getStatusColor(subtask.status),
                              shape: BoxShape.circle,
                            ),
                          ),
                          title: Text(subtask.title),
                          subtitle: Text(
                            subtask.status.toUpperCase(),
                            style: TextStyle(
                              color: _getStatusColor(subtask.status),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                          onTap: () {
                            // Navigate to subtask detail
                          },
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Create subtask feature coming soon')),
          );
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
