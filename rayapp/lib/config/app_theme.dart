import 'package:flutter/material.dart';

class AppTheme {
  static const Color primary = Color(0xFF970E2C);
  static const Color primaryHover = Color(0xFFCD2E4F);
  static const Color primaryLight = Color(0xFFE04D68);

  static const Color bg = Color(0xFFF8F9FA);
  static const Color border = Color(0xFFE5E7EB);
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textMuted = Color(0xFF9CA3AF);

  static const Color green = Color(0xFF16A34A);
  static const Color greenBg = Color(0xFFF0FDF4);
  static const Color amber = Color(0xFFD97706);
  static const Color amberBg = Color(0xFFFFFBEB);
  static const Color red = Color(0xFFDC2626);
  static const Color redBg = Color(0xFFFEF2F2);
  static const Color blue = Color(0xFF2563EB);
  static const Color blueBg = Color(0xFFEFF6FF);
  static const Color cyan = Color(0xFF0891B2);
  static const Color purple = Color(0xFF7C3AED);
  static const Color teal = Color(0xFF059669);

  static Color statusColor(String s) => switch (s) {
    'active' || 'present' || 'approved' => green,
    'inactive' || 'late' || 'pending' => amber,
    'half-day' || 'planning' => blue,
    _ => red,
  };

  static Color statusBg(String s) => switch (s) {
    'active' || 'present' || 'approved' => greenBg,
    'inactive' || 'late' || 'pending' => amberBg,
    'half-day' || 'planning' => blueBg,
    _ => redBg,
  };

  // ── Responsive helpers ──────────────────────────────────────────────────
  static const double _maxContent = 1200.0;

  /// True when screen is tablet/desktop width (≥768px).
  static bool isWide(BuildContext context) =>
      MediaQuery.of(context).size.width >= 768;

  /// True when screen is desktop width (≥1024px).
  static bool isDesktop(BuildContext context) =>
      MediaQuery.of(context).size.width >= 1024;

  /// Returns column count based on available width.
  /// <480 → 2, 480–767 → 3, 768–1023 → 4, 1024+ → 6
  static int cols(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    if (w < 480) return 2;
    if (w < 768) return 3;
    if (w < 1024) return 4;
    return 6;
  }

  /// Horizontal padding that scales with screen width.
  static double hPad(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    if (w < 480) return 12;
    if (w < 768) return 16;
    if (w < 1024) return 24;
    return 32;
  }

  /// Wraps [child] in a centered, max-width constrained box.
  /// Use this inside scrollable bodies so content never stretches past 1200px.
  static Widget constrain(Widget child) => Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: _maxContent),
          child: child,
        ),
      );

  // ── Task module design tokens (mirrors web globals.css + brand-theme.ts) ──

  /// Semantic status colors — matches web `getStatusColor()`
  static Color taskStatusColor(String s) => switch (s) {
    'completed'   => const Color(0xFF16A34A), // green-700
    'in-progress' => const Color(0xFF2563EB), // blue-600
    'review'      => const Color(0xFFD97706), // amber-600
    'blocked'     => const Color(0xFFDC2626), // red-600
    _             => const Color(0xFF6B7280), // gray-500
  };

  static Color taskStatusBg(String s) => switch (s) {
    'completed'   => const Color(0xFFDCFCE7), // green-100
    'in-progress' => const Color(0xFFDBEAFE), // blue-100
    'review'      => const Color(0xFFFEF3C7), // amber-100
    'blocked'     => const Color(0xFFFEE2E2), // red-100
    _             => const Color(0xFFF3F4F6), // gray-100
  };

  /// Semantic priority colors — matches web `getPriorityColor()`
  static Color taskPriorityColor(String p) => switch (p) {
    'critical' => const Color(0xFFDC2626), // red-600
    'high'     => const Color(0xFFEA580C), // orange-600
    'medium'   => const Color(0xFF2563EB), // blue-600
    _          => const Color(0xFF16A34A), // green-600
  };

  static Color taskPriorityBg(String p) => switch (p) {
    'critical' => const Color(0xFFFEE2E2), // red-100
    'high'     => const Color(0xFFFFEDD5), // orange-100
    'medium'   => const Color(0xFFDBEAFE), // blue-100
    _          => const Color(0xFFDCFCE7), // green-100
  };

  /// Web card: bg-card border border-border rounded-xl shadow
  static BoxDecoration taskCard({bool overdue = false, bool hover = false}) => BoxDecoration(
    color: const Color(0xFFFFFFFF),
    borderRadius: BorderRadius.circular(12),
    border: Border.all(
      color: overdue ? const Color(0xFFFCA5A5) : const Color(0xFFE5E7EB),
    ),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(hover ? 0.08 : 0.04),
        blurRadius: hover ? 12 : 4,
        offset: const Offset(0, 2),
      ),
    ],
  );

  static BoxDecoration taskCardDark({bool overdue = false}) => BoxDecoration(
    color: const Color(0xFF1F1F1F),
    borderRadius: BorderRadius.circular(12),
    border: Border.all(
      color: overdue ? const Color(0xFF7F1D1D) : const Color(0xFF333333),
    ),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(0.2),
        blurRadius: 4,
        offset: const Offset(0, 2),
      ),
    ],
  );

  /// Kanban column — matches web `.kanban-column`
  static BoxDecoration kanbanColumn(Color accent) => BoxDecoration(
    color: accent.withOpacity(0.04),
    borderRadius: BorderRadius.circular(12),
    border: Border.all(color: accent.withOpacity(0.25)),
  );

  static BoxDecoration kanbanColumnDark(Color accent) => BoxDecoration(
    color: accent.withOpacity(0.06),
    borderRadius: BorderRadius.circular(12),
    border: Border.all(color: accent.withOpacity(0.3)),
  );

  static String fmtDate(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

  static String fmtTime(DateTime d) =>
      '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';

  static ThemeData dark() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        brightness: Brightness.dark,
        primary: primary,
        onPrimary: Colors.white,
      ),
      scaffoldBackgroundColor: const Color(0xFF111827),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF1F2937),
        foregroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
      ),
      cardTheme: CardThemeData(
        color: const Color(0xFF1F2937),
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0xFF374151)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF1F2937),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF374151))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF374151))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: primary, width: 2)),
        labelStyle: const TextStyle(color: Color(0xFF9CA3AF)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding: const EdgeInsets.symmetric(vertical: 14),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      dividerTheme: const DividerThemeData(color: Color(0xFF374151), space: 1),
      navigationBarTheme: NavigationBarThemeData(
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return TextStyle(
            fontSize: 11,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
            color: selected ? primary : const Color(0xFF9CA3AF),
          );
        }),
      ),
    );
  }

  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        primary: primary,
        onPrimary: Colors.white,
        background: Colors.white,
        surface: Colors.white,
        onSurface: const Color(0xFF1A1A1A),
      ),
      scaffoldBackgroundColor: const Color(0xFFF8F9FA),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: Color(0xFF1A1A1A),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: TextStyle(
          color: Color(0xFF1A1A1A),
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        labelStyle: const TextStyle(color: Color(0xFF6B7280)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding: const EdgeInsets.symmetric(vertical: 14),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      dividerTheme: const DividerThemeData(color: Color(0xFFE5E7EB), space: 1),
      navigationBarTheme: NavigationBarThemeData(
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return TextStyle(
            fontSize: 11,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
            color: selected ? primary : const Color(0xFF6B7280),
          );
        }),
      ),
    );
  }
}
