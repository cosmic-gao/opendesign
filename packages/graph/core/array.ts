/**
 * 索引空间的数组原语：只认下标与整数，不认图、结构与算法。
 *
 * @remarks 下面三个算子在算法层各出现过好几遍。把它们安置在任何一个算法模块里，都会让
 *   其余模块为了共用一段循环而去 import 它——拓扑排序因此依赖最短路、连通分量因此依赖
 *   遍历，全是与算法无关的偶然耦合。收在这个零依赖的叶子模块上，谁都能用，谁也不因此
 *   依赖谁。
 *
 * @packageDocumentation
 */

/**
 * 只读整数数组：索引与迭代照常，但没有任何写入口。快照宣称不可变，
 * 这个类型让"不可变"在编译期就成立，而不是只写在文档里。
 */
export interface Ints extends Iterable<number> {
  readonly length: number;
  readonly [index: number]: number;
  subarray(begin?: number, end?: number): Ints;
}

/** 只读浮点数组，语义同 {@link Ints}。 */
export interface Reals extends Iterable<number> {
  readonly length: number;
  readonly [index: number]: number;
}

/**
 * 从 `from` 起找第一个仍是 `blank` 的槽位；全部访问过则返回 `marks.length`。
 * 逐个分量铺开搜索的算法用它挑下一个起点。
 *
 * @remarks 游标只增不减，因此整趟扫描摊销 O(V)——每轮从 0 重找就是 O(V²)。
 */
export function nextRoot(
  marks: Int32Array | Uint8Array,
  from: number,
  blank: number,
): number {
  let u = from;
  while (u < marks.length && marks[u] !== blank) u++;
  return u;
}

/**
 * 沿前驱链回溯出完整路径，末端落在 `from`；`parent` 里 -1 表示链头。
 *
 * @remarks 先数长度再倒着填，一次分配到位——链长事先未知，边走边 `push` 要付数组扩容。
 */
export function backtrack(parent: Ints, from: number): Int32Array {
  let depth = 0;
  for (let cursor = from; cursor !== -1; cursor = parent[cursor]!) depth++;
  const path = new Int32Array(depth);
  for (let cursor = from; cursor !== -1; cursor = parent[cursor]!) {
    path[--depth] = cursor;
  }
  return path;
}

/**
 * 按标签把索引分桶：`label[u]` 是索引 `u` 的桶号，取值 `0 .. count-1`。
 *
 * @remarks 计数排序，O(V + count)，一次分配到位。连通分量与拓扑分层是同一个形状——
 *   一条标签数组加一个桶数，因此共用这一个实现。
 */
export function bucket(label: Ints, count: number): Int32Array[] {
  const width = new Int32Array(count);
  for (let u = 0; u < label.length; u++) {
    const c = label[u]!;
    width[c] = width[c]! + 1;
  }
  const grouped: Int32Array[] = new Array(count);
  for (let c = 0; c < count; c++) grouped[c] = new Int32Array(width[c]!);
  const cursor = new Int32Array(count);
  for (let u = 0; u < label.length; u++) {
    const c = label[u]!;
    grouped[c]![cursor[c]!++] = u;
  }
  return grouped;
}
