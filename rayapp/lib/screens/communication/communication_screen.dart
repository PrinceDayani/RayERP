import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import 'chat_screen.dart';
import 'notification_screen.dart';
import 'broadcast_screen.dart';
import 'activity_feed_screen.dart';

class CommunicationScreen extends StatefulWidget {
  final int initialTab;
  const CommunicationScreen({super.key, this.initialTab = 0});

  @override
  State<CommunicationScreen> createState() => _CommunicationScreenState();
}

class _CommunicationScreenState extends State<CommunicationScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 4, vsync: this, initialIndex: widget.initialTab);
  }

  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          color: Theme.of(context).cardColor,
          child: TabBar(
            controller: _tabs,
            labelColor: AppTheme.primary,
            unselectedLabelColor: AppTheme.textSecondary,
            indicatorColor: AppTheme.primary,
            indicatorWeight: 2.5,
            labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
            unselectedLabelStyle: const TextStyle(fontSize: 11),
            tabs: const [
              Tab(icon: Icon(Icons.chat_bubble_outline, size: 16), text: 'Chat'),
              Tab(icon: Icon(Icons.notifications_outlined, size: 16), text: 'Alerts'),
              Tab(icon: Icon(Icons.campaign_outlined, size: 16), text: 'Broadcast'),
              Tab(icon: Icon(Icons.history_outlined, size: 16), text: 'Activity'),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabs,
            children: const [
              ChatScreen(),
              NotificationScreen(),
              BroadcastScreen(),
              ActivityFeedScreen(),
            ],
          ),
        ),
      ],
    );
  }
}
