/**
 * HTTP 方法常量
 * 与 hono/router 的 METHODS 保持一致
 */
const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'options', 'patch'] as const;

/**
 * HTTP 请求方法类型
 * 同时支持大小写，与 Hono 框架的 METHODS 类型保持一致
 */
export type Method = typeof HTTP_METHODS[number] | Uppercase<typeof HTTP_METHODS[number]>;

/**
 * 路由端点类型
 * 格式为 "METHOD /path"，用于提供 IDE 的严格格式提示
 */
export type Endpoint = `${Method} ${string}`;

/**
 * HTTP 方法常量，供其他模块使用
 */
export { HTTP_METHODS };

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
