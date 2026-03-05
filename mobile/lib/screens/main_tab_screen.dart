import 'package:flutter/material.dart';

import 'dashboard_screen.dart';
import 'transactions_screen.dart';
import 'budgets_screen.dart';

class MainTabScreen extends StatefulWidget {
  @override
  _MainTabScreenState createState() => _MainTabScreenState();
}

class _MainTabScreenState extends State<MainTabScreen> {
  int _currentIndex = 0;

  final List<Widget> _pages = [
    DashboardScreen(),
    TransactionsScreen(),
    BudgetsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: const Color(0xFF1a1a1a),
        selectedItemColor: const Color(0xFF4ade80),
        unselectedItemColor: Colors.grey,
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.list),
            label: 'Transactions',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.pie_chart),
            label: 'Budgets',
          ),
        ],
      ),
    );
  }
}
