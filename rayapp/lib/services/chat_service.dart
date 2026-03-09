import '../models/chat_models.dart';
import 'api_service.dart';

class ChatService {
  final _api = ApiService();

  Future<List<Chat>> getChats() async {
    final data = await _api.get('/chat/chats');
    final list = data is List ? data : (data['chats'] ?? []);
    return (list as List).map((j) => Chat.fromJson(j)).toList();
  }

  Future<Chat> getOrCreateChat(String userId) async {
    final data = await _api.post('/chat/chats', {'userId': userId});
    return Chat.fromJson(data['chat'] ?? data);
  }

  Future<List<ChatMessage>> getMessages(String chatId) async {
    final data = await _api.get('/chat/chats/$chatId/messages');
    final list = data is List ? data : (data['messages'] ?? []);
    return (list as List).map((j) => ChatMessage.fromJson(j)).toList();
  }

  Future<ChatMessage> sendMessage(String chatId, String content) async {
    final data = await _api.post('/chat/chats/message', {
      'chatId': chatId,
      'content': content,
      'type': 'text',
    });
    return ChatMessage.fromJson(data['message'] ?? data);
  }

  Future<void> markAsRead(String chatId) async {
    await _api.put('/chat/chats/$chatId/read', {});
  }

  Future<List<ChatUser>> getUsers() async {
    final data = await _api.get('/chat/users');
    final list = data is List ? data : (data['users'] ?? []);
    return (list as List).map((j) => ChatUser.fromJson(j)).toList();
  }
}
