import 'package:flutter/material.dart';
import '../services/api_service.dart';

class DashboardScreen extends StatefulWidget {
  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  double _totalIncome = 0;
  double _totalExpense = 0;
  double _balance = 0;
  List<dynamic> _budgets = [];

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    try {
      final transactions = await _apiService.getTransactions();
      final budgets = await _apiService.getBudgets();

      double income = 0;
      double expense = 0;

      for (var t in transactions) {
        if (t['type'] == 'income') {
          income += t['amount'];
        } else if (t['type'] == 'expense') {
          expense += t['amount'];
        }
      }

      setState(() {
        _totalIncome = income;
        _totalExpense = expense;
        _balance = income - expense;
        _budgets = budgets;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading dashboard: $e');
      setState(() => _isLoading = false);
    }
  }

  Widget _buildSummaryCard(String title, double amount, Color color) {
    return Expanded(
      child: Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Color(0xFF1a1a1a),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Color(0xFF333333)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(color: Colors.grey, fontSize: 14)),
            SizedBox(height: 8),
            Text(
              '₹\${amount.toStringAsFixed(2)}',
              style: TextStyle(
                color: color,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBudgetItem(dynamic budget) {
    // Assuming budget has category and amount
    final category = budget['category'] ?? 'Unknown';
    final amount = budget['amount']?.toDouble() ?? 0.0;
    
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Color(0xFF1a1a1a),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFF333333)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(category, style: TextStyle(color: Colors.white, fontSize: 16)),
          Text(
            'Limit: ₹\${amount.toStringAsFixed(2)}',
            style: TextStyle(color: Color(0xFF4ade80), fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        body: Center(child: CircularProgressIndicator(color: Color(0xFF4ade80))),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Dashboard', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: _loadDashboardData,
        color: Color(0xFF4ade80),
        child: SingleChildScrollView(
          physics: AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Total Balance', style: TextStyle(color: Colors.grey, fontSize: 16)),
              SizedBox(height: 8),
              Text(
                '₹\${_balance.toStringAsFixed(2)}',
                style: TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 24),
              Row(
                children: [
                  _buildSummaryCard('Income', _totalIncome, Color(0xFF4ade80)),
                  SizedBox(width: 16),
                  _buildSummaryCard('Expenses', _totalExpense, Colors.redAccent),
                ],
              ),
              SizedBox(height: 32),
              Text(
                'Auto-Generated Budgets',
                style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 16),
              if (_budgets.isEmpty)
                Text('No budgets generated yet. Add an income to generate!', style: TextStyle(color: Colors.grey))
              else
                ..._budgets.map((b) => _buildBudgetItem(b)).toList(),
            ],
          ),
        ),
      ),
    );
  }
}
