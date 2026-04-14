import { describe, it, expect } from 'vitest';
import { hash as tunnelHash } from '../utils';

describe('hash', () => {
  it('should produce consistent hash for same input', () => {
    const hash1 = tunnelHash('GET /api/users');
    const hash2 = tunnelHash('GET /api/users');

    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different endpoints', () => {
    const hash1 = tunnelHash('GET /api/users');
    const hash2 = tunnelHash('GET /api/posts');

    expect(hash1).not.toBe(hash2);
  });

  it('should produce different hashes for different methods on same endpoint', () => {
    const hashGet = tunnelHash('GET /api/users');
    const hashPost = tunnelHash('POST /api/users');

    expect(hashGet).not.toBe(hashPost);
  });

  it('should produce different hashes for different path parameters', () => {
    const hash1 = tunnelHash('GET /api/users/:id');
    const hash2 = tunnelHash('GET /api/users/:name');

    expect(hash1).not.toBe(hash2);
  });

  it('should handle long endpoint paths', () => {
    const hash = tunnelHash('GET /api/v1/users/123/posts/456/comments/789');

    expect(typeof hash).toBe('number');
    expect(hash).toBeGreaterThan(0);
  });

  it('should return unsigned 32-bit integer', () => {
    const hash = tunnelHash('GET /api/test');

    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThanOrEqual(0xffffffff);
  });
});
