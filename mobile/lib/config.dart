import 'dart:io';
import 'package:flutter/foundation.dart';

class Config {
  // Use 10.0.2.2 for Android emulator to connect to localhost, 
  // and localhost for iOS simulator or Web
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:5000/api';
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000/api';
    }
    return 'http://localhost:5000/api';
  }
}
