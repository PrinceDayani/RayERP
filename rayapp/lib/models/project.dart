class Project {
  final String id;
  final String name;
  final String description;
  final String status;
  final String priority;
  final DateTime startDate;
  final DateTime endDate;
  final double budget;
  final double spentBudget;
  final String currency;
  final int progress;
  final String? client;

  Project({
    required this.id,
    required this.name,
    required this.description,
    required this.status,
    required this.priority,
    required this.startDate,
    required this.endDate,
    required this.budget,
    required this.spentBudget,
    required this.currency,
    required this.progress,
    this.client,
  });

  factory Project.fromJson(Map<String, dynamic> json) => Project(
        id: json['_id'] ?? '',
        name: json['name'] ?? '',
        description: json['description'] ?? '',
        status: json['status'] ?? 'planning',
        priority: json['priority'] ?? 'medium',
        startDate: DateTime.tryParse(json['startDate'] ?? '') ?? DateTime.now(),
        endDate: DateTime.tryParse(json['endDate'] ?? '') ?? DateTime.now(),
        budget: (json['budget'] ?? 0).toDouble(),
        spentBudget: (json['spentBudget'] ?? 0).toDouble(),
        currency: json['currency'] ?? 'USD',
        progress: (json['progress'] ?? 0).toInt(),
        client: json['client'],
      );
}
