import 'package:flutter/material.dart';
import '../../models/task.dart';
import '../../services/task_service.dart';

class TaskAttachmentsScreen extends StatefulWidget {
  final String taskId;

  const TaskAttachmentsScreen({super.key, required this.taskId});

  @override
  State<TaskAttachmentsScreen> createState() => _TaskAttachmentsScreenState();
}

class _TaskAttachmentsScreenState extends State<TaskAttachmentsScreen> {
  final TaskService _taskService = TaskService();
  List<TaskAttachment> _attachments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadAttachments();
  }

  Future<void> _loadAttachments() async {
    try {
      final task = await _taskService.getTaskById(widget.taskId);
      setState(() {
        _attachments = task.attachments;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  IconData _getFileIcon(String mimetype) {
    if (mimetype.startsWith('image/')) return Icons.image;
    if (mimetype.startsWith('video/')) return Icons.video_file;
    if (mimetype.startsWith('audio/')) return Icons.audio_file;
    if (mimetype.contains('pdf')) return Icons.picture_as_pdf;
    if (mimetype.contains('word') || mimetype.contains('document')) return Icons.description;
    if (mimetype.contains('excel') || mimetype.contains('spreadsheet')) return Icons.table_chart;
    if (mimetype.contains('zip') || mimetype.contains('compressed')) return Icons.folder_zip;
    return Icons.insert_drive_file;
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
        title: Text('Attachments (${_attachments.length})'),
      ),
      body: _attachments.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.attach_file, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('No attachments yet', style: TextStyle(color: Colors.grey)),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _attachments.length,
              itemBuilder: (context, index) {
                final attachment = _attachments[index];
                return Card(
                  child: ListTile(
                    leading: Icon(
                      _getFileIcon(attachment.mimetype),
                      size: 40,
                      color: Theme.of(context).primaryColor,
                    ),
                    title: Text(
                      attachment.originalName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Text(
                      '${attachment.sizeLabel} • ${_formatDate(attachment.uploadedAt)}',
                      style: const TextStyle(fontSize: 12),
                    ),
                    trailing: IconButton(
                      icon: const Icon(Icons.download),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Download feature coming soon')),
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
            const SnackBar(content: Text('Upload feature coming soon')),
          );
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
