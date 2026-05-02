import 'package:flutter/material.dart';

String getPlatform() => 'web';

int getProcessors() => 4;

String getScreenResolution() {
  return '${WidgetsBinding.instance.platformDispatcher.views.first.physicalSize.width.toInt()}x${WidgetsBinding.instance.platformDispatcher.views.first.physicalSize.height.toInt()}';
}
