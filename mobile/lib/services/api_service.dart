import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import '../config.dart';

class ApiService {
  Future<String?> _getToken() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      return await user.getIdToken();
    }
    return null;
  }

  Future<List<dynamic>> getTransactions() async {
    final token = await _getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('${Config.baseUrl}/transactions'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load transactions');
    }
  }

  Future<Map<String, dynamic>> addTransaction(Map<String, dynamic> data) async {
    final token = await _getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await http.post(
      Uri.parse('${Config.baseUrl}/transactions'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode(data),
    );

    if (response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to add transaction');
    }
  }

  Future<void> deleteTransaction(String id) async {
    final token = await _getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await http.delete(
      Uri.parse('${Config.baseUrl}/transactions/$id'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to delete transaction');
    }
  }

  Future<List<dynamic>> getBudgets() async {
    final token = await _getToken();
    if (token == null) return [];

    final response = await http.get(
      Uri.parse('${Config.baseUrl}/budgets'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load budgets');
    }
  }
}
