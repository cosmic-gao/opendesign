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

/** 模板字面量约束，提供 IDE 的严格格式提示，避免原型污染 */
export type Endpoint = `${Method} ${string}`;

const FNV_PRIME = 0x01000193;
const FNV_OFFSET_BASIS = 0x811c9dc5;

/** 
 * 高性能 FNV-1a 32-bit 哈希算法 
 * 纯位运算，无加密开销，适合短字符串哈希，压榨 V8 Map 寻址性能
 */
export function hash(endpoint: Endpoint | string): number {
  let hash = FNV_OFFSET_BASIS;

  for (let i = 0; i < endpoint.length; i++) {
    hash ^= endpoint.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return hash >>> 0;
}
