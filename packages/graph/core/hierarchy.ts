/**
 * 复合层级的派生查询。
 *
 * @remarks 层级只存在于可变 {@link Graph} 上——它不进 CSR，因此也进不了
 *   {@link Structure}。这三个查询放在 `./algorithm` 里会成为算法层唯一一处反向依赖编辑层
 *   的地方；摆在编辑层这一侧，`./algorithm` 就能守住"只认索引空间"的边界。
 *
 *   三者都按 `<N, E>` 泛型收图而不是写死 `Graph`（即 `Graph<unknown, unknown>`）：
 *   图的事件总线在类型上是**不变**的，写死就等于只接受 `Graph<unknown, unknown>`，
 *   任何具体类型的图都传不进来。
 *
 * @packageDocumentation
 */

import type { Graph } from "./graph";
import type { NodeId } from "./ident";

/** 没有父节点的顶层节点。 */
export function roots<N, E>(graph: Graph<N, E>): NodeId[] {
  return graph.nodes().filter((node) => graph.parent(node) === undefined);
}

/** 以 `root` 为根的子树全部节点，含自身。 */
export function subtree<N, E>(graph: Graph<N, E>, root: NodeId): NodeId[] {
  const found: NodeId[] = [];
  const stack: NodeId[] = [root];
  while (stack.length > 0) {
    const node = stack.pop()!;
    found.push(node);
    // 不用 spread：实参个数有引擎上限，特别宽的分组会直接 RangeError。
    for (const child of graph.children(node)) stack.push(child);
  }
  return found;
}

/** 自底向上的祖先链，不含自身。 */
export function ancestry<N, E>(graph: Graph<N, E>, node: NodeId): NodeId[] {
  const chain: NodeId[] = [];
  for (
    let cursor = graph.parent(node);
    cursor !== undefined;
    cursor = graph.parent(cursor)
  ) {
    chain.push(cursor);
  }
  return chain;
}
