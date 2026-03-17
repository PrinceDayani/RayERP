import 'package:flutter/material.dart';
import '../../models/task.dart';
import '../../services/task_service.dart';

class TaskWatchersScreen extends StatefulWidget {
  final String taskId;

  const TaskWatchersScreen({super.key, required this.taskId});

  @override
  State<TaskWatchersScreen> createState() => _TaskWatchersScreenState();
}

class _TaskWatchersScreenState extends State<TaskWatchersScreen> {
  final TaskService _taskService = TaskService();
  List<TaskAssignee> _watchers = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadWatchers();
  }

  Future<void> _loadWatchers() async {
    try {
      final task = await _taskService.getTaskById(widget.taskId);
      setState(() {
        _watchers = task.watchers;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Watchers (${_watchers.length})'),
      ),
      body: _watchers.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.visibility_outlined, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('No watchers yet', style: TextStyle(color: Colors.grey)),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _watchers.length,
              itemBuilder: (context, index) {
                final watcher = _watchers[index];
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      child: Text(watcher.name.substring(0, 1).toUpperCase()),
                    ),
                    title: Text(watcher.name),
                    trailing: IconButton(
                      icon: const Icon(Icons.remove_circle, color: Colors.red),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Remove watcher feature coming soon')),
                        );
                      },
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Add watcher feature coming soon')),
          );
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
