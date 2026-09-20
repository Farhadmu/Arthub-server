const assert = require('assert');
const { generateVerificationHash } = require('../src/services/certificateGenerator');

// Automated Unit & Integration Tests for Certificate Hash & Verification
console.log('--- Running Certificate Verification Tests ---');

// Test 1: Hash generation is deterministic given same input
const hash1 = generateVerificationHash('artwork123', 'buyer456', 1700000000000);
const hash2 = generateVerificationHash('artwork123', 'buyer456', 1700000000000);
assert.strictEqual(hash1, hash2, 'Hash must be deterministic for identical inputs');
console.log('✓ Test 1 Passed: Hash is deterministic');

// Test 2: Hash is 64 characters long (SHA-256 in hex format)
assert.strictEqual(hash1.length, 64, 'SHA-256 hash must be 64 hexadecimal characters');
console.log('✓ Test 2 Passed: Hash length is 64 chars (SHA-256)');

// Test 3: Hash varies with different buyer or timestamp
const hashDifferentBuyer = generateVerificationHash('artwork123', 'buyer789', 1700000000000);
assert.notStrictEqual(hash1, hashDifferentBuyer, 'Hash must vary with different buyer');
console.log('✓ Test 3 Passed: Hash varies with buyer inputs');

console.log('All Certificate Verification Tests PASSED successfully!');
