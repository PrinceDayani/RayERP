import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/auth_provider.dart';
import 'services/theme_provider.dart';
import 'services/socket_service.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'config/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..init()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => SocketService()),
      ],
      child: const RayApp(),
    ),
  );
}

class RayApp extends StatelessWidget {
  const RayApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeMode = context.watch<ThemeProvider>().mode;
    return MaterialApp(
      title: 'RayERP',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (auth.isLoggedIn) {
            // Connect socket when authenticated
            WidgetsBinding.instance.addPostFrameCallback((_) {
              context.read<SocketService>().connect();
            });
            return const DashboardScreen();
          }
          // Disconnect socket on logout
          WidgetsBinding.instance.addPostFrameCallback((_) {
            context.read<SocketService>().disconnect();
          });
          return LoginScreen(sessionExpired: auth.sessionExpired);
        },
      ),
    );
  }
}
