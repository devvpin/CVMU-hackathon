import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'firebase_options.dart';
import 'screens/login_screen.dart';
import 'services/auth_service.dart';

import 'screens/main_tab_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
      ],
      child: MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CVMU Expense Tracker',
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: Color(0xFF4ade80), // From web app aesthetics
        scaffoldBackgroundColor: Color(0xFF0a0a0a),
        colorScheme: ColorScheme.dark(
          primary: Color(0xFF4ade80),
          secondary: Color(0xFF4ade80),
        ),
      ),
      home: AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();

    if (authService.isLoading) {
      return Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (authService.user == null) {
      return LoginScreen();
    }

    return MainTabScreen();
  }
}
