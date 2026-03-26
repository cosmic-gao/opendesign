// ============ 基础类型 ============

export type RawID = string | number;
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type NodeId = Brand<RawID, 'NodeId'>;
export type EdgeId = Brand<RawID, 'EdgeId'>;
export type SlotId = Brand<RawID, 'SlotId'>;

// ============ Endpoint (边的端点引用) ============
// Endpoint 只是引用，不包含元数据
export interface Endpoint<NI extends NodeId = NodeId, SI extends SlotId = SlotId> {
  nodeId: NI;
  id: SI;
}

// ============ Slot (节点接口定义，包含完整信息) ============
// Slot 继承 Endpoint，扩展元数据
export interface Slot<NI extends NodeId = NodeId, SI extends SlotId = SlotId, T = unknown>
  extends Endpoint<NI, SI> {
  name: string;
  direction: 'input' | 'output';
  type?: T;
}

// ============ Node ============
export interface Node<
  NI extends NodeId = NodeId,
  SI extends SlotId = SlotId,
  T = unknown
> {
  id: NI;
  type: string;
  title?: string;
  inputs?: Slot<NI, SI, T>[];
  outputs?: Slot<NI, SI, T>[];
}

// ============ Edge ============
// Edge 的 source/target 是 Endpoint 引用
export interface Edge<
  EI extends EdgeId = EdgeId,
  NI extends NodeId = NodeId,
  SI extends SlotId = SlotId
> {
  id: EI;
  source: Endpoint<NI, SI>;
  target: Endpoint<NI, SI>;
}

// ============ Graph ============
export interface Graph<
  NI extends NodeId = NodeId,
  EI extends EdgeId = EdgeId,
  SI extends SlotId = SlotId,
  T = unknown
> {
  id?: string;
  nodes: Map<NI, Node<NI, SI, T>>;
  edges: Map<EI, Edge<EI, NI, SI>>;
}
