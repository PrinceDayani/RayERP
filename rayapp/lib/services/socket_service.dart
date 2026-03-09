import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/api_config.dart';
import '../utils/constants.dart';

class SocketService extends ChangeNotifier {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  bool _connected = false;
  bool get isConnected => _connected;

  // Stream controllers for typed events
  final _newMessage = StreamController<Map<String, dynamic>>.broadcast();
  final _typing = StreamController<Map<String, dynamic>>.broadcast();
  final _stopTyping = StreamController<Map<String, dynamic>>.broadcast();
  final _notification = StreamController<Map<String, dynamic>>.broadcast();
  final _broadcastMsg = StreamController<Map<String, dynamic>>.broadcast();
  final _dashboardUpdate = StreamController<Map<String, dynamic>>.broadcast();
  final _activityLog = StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get onNewMessage => _newMessage.stream;
  Stream<Map<String, dynamic>> get onTyping => _typing.stream;
  Stream<Map<String, dynamic>> get onStopTyping => _stopTyping.stream;
  Stream<Map<String, dynamic>> get onNotification => _notification.stream;
  Stream<Map<String, dynamic>> get onBroadcast => _broadcastMsg.stream;
  Stream<Map<String, dynamic>> get onDashboardUpdate => _dashboardUpdate.stream;
  Stream<Map<String, dynamic>> get onActivityLog => _activityLog.stream;

  Future<void> connect() async {
    if (_socket != null && _connected) return;
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConstants.tokenKey) ?? '';
    if (token.isEmpty) return;

    final baseUrl = ApiConfig.baseUrl.replaceAll('/api', '');

    _socket = io.io(
      baseUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(double.infinity)
          .setReconnectionDelay(2000)
          .build(),
    );

    _socket!.onConnect((_) {
      _connected = true;
      notifyListeners();
    });

    _socket!.onDisconnect((_) {
      _connected = false;
      notifyListeners();
    });

    _socket!.on('new_message', (data) {
      if (data is Map<String, dynamic>) _newMessage.add(data);
    });

    _socket!.on('user_typing', (data) {
      if (data is Map<String, dynamic>) _typing.add(data);
    });

    _socket!.on('user_stop_typing', (data) {
      if (data is Map<String, dynamic>) _stopTyping.add(data);
    });

    _socket!.on('notification:received', (data) {
      if (data is Map<String, dynamic>) _notification.add(data);
    });

    _socket!.on('broadcast:new', (data) {
      if (data is Map<String, dynamic>) _broadcastMsg.add(data);
    });

    _socket!.on('dashboard:update', (data) {
      if (data is Map<String, dynamic>) _dashboardUpdate.add(data);
    });

    _socket!.on('activity_log', (data) {
      if (data is Map<String, dynamic>) _activityLog.add(data);
    });

    _socket!.connect();
  }

  void joinChat(String chatId) => _socket?.emit('join_chat', chatId);
  void leaveChat(String chatId) => _socket?.emit('leave_chat', chatId);

  void sendTyping(String chatId, String userId) =>
      _socket?.emit('typing', {'chatId': chatId, 'userId': userId});

  void sendStopTyping(String chatId, String userId) =>
      _socket?.emit('stop_typing', {'chatId': chatId, 'userId': userId});

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _connected = false;
    notifyListeners();
  }

  @override
  void dispose() {
    disconnect();
    _newMessage.close();
    _typing.close();
    _stopTyping.close();
    _notification.close();
    _broadcastMsg.close();
    _dashboardUpdate.close();
    _activityLog.close();
    super.dispose();
  }
}
