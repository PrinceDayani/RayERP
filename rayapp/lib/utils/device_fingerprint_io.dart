import 'dart:io';
import 'package:flutter/material.dart';

String getPlatform() => Platform.operatingSystem;

int getProcessors() => Platform.numberOfProcessors;

String getScreenResolution() {
  return '${WidgetsBinding.instance.platformDispatcher.views.first.physicalSize.width.toInt()}x${WidgetsBinding.instance.platformDispatcher.views.first.physicalSize.height.toInt()}';
}
