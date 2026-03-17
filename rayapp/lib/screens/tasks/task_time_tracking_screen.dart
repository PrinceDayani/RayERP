import 'package:flutter/material.dart';
import '../../models/task.dart';
import '../../services/task_service.dart';

class TaskTimeTrackingScreen extends StatefulWidget {
  final String taskId;

  const TaskTimeTrackingScreen({super.key, required this.taskId});

  @override
  State<TaskTimeTrackingScreen> createState() => _TaskTimeTrackingScreenState();
}

class _TaskTimeTrackingScreenState extends State<TaskTimeTrackingScreen> {
  final TaskService _taskService = TaskService();
  List<TimeEntry> _timeEntries = [];
  TimeEntry? _activeTimer;
  double _estimatedHours = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadTimeEntries();
  }

  Future<void> _loadTimeEntries() async {
    try {
      final task = await _taskService.getTaskById(widget.taskId);
      setState(() {
        _timeEntries = task.timeEntries;
        _activeTimer = _timeEntries.where((e) => e.isActive).firstOrNull;
        _estimatedHours = task.estimatedHours;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading time entries: $e')),
        );
      }
    }
  }

  Future<void> _startTimer() async {
    final description = await _showDescriptionDialog();
    if (description == null) return;

    try {
      await _taskService.startTimer(widget.taskId, description);
      _loadTimeEntries();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Timer started')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error starting timer: $e')),
        );
      }
    }
  }

  Future<void> _stopTimer() async {
    try {
      await _taskService.stopTimer(widget.taskId);
      _loadTimeEntries();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Timer stopped')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error stopping timer: $e')),
        );
      }
    }
  }

  Future<String?> _showDescriptionDialog() async {
    final controller = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Start Timer'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'Description (optional)',
            hintText: 'What are you working on?',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('Start'),
          ),
        ],
      ),
    );
  }

  int get _totalMinutes => _timeEntries.fold(0, (sum, e) => sum + e.duration);

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final totalHours = _totalMinutes ~/ 60;
    final remainingMinutes = _totalMinutes % 60;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Time Tracking'),
      ),
      body: Column(
        children: [
          if (_activeTimer != null)
            Container(
              color: Colors.green.shade50,
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Icon(Icons.timer, color: Colors.green),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Timer Running', style: TextStyle(fontWeight: FontWeight.bold)),
                        Text('Started: ${_activeTimer!.startTime.toString().substring(0, 16)}'),
                        if (_activeTimer!.description != null)
                          Text(_activeTimer!.description!, style: const TextStyle(fontSize: 12)),
                      ],
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: _stopTimer,
                    icon: const Icon(Icons.stop),
                    label: const Text('Stop'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  ),
                ],
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          const Text('Estimated', style: TextStyle(color: Colors.grey)),
                          Text('${_estimatedHours}h', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          const Text('Logged', style: TextStyle(color: Colors.grey)),
                          Text('${totalHours}h ${remainingMinutes}m', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text('Time Entries', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ),
          ),
          Expanded(
            child: _timeEntries.isEmpty
                ? const Center(child: Text('No time entries yet'))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _timeEntries.length,
                    itemBuilder: (context, index) {
                      final entry = _timeEntries[index];
                      return Card(
                        child: ListTile(
                          leading: const Icon(Icons.access_time),
                          title: Text(entry.startTime.toString().substring(0, 16)),
                          subtitle: entry.description != null ? Text(entry.description!) : null,
                          trailing: Chip(
                            label: Text('${entry.duration}m'),
                            backgroundColor: Colors.blue.shade100,
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: _activeTimer == null
          ? FloatingActionButton.extended(
              onPressed: _startTimer,
              icon: const Icon(Icons.play_arrow),
              label: const Text('Start Timer'),
            )
          : null,
    );
  }
}
