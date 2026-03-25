// ============ 基础类型 ============

export type RawID = string | number;

export type Brand<T, B extends string> = T & { readonly __brand: B };
export type NodeId = Brand<RawID, 'NodeId'>;
export type EdgeId = Brand<RawID, 'EdgeId'>;
export type EndpointId = Brand<RawID, 'EndpointId'>;

// ============ Endpoint ============

export interface Endpoint<
  NI extends NodeId = NodeId,
  EI extends EndpointId = EndpointId,
> {
  id: EI;
  nodeId: NI;
}

// ============ Node ============

export interface Node<
  NI extends NodeId = NodeId,
  EI extends EndpointId = EndpointId,
  EP extends Endpoint<NI, EI> = Endpoint<NI, EI>,
> {
  id: NI;
  inputs?: EP[];
  outputs?: EP[];
}

// ============ Edge ============

export interface Edge<
  EI extends EndpointId = EndpointId,
  NI extends NodeId = NodeId,
  EP extends Endpoint<NI, EI> = Endpoint<NI, EI>,
> {
  id: EdgeId;
  source: EP;
  target: EP;
}

// ============ Graph ============

export interface Graph<
  NI extends NodeId = NodeId,
  EI extends EndpointId = EndpointId,
  N extends Node<NI, EI> = Node<NI, EI>,
  E extends Edge<EI, NI> = Edge<EI, NI>,
> {
  id?: string;
  nodes: Map<NI, N>;
  edges: Map<EdgeId, E>;
}
