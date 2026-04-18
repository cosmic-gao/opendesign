/**
 * HTTP 请求方法类型
 * 包含所有标准 HTTP 方法
 */
export type Method =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS'
  | 'TRACE'
  | 'CONNECT';

/**
 * 路由端点类型
 * 格式为 "METHOD /path"，用于提供 IDE 的严格格式提示
 */
export type Endpoint = `${Method} ${string}`;

/** FNV-1a 哈希算法的质数常量 */
const FNV_PRIME = 0x01000193;
/** FNV-1a 哈希算法的初始偏移量 */
const FNV_OFFSET_BASIS = 0x811c9dc5;

/**
 * 高性能 FNV-1a 32-bit 哈希算法
 * 纯位运算，无加密开销，适合短字符串哈希，压榨 V8 Map 寻址性能
 * @param endpoint - 路由端点字符串，格式为 "METHOD /path"
 * @returns 32 位无符号整数哈希值
 */
export function hash(endpoint: Endpoint | string): number {
  let hash = FNV_OFFSET_BASIS;

  for (let i = 0; i < endpoint.length; i++) {
    hash ^= endpoint.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return hash >>> 0;
}
