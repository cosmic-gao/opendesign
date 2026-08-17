import { inboundOf, type Adjacency, type Structure } from "../structure";

/** 全图度数，下标即节点索引。 */
export interface Degrees {
  readonly inbound: Int32Array;
  readonly outbound: Int32Array;
}

/** @throws {@link Oneway} 结构只编了出向 */
export function degrees(structure: Structure): Degrees {
  const back = inboundOf(structure, "degrees");
  const { offset } = structure.outbound;
  const inward = new Int32Array(structure.order);
  const outward = new Int32Array(structure.order);
  for (let u = 0; u < structure.order; u++) {
    inward[u] = back.offset[u + 1]! - back.offset[u]!;
    outward[u] = offset[u + 1]! - offset[u]!;
  }
  return { inbound: inward, outbound: outward };
}

/** 入度为 0 的节点索引。@throws {@link Oneway} 结构只编了出向 */
export const sources = (structure: Structure): Int32Array =>
  barren(structure, inboundOf(structure, "sources"));

/** 出度为 0 的节点索引。 */
export const sinks = (structure: Structure): Int32Array =>
  barren(structure, structure.outbound);

/** 入度与出度都为 0 的节点索引。@throws {@link Oneway} 结构只编了出向 */
export function isolated(structure: Structure): Int32Array {
  const back = inboundOf(structure, "isolated");
  const { offset } = structure.outbound;
  return select(
    structure,
    (u) =>
      offset[u + 1]! === offset[u]! && back.offset[u + 1]! === back.offset[u]!,
  );
}

/** 在给定方向上没有任何关联边的节点索引。 */
function barren(structure: Structure, side: Adjacency): Int32Array {
  const { offset } = side;
  return select(structure, (u) => offset[u + 1]! === offset[u]!);
}

function select(
  structure: Structure,
  keep: (u: number) => boolean,
): Int32Array {
  const found = new Int32Array(structure.order);
  let at = 0;
  for (let u = 0; u < structure.order; u++) {
    if (keep(u)) found[at++] = u;
  }
  return found.subarray(0, at);
}
