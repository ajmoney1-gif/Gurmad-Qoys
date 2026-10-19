import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEmail, validatePhone, validatePassword, validateReportSubmission } from './validation.ts';

test('validateEmail handles valid and invalid email addresses', () => {
  assert.equal(validateEmail('test@example.com'), true);
  assert.equal(validateEmail('user.name@somalia.so'), true);
  assert.equal(validateEmail('invalid-email'), false);
  assert.equal(validateEmail(''), false);
});

test('validatePhone validates Somali and international formats', () => {
  const somali1 = validatePhone('0615123456');
  assert.equal(somali1.valid, true);
  assert.equal(somali1.normalized, '+252615123456');

  const somali2 = validatePhone('+252615123456');
  assert.equal(somali2.valid, true);
  assert.equal(somali2.normalized, '+252615123456');

  const invalid = validatePhone('123');
  assert.equal(invalid.valid, false);
});

test('validatePassword requires at least 6 characters', () => {
  assert.equal(validatePassword('12345').valid, false);
  assert.equal(validatePassword('123456').valid, true);
});

test('validateReportSubmission checks required fields', () => {
  const invalid = validateReportSubmission({ name: '', location: '', lastSeen: '' });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.location);
  assert.ok(invalid.errors.lastSeen);

  const valid = validateReportSubmission({
    name: 'Cali Goobe',
    location: 'Deyniile, Muqdisho',
    lastSeen: '16 October 2026',
    age: '28',
    phone: '0615123456',
  });
  assert.equal(valid.valid, true);
  assert.equal(Object.keys(valid.errors).length, 0);
});
