import 'package:flutter_test/flutter_test.dart';
import 'package:rayapp/services/api_service.dart';
import 'package:rayapp/utils/constants.dart';

void main() {
  group('initialsOf', () {
    test('takes the first letter of the first two words', () {
      expect(initialsOf('Prince Dayani'), 'PD');
      expect(initialsOf('ada lovelace king'), 'AL');
    });

    test('handles single names, padding, and absent values', () {
      expect(initialsOf('Root'), 'R');
      expect(initialsOf('  spaced   out  '), 'SO');
      expect(initialsOf(''), '');
      expect(initialsOf(null), '');
    });
  });

  group('userNameOf', () {
    test('reads name from a populated User ref', () {
      expect(userNameOf({'_id': 'u1', 'name': 'Ada', 'email': 'a@b.c'}), 'Ada');
    });

    test('returns empty for a bare id or missing name', () {
      expect(userNameOf('64f0c0ffee'), '');
      expect(userNameOf(null), '');
      expect(userNameOf({'_id': 'u1'}), '');
    });
  });

  group('userIdOf', () {
    test('reads the id whether the ref is populated or bare', () {
      expect(userIdOf({'_id': 'u1', 'name': 'Ada'}), 'u1');
      expect(userIdOf('u2'), 'u2');
      expect(userIdOf(null), '');
    });
  });

  group('ApiService.unwrap', () {
    test('unwraps the {success, data} envelope', () {
      expect(ApiService.unwrap({'success': true, 'data': 42}), 42);
      expect(
        ApiService.unwrap({'success': true, 'data': <dynamic>[1, 2]}),
        [1, 2],
      );
    });

    test('passes through legacy bare payloads untouched', () {
      expect(ApiService.unwrap([1, 2, 3]), [1, 2, 3]);
      final bare = {'_id': 'p1', 'name': 'Project'};
      expect(ApiService.unwrap(bare), bare);
    });

    test('leaves a domain object holding only one of the keys alone', () {
      final doc = {'data': 'payload'};
      expect(ApiService.unwrap(doc), doc);
    });
  });

  group('ApiService.unwrapList', () {
    test('returns the list from either shape', () {
      expect(ApiService.unwrapList({'success': true, 'data': <dynamic>[1]}), [1]);
      expect(ApiService.unwrapList(<dynamic>[1, 2]), [1, 2]);
    });

    test('returns empty rather than throwing on an unexpected shape', () {
      expect(ApiService.unwrapList({'success': true, 'data': 5}), isEmpty);
      expect(ApiService.unwrapList(null), isEmpty);
    });
  });
}
