import 'package:flutter/material.dart';
import '../services/api_service.dart';

class BudgetsScreen extends StatefulWidget {
  @override
  _BudgetsScreenState createState() => _BudgetsScreenState();
}

class _BudgetsScreenState extends State<BudgetsScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  List<dynamic> _budgets = [];
  Map<String, double> _spentByCategory = {};

  @override
  void initState() {
    super.initState();
    _loadBudgetData();
  }

  Future<void> _loadBudgetData() async {
    try {
      final budgets = await _apiService.getBudgets();
      final transactions = await _apiService.getTransactions();

      Map<String, double> spent = {};
      final nowStr = DateTime.now().toIso8601String().substring(0, 7); // YYYY-MM

      for (var t in transactions) {
        if (t['type'] == 'expense') {
          // In a real app we'd verify the transation is in the current month
          final month = t['date']?.substring(0, 7);
          if (month == nowStr) {
            final cat = t['category'] ?? 'Other';
            spent[cat] = (spent[cat] ?? 0.0) + (t['amount']?.toDouble() ?? 0.0);
          }
        }
      }

      setState(() {
        _budgets = budgets.where((b) => b['month'] == nowStr).toList();
        _spentByCategory = spent;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading budgets: $e');
      setState(() => _isLoading = false);
    }
  }

  Widget _buildBudgetCard(dynamic budget) {
    final category = budget['category'] ?? 'Unknown';
    final limit = budget['amount']?.toDouble() ?? 0.0;
    
    // For auto-generated 50/30/20 budgets, "Needs", "Wants", "Savings & Investments" 
    // Usually transactions aren't tagged exactly with these broad categories by users, 
    // but we can map them if needed or assume people tag exact categories.
    // For this hackathon scope, we'll try matching directly.
    final spent = _spentByCategory[category] ?? 0.0;
    
    double progress = limit > 0 ? (spent / limit) : 0;
    if (progress > 1.0) progress = 1.0;

    Color progressColor = Color(0xFF4ade80);
    if (progress > 0.8) progressColor = Colors.redAccent;
    else if (progress > 0.5) progressColor = Colors.orangeAccent;

    return Container(
      margin: EdgeInsets.only(bottom: 16),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Color(0xFF1a1a1a),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFF333333)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(category, style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              Text(
                '₹\${spent.toStringAsFixed(0)} / ₹\${limit.toStringAsFixed(0)}',
                style: TextStyle(color: Colors.grey, fontSize: 14),
              ),
            ],
          ),
          SizedBox(height: 12),
          LinearProgressIndicator(
            value: progress,
            backgroundColor: Color(0xFF333333),
            color: progressColor,
            minHeight: 8,
            borderRadius: BorderRadius.circular(4),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Budgets', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: Color(0xFF4ade80)))
          : RefreshIndicator(
              color: Color(0xFF4ade80),
              onRefresh: _loadBudgetData,
              child: SingleChildScrollView(
                physics: AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Auto-Generated Allowances',
                      style: TextStyle(color: Colors.grey, fontSize: 14),
                    ),
                    SizedBox(height: 16),
                    if (_budgets.isEmpty)
                      Container(
                        padding: EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Color(0xFF1a1a1a),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Color(0xFF333333)),
                        ),
                        child: Text(
                          'No budgets found for this month.\\n\\nAdd an income transaction to automatically generate fixed budgets using the 50/30/20 rule!',
                          style: TextStyle(color: Colors.grey, height: 1.5),
                          textAlign: TextAlign.center,
                        ),
                      )
                    else
                      ..._budgets.map((b) => _buildBudgetCard(b)).toList(),
                  ],
                ),
              ),
            ),
    );
  }
}
