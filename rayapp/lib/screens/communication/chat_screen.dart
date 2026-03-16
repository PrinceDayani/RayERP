import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../config/app_theme.dart';
import '../../models/chat_models.dart';
import '../../services/auth_provider.dart';
import '../../services/chat_service.dart';
import '../../services/socket_service.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _chatService = ChatService();
  List<Chat> _chats = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
    // Listen for new messages to refresh unread counts
    context.read<SocketService>().onNewMessage.listen((_) {
      if (mounted) _load();
    });
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() { _loading = _chats.isEmpty; _error = null; });
    try {
      final chats = await _chatService.getChats();
      if (mounted) setState(() { _chats = chats; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    final userId = auth.user?.id ?? '';

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      floatingActionButton: FloatingActionButton(
        heroTag: 'chat_fab',
        backgroundColor: AppTheme.primary,
        onPressed: () => _showNewChatDialog(userId),
        child: const Icon(Icons.edit_outlined, color: Colors.white),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? _ErrorState(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppTheme.primary,
                  child: _chats.isEmpty
                      ? _EmptyState(
                          icon: Icons.chat_bubble_outline,
                          title: 'No conversations yet',
                          subtitle: 'Tap + to start a new chat',
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          itemCount: _chats.length,
                          separatorBuilder: (_, _) => const Divider(height: 1, indent: 72),
                          itemBuilder: (_, i) => _ChatTile(
                            chat: _chats[i],
                            currentUserId: userId,
                            onTap: () async {
                              await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => _ChatDetailScreen(
                                    chat: _chats[i],
                                    currentUserId: userId,
                                  ),
                                ),
                              );
                              _load();
                            },
                          ),
                        ),
                ),
    );
  }

  Future<void> _showNewChatDialog(String currentUserId) async {
    final users = await _chatService.getUsers();
    if (!mounted) return;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _NewChatSheet(
        users: users,
        currentUserId: currentUserId,
        onSelect: (user) async {
          Navigator.pop(context);
          try {
            final chat = await _chatService.getOrCreateChat(user.id);
            if (!mounted) return;
            await Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => _ChatDetailScreen(chat: chat, currentUserId: currentUserId),
              ),
            );
            _load();
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
            }
          }
        },
      ),
    );
  }
}

// ── Chat list tile ─────────────────────────────────────────────────────────────

class _ChatTile extends StatelessWidget {
  final Chat chat;
  final String currentUserId;
  final VoidCallback onTap;

