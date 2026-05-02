import 'dart:convert';
import 'device_fingerprint_io.dart'
    if (dart.library.html) 'device_fingerprint_web.dart';

class DeviceFingerprint {
  static Future<String> generate() async {
    final fingerprint = {
      'screenResolution': getScreenResolution(),
      'timezone': DateTime.now().timeZoneOffset.inHours.toString(),
      'platform': getPlatform(),
      'colorDepth': '24',
      'deviceMemory': '4',
      'hardwareConcurrency': getProcessors().toString(),
    };
    
    return base64Encode(utf8.encode(jsonEncode(fingerprint)));
  }
}
