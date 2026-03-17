import 'package:flutter/material.dart';

class AssignmentTypeIndicator extends StatelessWidget {
  final String? assignmentType;
  final String? taskType;

  const AssignmentTypeIndicator({
    super.key,
    this.assignmentType,
    this.taskType,
  });

  @override
  Widget build(BuildContext context) {
    if (assignmentType == null && taskType == null) return const SizedBox.shrink();

    final isSelfAssigned = assignmentType == 'self-assigned';
    final isIndividual = taskType == 'individual';

    Color color;
    IconData icon;
    String label;

    if (isSelfAssigned) {
      color = Colors.blue;
      icon = Icons.person;
      label = 'Self';
    } else if (isIndividual) {
      color = Colors.purple;
      icon = Icons.person_outline;
      label = 'Individual';
    } else {
      color = Colors.green;
      icon = Icons.group;
      label = 'Project';
    }

    return Chip(
      avatar: Icon(icon, size: 16, color: color),
      label: Text(label, style: TextStyle(fontSize: 12, color: color)),
      backgroundColor: color.withOpacity(0.1),
      side: BorderSide(color: color, width: 1),
      padding: const EdgeInsets.symmetric(horizontal: 4),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }
}