  const _ChatTile({required this.chat, required this.currentUserId, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final name = chat.displayName(currentUserId);
    final initials = chat.displayInitials(currentUserId);
    final hasUnread = chat.unreadCount > 0;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          children: [
            _Avatar(initials: initials, isGroup: chat.isGroup),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          name,
                          style: TextStyle(
                            fontWeight: hasUnread ? FontWeight.w700 : FontWeight.w600,
                            fontSize: 14,
                            color: Theme.of(context).colorScheme.onSurface,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (chat.lastMessageTime != null)
                        Text(
                          timeago.format(chat.lastMessageTime!),
                          style: TextStyle(
                            fontSize: 11,
                            color: hasUnread ? AppTheme.primary : AppTheme.textMuted,
                            fontWeight: hasUnread ? FontWeight.w600 : FontWeight.normal,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          chat.lastMessage ?? 'No messages yet',
                          style: TextStyle(
                            fontSize: 12,
                            color: hasUnread ? AppTheme.textPrimary : AppTheme.textSecondary,
                            fontWeight: hasUnread ? FontWeight.w500 : FontWeight.normal,
                          ),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                      ),
                      if (hasUnread)
                        Container(
                          margin: const EdgeInsets.only(left: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${chat.unreadCount}',
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Chat detail screen ─────────────────────────────────────────────────────────

class _ChatDetailScreen extends StatefulWidget {
  final Chat chat;
  final String currentUserId;

  const _ChatDetailScreen({required this.chat, required this.currentUserId});

  @override
  State<_ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<_ChatDetailScreen> {
  final _chatService = ChatService();
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  List<ChatMessage> _messages = [];
  bool _loading = true;
  bool _sending = false;
  bool _someoneTyping = false;
  String _typingName = '';
  Timer? _typingTimer;
  bool _isTyping = false;
  late StreamSubscription _msgSub;
  late StreamSubscription _typingSub;
  late StreamSubscription _stopTypingSub;

  @override
  void initState() {
    super.initState();
    _load();
    final socket = context.read<SocketService>();
    socket.joinChat(widget.chat.id);

    _msgSub = socket.onNewMessage.listen((data) {
      if (data['chatId'] == widget.chat.id) {
        final msg = ChatMessage.fromJson(data['message'] ?? data);
        if (mounted) setState(() => _messages.add(msg));
        _scrollToBottom();
        _chatService.markAsRead(widget.chat.id);
      }
    });

    _typingSub = socket.onTyping.listen((data) {
      if (data['chatId'] == widget.chat.id && data['userId'] != widget.currentUserId) {
        if (mounted) setState(() { _someoneTyping = true; _typingName = data['userName'] ?? ''; });
      }
    });

    _stopTypingSub = socket.onStopTyping.listen((data) {
      if (data['chatId'] == widget.chat.id) {
        if (mounted) setState(() => _someoneTyping = false);
      }
    });
  }

  @override
  void dispose() {
    _msgSub.cancel();
    _typingSub.cancel();
    _stopTypingSub.cancel();
    _typingTimer?.cancel();
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    context.read<SocketService>().leaveChat(widget.chat.id);
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final msgs = await _chatService.getMessages(widget.chat.id);
      await _chatService.markAsRead(widget.chat.id);
      if (mounted) {
        setState(() { _messages = msgs; _loading = false; });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _onTextChanged(String val) {
    final socket = context.read<SocketService>();
    if (!_isTyping && val.isNotEmpty) {
      _isTyping = true;
      socket.sendTyping(widget.chat.id, widget.currentUserId);
    }
    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(seconds: 2), () {
      if (_isTyping) {
        _isTyping = false;
        socket.sendStopTyping(widget.chat.id, widget.currentUserId);
      }
    });
  }

  Future<void> _send() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty || _sending) return;
    _msgCtrl.clear();
    _isTyping = false;
    context.read<SocketService>().sendStopTyping(widget.chat.id, widget.currentUserId);
    setState(() => _sending = true);
    try {
      final msg = await _chatService.sendMessage(widget.chat.id, text);
      if (mounted) setState(() { _messages.add(msg); _sending = false; });
      _scrollToBottom();
    } catch (e) {
      if (mounted) {
        setState(() => _sending = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.chat.displayName(widget.currentUserId);
    final initials = widget.chat.displayInitials(widget.currentUserId);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            _Avatar(initials: initials, isGroup: widget.chat.isGroup, size: 34),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                  Consumer<SocketService>(
                    builder: (_, s, _) => Text(
                      s.isConnected ? 'Online' : 'Connecting…',
                      style: TextStyle(
                        fontSize: 11,
                        color: s.isConnected ? AppTheme.green : AppTheme.textMuted,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : _messages.isEmpty
                    ? _EmptyState(
                        icon: Icons.chat_bubble_outline,
                        title: 'No messages yet',
                        subtitle: 'Say hello!',
                      )
                    : ListView.builder(
                        controller: _scrollCtrl,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        itemCount: _messages.length,
                        itemBuilder: (_, i) => _MessageBubble(
                          message: _messages[i],
                          isMe: _messages[i].senderId == widget.currentUserId,
                          showName: widget.chat.isGroup,
                          isDark: isDark,
                        ),
                      ),
          ),
          if (_someoneTyping)
            Padding(
              padding: const EdgeInsets.only(left: 16, bottom: 4),
              child: Row(
                children: [
                  _TypingDots(),
                  const SizedBox(width: 6),
                  Text(
                    _typingName.isNotEmpty ? '$_typingName is typing…' : 'Typing…',
                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                  ),
                ],
              ),
            ),
          _InputBar(
            controller: _msgCtrl,
            sending: _sending,
            onChanged: _onTextChanged,
            onSend: _send,
            isDark: isDark,
          ),
        ],
      ),
    );
  }
}

// ── Message bubble ─────────────────────────────────────────────────────────────

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMe;
  final bool showName;
  final bool isDark;

  const _MessageBubble({
    required this.message,
    required this.isMe,
    required this.showName,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe) ...[
            _Avatar(initials: message.senderName.isNotEmpty ? message.senderName[0].toUpperCase() : '?', size: 28),
            const SizedBox(width: 6),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (showName && !isMe)
                  Padding(
                    padding: const EdgeInsets.only(left: 4, bottom: 2),
                    child: Text(
                      message.senderName,
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
                    ),
                  ),
                Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.72,
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: isMe
                        ? AppTheme.primary
                        : (isDark ? const Color(0xFF374151) : const Color(0xFFF3F4F6)),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isMe ? 16 : 4),
                      bottomRight: Radius.circular(isMe ? 4 : 16),
                    ),
                  ),
                  child: Text(
                    message.content,
                    style: TextStyle(
                      fontSize: 14,
                      color: isMe ? Colors.white : (isDark ? Colors.white : AppTheme.textPrimary),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 2, left: 4, right: 4),
                  child: Text(
                    timeago.format(message.timestamp),
                    style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Input bar ──────────────────────────────────────────────────────────────────

class _InputBar extends StatelessWidget {
  final TextEditingController controller;
  final bool sending;
  final ValueChanged<String> onChanged;
  final VoidCallback onSend;
  final bool isDark;

  const _InputBar({
    required this.controller,
    required this.sending,
    required this.onChanged,
    required this.onSend,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 12,
        right: 8,
        top: 8,
        bottom: MediaQuery.of(context).viewInsets.bottom + 8,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1F2937) : Colors.white,
        border: Border(top: BorderSide(color: isDark ? const Color(0xFF374151) : const Color(0xFFE5E7EB))),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                onChanged: onChanged,
                onSubmitted: (_) => onSend(),
                maxLines: 4,
                minLines: 1,
                textInputAction: TextInputAction.send,
                style: const TextStyle(fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Type a message…',
                  hintStyle: const TextStyle(fontSize: 14, color: AppTheme.textMuted),
                  filled: true,
                  fillColor: isDark ? const Color(0xFF374151) : const Color(0xFFF9FAFB),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(22),
                    borderSide: BorderSide.none,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(22),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(22),
                    borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 6),
            AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              child: sending
                  ? const Padding(
                      padding: EdgeInsets.all(10),
                      child: SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary),
                      ),
                    )
                  : IconButton(
                      onPressed: onSend,
                      icon: const Icon(Icons.send_rounded),
                      color: AppTheme.primary,
                      style: IconButton.styleFrom(
                        backgroundColor: AppTheme.primary.withOpacity(0.1),
                        shape: const CircleBorder(),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── New chat bottom sheet ──────────────────────────────────────────────────────

class _NewChatSheet extends StatefulWidget {
  final List<ChatUser> users;
  final String currentUserId;
  final ValueChanged<ChatUser> onSelect;

  const _NewChatSheet({required this.users, required this.currentUserId, required this.onSelect});

  @override
  State<_NewChatSheet> createState() => _NewChatSheetState();
}

class _NewChatSheetState extends State<_NewChatSheet> {
  final _search = TextEditingController();
  List<ChatUser> _filtered = [];

  @override
  void initState() {
    super.initState();
    _filtered = widget.users.where((u) => u.id != widget.currentUserId).toList();
  }

  void _filter(String q) {
    setState(() {
      _filtered = widget.users
          .where((u) => u.id != widget.currentUserId && (q.isEmpty || u.name.toLowerCase().contains(q.toLowerCase()) || u.email.toLowerCase().contains(q.toLowerCase())))
          .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final maxH = MediaQuery.of(context).size.height * 0.75;
    return ConstrainedBox(
      constraints: BoxConstraints(maxHeight: maxH),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Container(width: 36, height: 4, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                const Text('New Message', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const Spacer(),
                IconButton(icon: const Icon(Icons.close, size: 20), onPressed: () => Navigator.pop(context)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              controller: _search,
              onChanged: _filter,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Search people…',
                prefixIcon: const Icon(Icons.search, size: 18, color: AppTheme.textMuted),
                filled: true,
                contentPadding: EdgeInsets.zero,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
              ),
            ),
          ),
          Flexible(
            child: _filtered.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(32),
                    child: Text('No users found', style: TextStyle(color: AppTheme.textSecondary)),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    itemCount: _filtered.length,
                    itemBuilder: (_, i) {
                      final u = _filtered[i];
                      return ListTile(
                        leading: _Avatar(initials: u.initials),
                        title: Text(u.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                        subtitle: Text(u.email, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                        onTap: () => widget.onSelect(u),
                      );
                    },
                  ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

// ── Shared widgets ─────────────────────────────────────────────────────────────

class _Avatar extends StatelessWidget {
  final String initials;
  final bool isGroup;
  final double size;

  const _Avatar({required this.initials, this.isGroup = false, this.size = 42});

  static const _colors = [
    AppTheme.primary, AppTheme.blue, AppTheme.purple,
    AppTheme.cyan, AppTheme.teal, AppTheme.amber,
  ];

  Color get _color => isGroup ? AppTheme.purple : _colors[initials.codeUnitAt(0) % _colors.length];

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: _color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(size / 2.5),
      ),
      child: Center(
        child: Text(
          initials,
          style: TextStyle(color: _color, fontWeight: FontWeight.w700, fontSize: size * 0.38),
        ),
      ),
    );
  }
}

class _TypingDots extends StatefulWidget {
  @override
  State<_TypingDots> createState() => _TypingDotsState();
}

class _TypingDotsState extends State<_TypingDots> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat();
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, _) => Row(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(3, (i) {
          final offset = ((_ctrl.value * 3) - i).clamp(0.0, 1.0);
          final opacity = (offset < 0.5 ? offset * 2 : (1 - offset) * 2).clamp(0.3, 1.0);
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 1.5),
            width: 5,
            height: 5,
            decoration: BoxDecoration(
              color: AppTheme.textSecondary.withOpacity(opacity),
              shape: BoxShape.circle,
            ),
          );
        }),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _EmptyState({required this.icon, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 52, color: AppTheme.textMuted),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
          const SizedBox(height: 4),
          Text(subtitle, style: const TextStyle(fontSize: 13, color: AppTheme.textMuted)),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: AppTheme.red, size: 40),
            const SizedBox(height: 8),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.red, fontSize: 13)),
            const SizedBox(height: 12),
            TextButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
