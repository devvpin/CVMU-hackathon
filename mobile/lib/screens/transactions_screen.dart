import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:intl/intl.dart';

class TransactionsScreen extends StatefulWidget {
  @override
  _TransactionsScreenState createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  List<dynamic> _transactions = [];

  @override
  void initState() {
    super.initState();
    _loadTransactions();
  }

  Future<void> _loadTransactions() async {
    try {
      final data = await _apiService.getTransactions();
      setState(() {
        _transactions = data;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading transactions: $e');
      setState(() => _isLoading = false);
    }
  }

  void _showAddTransactionModal() {
    String type = 'expense';
    String category = 'Food';
    String description = '';
    String amountStr = '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Color(0xFF1a1a1a),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
                top: 24,
                left: 24,
                right: 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Add Transaction', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                  SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      ChoiceChip(
                        label: Text('Expense'),
                        selected: type == 'expense',
                        selectedColor: Colors.redAccent,
                        onSelected: (val) {
                          setModalState(() {
                            type = 'expense';
                            category = 'Food';
                          });
                        },
                      ),
                      ChoiceChip(
                        label: Text('Income'),
                        selected: type == 'income',
                        selectedColor: Color(0xFF4ade80),
                        onSelected: (val) {
                          setModalState(() {
                            type = 'income';
                            category = 'Salary';
                          });
                        },
                      ),
                    ],
                  ),
                  SizedBox(height: 20),
                  TextField(
                    keyboardType: TextInputType.number,
                    style: TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      labelText: 'Amount (₹)',
                      labelStyle: TextStyle(color: Colors.grey),
                      filled: true,
                      fillColor: Color(0xFF0a0a0a),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onChanged: (val) => amountStr = val,
                  ),
                  SizedBox(height: 16),
                  TextField(
                    style: TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      labelText: 'Category',
                      labelStyle: TextStyle(color: Colors.grey),
                      filled: true,
                      fillColor: Color(0xFF0a0a0a),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onChanged: (val) => category = val,
                    controller: TextEditingController(text: category),
                  ),
                  SizedBox(height: 16),
                  TextField(
                    style: TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      labelText: 'Description',
                      labelStyle: TextStyle(color: Colors.grey),
                      filled: true,
                      fillColor: Color(0xFF0a0a0a),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onChanged: (val) => description = val,
                  ),
                  SizedBox(height: 24),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(0xFF4ade80),
                      padding: EdgeInsets.symmetric(vertical: 16),
                    ),
                    onPressed: () async {
                      if (amountStr.isEmpty || category.isEmpty) return;
                      final amount = double.tryParse(amountStr);
                      if (amount == null) return;

                      final data = {
                        'type': type,
                        'amount': amount,
                        'category': category,
                        'description': description,
                        'date': DateFormat('yyyy-MM-dd').format(DateTime.now()),
                      };

                      Navigator.of(ctx).pop();
                      setState(() => _isLoading = true);
                      try {
                        await _apiService.addTransaction(data);
                        _loadTransactions(); // Reload after add
                      } catch (e) {
                        print('Add failed: $e');
                        setState(() => _isLoading = false);
                      }
                    },
                    child: Text('Add Transaction', style: TextStyle(color: Colors.black, fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                  SizedBox(height: 20),
                ],
              ),
            );
          }
        );
      },
    );
  }

  Widget _buildTransactionItem(dynamic transaction) {
    final isIncome = transaction['type'] == 'income';
    final amount = transaction['amount']?.toDouble() ?? 0.0;
    final dateStr = transaction['date'] ?? '';
    final category = transaction['category'] ?? '';
    final desc = transaction['description'] ?? '';

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
          Row(
            children: [
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isIncome ? Color(0xFF4ade80).withOpacity(0.2) : Colors.redAccent.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isIncome ? Icons.arrow_downward : Icons.arrow_upward,
                  color: isIncome ? Color(0xFF4ade80) : Colors.redAccent,
                ),
              ),
              SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(category, style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text(desc.isNotEmpty ? desc : dateStr, style: TextStyle(color: Colors.grey, fontSize: 14)),
                ],
              ),
            ],
          ),
          Text(
            '\${isIncome ? '+' : '-'}₹\${amount.toStringAsFixed(2)}',
            style: TextStyle(
              color: isIncome ? Color(0xFF4ade80) : Colors.redAccent,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Transactions', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: Color(0xFF4ade80)))
          : _transactions.isEmpty
              ? Center(child: Text('No transactions yet.', style: TextStyle(color: Colors.grey)))
              : RefreshIndicator(
                  color: Color(0xFF4ade80),
                  onRefresh: _loadTransactions,
                  child: ListView.builder(
                    padding: EdgeInsets.all(16),
                    itemCount: _transactions.length,
                    itemBuilder: (ctx, index) {
                      return _buildTransactionItem(_transactions[index]);
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Color(0xFF4ade80),
        onPressed: _showAddTransactionModal,
        child: Icon(Icons.add, color: Colors.black),
      ),
    );
  }
}
