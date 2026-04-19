import { describe, it, expect } from 'vitest';
import { hash as tunnelHash } from '../utils';

describe('哈希工具', () => {
  it('相同输入应产生一致的哈希值', () => {
    const hash1 = tunnelHash('GET /api/users');
    const hash2 = tunnelHash('GET /api/users');
    expect(hash1).toBe(hash2);
  });

  it('不同端点应产生不同的哈希值', () => {
    const hash1 = tunnelHash('GET /api/users');
    const hash2 = tunnelHash('GET /api/posts');
    expect(hash1).not.toBe(hash2);
  });

  it('相同端点不同方法应产生不同的哈希值', () => {
    const hashGet = tunnelHash('GET /api/users');
    const hashPost = tunnelHash('POST /api/users');
    expect(hashGet).not.toBe(hashPost);
  });

  it('不同路径参数应产生不同的哈希值', () => {
    const hash1 = tunnelHash('GET /api/users/:id');
    const hash2 = tunnelHash('GET /api/users/:name');
    expect(hash1).not.toBe(hash2);
  });

  it('应能处理长的端点路径', () => {
    const hash = tunnelHash('GET /api/v1/users/123/posts/456/comments/789');
    expect(typeof hash).toBe('number');
    expect(hash).toBeGreaterThan(0);
  });

  it('应返回无符号32位整数', () => {
    const hash = tunnelHash('GET /api/test');
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThanOrEqual(0xffffffff);
  });
});