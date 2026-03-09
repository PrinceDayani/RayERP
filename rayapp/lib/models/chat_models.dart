class ChatUser {
  final String id;
  final String name;
  final String email;

  const ChatUser({required this.id, required this.name, required this.email});

  factory ChatUser.fromJson(Map<String, dynamic> j) => ChatUser(
        id: j['_id'] ?? j['id'] ?? '',
        name: j['name'] ?? '',
        email: j['email'] ?? '',
      );

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }
}

class ChatMessage {
  final String id;
  final String senderId;
  final String senderName;
  final String content;
  final DateTime timestamp;
  final bool read;
  final String type; // text | file | image

  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.content,
    required this.timestamp,
    required this.read,
    required this.type,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> j) => ChatMessage(
        id: j['_id'] ?? '',
        senderId: j['sender'] is Map ? (j['sender']['_id'] ?? '') : (j['sender'] ?? ''),
        senderName: j['senderName'] ?? '',
        content: j['content'] ?? '',
        timestamp: j['timestamp'] != null ? DateTime.parse(j['timestamp']).toLocal() : DateTime.now(),
        read: j['read'] ?? false,
        type: j['type'] ?? 'text',
      );
}

class Chat {
  final String id;
  final List<ChatUser> participants;
  final String? lastMessage;
  final DateTime? lastMessageTime;
  final bool isGroup;
  final String? groupName;
  int unreadCount;

  Chat({
    required this.id,
    required this.participants,
    this.lastMessage,
    this.lastMessageTime,
    required this.isGroup,
    this.groupName,
    this.unreadCount = 0,
  });

  factory Chat.fromJson(Map<String, dynamic> j) => Chat(
        id: j['_id'] ?? '',
        participants: (j['participants'] as List? ?? [])
            .map((p) => ChatUser.fromJson(p is Map<String, dynamic> ? p : {}))
            .toList(),
        lastMessage: j['lastMessage'],
        lastMessageTime: j['lastMessageTime'] != null
            ? DateTime.parse(j['lastMessageTime']).toLocal()
            : null,
        isGroup: j['isGroup'] ?? false,
        groupName: j['groupName'],
        unreadCount: j['unreadCount'] ?? 0,
      );

  String displayName(String currentUserId) {
    if (isGroup) return groupName ?? 'Group';
    final other = participants.where((p) => p.id != currentUserId).toList();
    return other.isNotEmpty ? other.first.name : 'Unknown';
  }

  String displayInitials(String currentUserId) {
    if (isGroup) return groupName?.isNotEmpty == true ? groupName![0].toUpperCase() : 'G';
    final other = participants.where((p) => p.id != currentUserId).toList();
    return other.isNotEmpty ? other.first.initials : '?';
  }
}
