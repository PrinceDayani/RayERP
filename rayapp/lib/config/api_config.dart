import 'package:flutter/foundation.dart';

class ApiConfig {
  static String get baseUrl {
    if (kDebugMode) {
      return 'http://localhost:5000/api';
    } else {
      return 'https://d8id622mic.us-east-1.awsapprunner.com/api';
    }
  }
  
  static const Duration timeout = Duration(seconds: 30);
}
