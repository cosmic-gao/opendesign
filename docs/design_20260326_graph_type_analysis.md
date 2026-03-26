# @opendesign/graph 包类型系统缺陷分析报告

| 项目 | 内容 |
|------|------|
| **文档版本** | v1.0.0 |
| **编写日期** | 2026-03-26 |
| **分析范围** | `@opendesign/graph` 包类型定义 |
| **参考基准** | litegraph.js、node-red、petgraph、langgraph |
| **文档状态** | 正式发布 |

---

## 1. 分析背景与目的

本报告对 `@opendesign/graph` 包的类型系统进行系统性分析，通过与业界主流图形节点库（litegraph.js、node-red、petgraph、langgraph）进行横向对比，识别当前类型设计的缺陷与不足，并提出改进建议。

### 1.1 当前类型结构概览

```typescript
// 基础类型
export type RawID = string | number;
export type Brand<T, B> = T & { readonly __brand: B };
export type NodeId = Brand<RawID, 'NodeId'>;
export type EdgeId = Brand<RawID, 'EdgeId'>;
export type SlotId = Brand<RawID, 'SlotId'>;

// 端点结构
export interface Endpoint<NI, SI> {
  nodeId: NI;
  id: SI;
}

export interface Slot<NI, SI, T> extends Endpoint<NI, SI> {
  name: string;
  direction: 'input' | 'output';
  type?: T;
}

// 核心类型
export interface Node<NI, SI, T> {
  id: NI;
  type: string;
  title?: string;
  inputs?: Slot[];
  outputs?: Slot[];
}

export interface Edge<EI, NI, SI> {
  id: EI;
  source: Endpoint;
  target: Endpoint;
}

export interface Graph<NI, EI, SI, T> {
  id?: string;
  nodes: Record<NI, Node>;
  edges: Map<EI, Edge>;
}
```

### 1.2 类型系统层次图

```
                    RawID
                      │
              Brand<T, 'NodeId'> ─ Brand<T, 'EdgeId'> ─ Brand<T, 'SlotId'>
                      │                  │                  │
                   NodeId              EdgeId             SlotId
                      │                  │                  │
                      ▼                  ▼                  ▼
                   Node ────────────── Edge               Slot
                      │                  │                  │
                      ▼                  ▼                  ▼
                   Graph           (缺失元数据)         Endpoint
```

---

## 2. 业界图形库类型设计对比

### 2.1 对比总览表

| 特性维度 | @opendesign/graph | litegraph.js | node-red | petgraph | langgraph |
|----------|:-----------------:|:------------:|:---------:|:---------:|:---------:|
| **节点标识** | Brand ID (string\|number) | 数字自增ID | 字符串ID | `NodeIndex<N>` 紧凑型 | 字符串名称 |
| **边方向性** | 内置但未验证 | 有向 | 有向 | `Directed/Undirected` | 有向 + START/END |
| **条件边** | ❌ 不支持 | ❌ 不支持 | ❌ 不支持 | ❌ 不支持 | ✅ 路由函数 |
| **状态管理** | ❌ 仅结构存储 | ❌ 无 | ❌ 无 | ❌ 无 | ✅ StateGraph + Reducer |
| **边元数据** | ❌ 仅ID | ❌ 无 | ✅ wires数组 | ✅ weight 权值 | ❌ 无 |
| **反向追踪** | ❌ 无 | ✅ links数组 | ✅ wires数组 | ✅ 邻接表 | ❌ 无 |
| **节点位置** | ❌ 无 | ✅ pos[x,y] | ✅ x,y坐标 | ❌ 无 | ❌ 无 |
| **特殊节点** | ❌ 无 | ❌ 无 | ❌ 无 | ❌ 无 | ✅ START, END |
| **图变体** | ❌ 无 | ❌ 无 | ❌ 无 | ✅ Stable/GraphMap/Matrix | ✅ CompiledGraph |
| **节点类型联合** | string 无验证 | 类型码/字符串 | 字符串类型 | 泛型约束 | 函数类型 |

### 2.2 核心类型定义对比

#### 2.2.1 节点定义对比

**@opendesign/graph**
```typescript
interface Node<NI, SI, T> {
  id: NI;
  type: string;
  title?: string;
  inputs?: Slot[];
  outputs?: Slot[];
}
```

**litegraph.js**
```javascript
// 节点类，包含位置和尺寸信息
LGraphNode: {
  id: number;
  type: string;
  title: string;
  pos: [x, y];           // ✅ 位置信息
  size: [width, height];  // ✅ 尺寸信息
  input|output: Array<{
    name: string;
    type: string;
    links: Array;         // ✅ 反向追踪
    direction: "input"|"output";
  }>;
}
```

**node-red**
```javascript
Node: {
  id: string;
  type: string;
  x: number;             // ✅ 位置信息
  y: number;
  z: string;             // 子图ID
  wires: [[nodeRefs]];   // ✅ 多输出追踪
}
```

**langgraph (Python)**
```python
# 节点是Python函数，类型通过函数签名表达
def node(state: State) -> dict:
    return {"key": "value"}
```

**petgraph (Rust)**
```rust
struct Graph<N, E, Ty, Ix> {
    nodes: Vec<Node<N, Ix>>,  // 节点数据与邻接表结合
    edges: Vec<Edge<E, Ix>>,
}
struct Node<N, Ix> {
    weight: N,              // 节点数据
    next: [EdgeIndex<Ix>; 2], // 出边/入边链表
}
```

#### 2.2.2 边定义对比

**@opendesign/graph**
```typescript
interface Edge<EI, NI, SI> {
  id: EI;
  source: Endpoint<NI, SI>;
  target: Endpoint<NI, SI>;
  // ❌ 缺少元数据
  // ❌ 缺少方向验证
  // ❌ 缺少反向追踪
}
```

**petgraph**
```rust
struct Edge<E, Ix> {
    weight: E,              // ✅ 边有权重/元数据
    next: [EdgeIndex<Ix>; 2],
    node: [NodeIndex<Ix>; 2], // 起点和终点
}
```

**node-red**
```javascript
// wires 是邻接表实现，同时支持反向追踪
node.wires = [
  [targetNode1, targetNode2],  // 输出0的目标
  [targetNode3]               // 输出1的目标
];
```

#### 2.2.3 条件边设计（langgraph 特色）

**langgraph**
```python
# 条件边是 langgraph 的核心特性
builder.add_conditional_edges(
    "classifier",           // 源节点
    route_function,         // 路由函数: (state) -> next_node
    {                       // 路由映射表
        "urgent": "handle_urgent",
        "question": "handle_question", 
        "general": "handle_general"
    }
)

# 路由函数类型
route_function: (state: State) => Literal["urgent", "question", "general"]
```

---

## 3. 类型缺陷详细分析

### 3.1 【高】缺陷一：边的端点方向性无类型验证

**缺陷描述**

`Edge.source` 和 `Edge.target` 是通用的 `Endpoint` 类型，未对 `Slot.direction` 进行约束验证。这导致可以创建语义上无效的边，例如让两个输入端口相互连接。

**问题代码**

```typescript
// 当前类型系统允许以下语义错误的代码
const graph: Graph = {
  nodes: {
    'n1': {
      id: 'n1',
      type: 'adder',
      inputs: [{ nodeId: 'n1', id: 'i1', name: 'A', direction: 'input' }],
      outputs: [{ nodeId: 'n1', id: 'o1', name: 'result', direction: 'output' }]
    },
    'n2': {
      id: 'n2', 
      type: 'multiplier',
      inputs: [{ nodeId: 'n2', id: 'i1', name: 'B', direction: 'input' }],
      outputs: [{ nodeId: 'n2', id: 'o1', name: 'result', direction: 'output' }]
    }
  },
  edges: new Map([
    ['e1', {
      id: 'e1',
      source: { nodeId: 'n1', id: 'i1' }, // ❌ 连接到 input 而非 output
      target: { nodeId: 'n2', id: 'i1' }  // ❌ 连接到 input 而非 output
    }]
  ])
};
```

**类型系统层面**

```typescript
// Endpoint 不区分输入输出
export interface Endpoint<NI, SI> {
  nodeId: NI;
  id: SI;  // SI 是 SlotId，但不知道是 input 还是 output
}

// 边的连接规则无法在类型层面表达
export interface Edge<EI, NI, SI> {
  source: Endpoint<NI, SI>;  // 应该是 OutputSlot
  target: Endpoint<NI, SI>;    // 应该是 InputSlot
}
```

**改进建议**

方案一：引入类型标记的 Slot

```typescript
// 输出插槽
export interface OutputSlot<NI extends NodeId, SI extends SlotId, T = unknown> 
  extends Slot<NI, SI, T> {
  direction: 'output';
}

// 输入插槽  
export interface InputSlot<NI extends NodeId, SI extends SlotId, T = unknown>
  extends Slot<NI, SI, T> {
  direction: 'input';
}

// 区分端点类型
export type OutputEndpoint = { nodeId: NodeId; id: SlotId; direction: 'output' };
export type InputEndpoint = { nodeId: NodeId; id: SlotId; direction: 'input' };

// 带约束的边
export interface Edge<EI extends EdgeId, NI extends NodeId, SI extends SlotId> {
  id: EI;
  source: OutputEndpoint;  // ✅ 必须是 output
  target: InputEndpoint;   // ✅ 必须是 input
}
```

方案二：使用编译时校验函数

```typescript
// 运行时验证函数
function validateEdgeConnection(
  sourceSlot: Slot, 
  targetSlot: Slot
): boolean {
  return sourceSlot.direction === 'output' && 
         targetSlot.direction === 'input' &&
         sourceSlot.type === targetSlot.type;
}
```

---

### 3.2 【高】缺陷二：缺少条件边/条件路由机制

**缺陷描述**

当前类型系统仅支持普通边（`Edge`），无法表达条件分支逻辑。这是实现工作流引擎、状态机等复杂图形逻辑的核心能力缺失。

**业务场景**

```
用户输入 → 分类节点 → { 紧急 → 紧急处理流程
                 → { 问题 → 问题处理流程
                 → { 普通 → 普通处理流程
```

**langgraph 实现参考**

```python
# langgraph 的条件边完整实现
from typing import Literal
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    classification: str
    response: str

def classify(state: State) -> dict:
    return {"classification": "urgent" if "!" in state.get("input", "") else "general"}

def route_classification(state: State) -> Literal["urgent", "general"]:
    return state["classification"]

builder = StateGraph(State)
builder.add_node("classify", classify)

# 条件边：源节点 + 路由函数 + 路由表
builder.add_conditional_edges(
    "classify",
    route_classification,
    {
        "urgent": "handle_urgent",
        "general": "handle_general"
    }
)
```

**改进建议**

```typescript
// 路由函数类型：基于状态决定下一个节点
export type RoutingFunction<S, NI extends NodeId> = (state: S) => NI;

// 路由表
export type RouteMap<NI extends NodeId> = Record<string, NI>;

// 条件边定义
export interface ConditionalEdge<
  EI extends EdgeId,
  NI extends NodeId,
  SI extends SlotId,
  S = unknown
> {
  id: EI;
  source: NI;  // 源节点ID
  router: RoutingFunction<S, NI>;  // 路由函数
  routes: RouteMap<NI>;  // 路由表
}

// 边的联合类型
export type AnyEdge<EI, NI, SI, S> = Edge<EI, NI, SI> | ConditionalEdge<EI, NI, SI, S>;

// 更新后的 Graph
export interface Graph<NI, EI, SI, T, S = unknown> {
  nodes: Record<NI, Node<NI, SI, T>>;
  edges: Map<EI, AnyEdge<EI, NI, SI, S>>;
  // 或者分离普通边和条件边
  conditionalEdges?: ConditionalEdge<EI, NI, SI, S>[];
}
```

---

### 3.3 【高】缺陷三：边缺少元数据支持

**缺陷描述**

`Edge` 类型仅包含 `id`、`source`、`target` 三个字段，无法存储边的样式、权重、标签、延迟等业务元数据。

**使用场景**

| 元数据用途 | 场景描述 |
|-----------|---------|
| 样式信息 |边的颜色、宽度、虚线/实线 |
| 权重/概率 | 边的权重用于随机选择、条件概率 |
| 标签/注释 | 边的描述性文本 |
| 执行控制 | 延迟执行、并行/串行标记 |

**petgraph 对比**

```rust
// petgraph 的边包含 weight 元数据
struct Edge<E, Ix> {
    weight: E,           // 用户定义的边数据
    next: [EdgeIndex<Ix>; 2],
    node: [NodeIndex<Ix>; 2],
}

// 使用示例：带权重的图
let graph: DiGraph<&str, f64> = DiGraph::new();
graph.add_edge("A", "B", 0.5);  // 权重 0.5
```

**改进建议**

```typescript
// 边元数据接口
export interface EdgeMetadata {
  label?: string;        // 边的标签
  color?: string;        // 边的颜色
  weight?: number;        // 权重
  style?: 'solid' | 'dashed' | 'dotted';
  animated?: boolean;     // 是否动画
  metadata?: Record<string, unknown>;  // 扩展元数据
}

// 通用边类型
export interface Edge<
  EI extends EdgeId = EdgeId,
  NI extends NodeId = NodeId,
  SI extends SlotId = SlotId,
  M = unknown
> {
  id: EI;
  source: Endpoint<NI, SI>;
  target: Endpoint<NI, SI>;
  metadata?: M;  // ✅ 边元数据
}
```

---

### 3.4 【中】缺陷四：缺少状态建模机制

**缺陷描述**

当前 `Graph` 类型仅负责存储节点和边的结构数据，没有内置状态（State）概念。状态传递和更新逻辑需要外部实现。

**langgraph StateGraph 设计参考**

```python
# langgraph 状态建模
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, END, START

# 1. 定义状态结构
class State(TypedDict):
    values: Annotated[list[int], add_to_list]  # 带 reducer 的列表
    total: int
    
# 2. 定义节点（接收状态、返回部分更新）
def add_value(state: State) -> dict:
    new_value = len(state["values"]) + 1
    return {"values": [new_value]}  # 返回部分更新

def compute_total(state: State) -> dict:
    return {"total": sum(state["values"])}

# 3. 构建状态图
builder = StateGraph(State)
builder.add_node("add_value", add_value)
builder.add_node("compute_total", compute_total)
builder.add_edge(START, "add_value")
builder.add_edge("add_value", "compute_total")
builder.add_edge("compute_total", END)

# 4. 编译并执行
graph = builder.compile()
result = graph.invoke({"values": [], "total": 0})
```

**核心概念**

| 概念 | 作用 |
|------|------|
| State | 贯穿整个图的共享数据结构 |
| Reducer | 合并多次部分更新的策略 |
| Partial Update | 节点只返回状态的部分更新 |
| Checkpoint | 状态快照，支持恢复 |

**改进建议**

```typescript
// 状态更新函数类型
export type StateReducer<S, U> = (current: S, update: U) => S;

// 部分更新类型
export type PartialState<S> = Partial<S>;

// 状态节点
export interface StateNode<
  NI extends NodeId,
  SI extends SlotId,
  S,
  U
> {
  id: NI;
  type: string;
  title?: string;
  inputs?: Slot[];
  outputs?: Slot[];
  reducer?: StateReducer<S, U>;  // ✅ 状态 reducer
  update?: (state: S) => PartialState<S>;  // ✅ 部分更新函数
}

// 状态图
export interface StateGraph<
  NI extends NodeId,
  EI extends EdgeId,
  SI extends SlotId,
  T,
  S
> {
  id?: string;
  nodes: Record<NI, StateNode<NI, SI, S, unknown>>;
  edges: Map<EI, Edge<EI, NI, SI>>;
  state: S;  // ✅ 初始状态
  reducers?: Record<string, StateReducer<S, unknown>>;
}
```

---

### 3.5 【中】缺陷五：连接无反向追踪能力

**缺陷描述**

`Node` 的 `inputs` 和 `outputs` 仅定义了节点自身的端口信息，无法直接查询 "哪些节点连接到了我的输入" 或 "我的输出连接到了哪些节点"。

**查询场景**

| 查询需求 | 使用场景 |
|---------|---------|
| 输入来源 | 删除节点时需要断开所有连接到它的边 |
| 输出目标 | 执行节点时需要知道数据流向哪些下游 |
| 入度/出度 | 计算图的关键路径、检测环 |

**litegraph.js 实现**

```javascript
// litegraph 的 slot 包含 links 数组
LGraphNode: {
  inputs: [{
    name: "value",
    type: "number", 
    links: ["link_1", "link_2"]  // ✅ 反向追踪
  }],
  outputs: [{
    name: "result", 
    type: "number",
    links: ["link_3"]  // ✅ 反向追踪
  }]
}

// 通过 links 可以直接查询连接的边
const inputLinks = node.inputs[0].links;
const connectedEdges = inputLinks.map(linkId => graph.links[linkId]);
```

**node-red 实现**

```javascript
// node-red 使用 wires 数组作为邻接表
Node: {
  id: "node-1",
  type: "processor",
  wires: [
    ["node-2", "node-3"],  // 输出0连接到 node-2 和 node-3
    ["node-4"]              // 输出1连接到 node-4
  ]
}

// 特点：同一个数组索引代表同一个输出端口
```

**改进建议**

方案一：在 Slot 中增加 links 字段

```typescript
export interface Slot<NI, SI, T> extends Endpoint<NI, SI> {
  name: string;
  direction: 'input' | 'output';
  type?: T;
  links?: EI[];  // ✅ 连接到此 Slot 的边 ID 列表
}
```

方案二：在 Graph 层面提供邻接表查询

```typescript
export interface Graph<NI, EI, SI, T> {
  id?: string;
  nodes: Record<NI, Node<NI, SI, T>>;
  edges: Map<EI, Edge<EI, NI, SI>>;
  
  // ✅ 邻接表查询方法（可作为工具函数）
}

// 工具函数
export function getIncomingEdges(
  graph: Graph, 
  nodeId: NodeId, 
  slotId: SlotId
): Edge[] {
  return Array.from(graph.edges.values()).filter(
    e => e.target.nodeId === nodeId && e.target.id === slotId
  );
}

export function getOutgoingEdges(
  graph: Graph,
  nodeId: NodeId,
  slotId: SlotId
): Edge[] {
  return Array.from(graph.edges.values()).filter(
    e => e.source.nodeId === nodeId && e.source.id === slotId
  );
}
```

---

### 3.6 【中】缺陷六：泛型参数过多导致使用复杂

**缺陷描述**

`Graph`、`Node`、`Edge` 等类型都有多个泛型参数（`NI, EI, SI, T`），创建简单节点时需要显式指定所有参数，增加了使用复杂度。

**问题示例**

```typescript
// 当前：创建简单节点需要指定所有泛型参数
const node: Node<NodeId, SlotId, string> = {
  id: 'n1' as NodeId,
  type: 'adder',
  inputs: [{
    nodeId: 'n1' as NodeId,
    id: 'i1' as SlotId,
    name: 'A',
    direction: 'input',
    type: 'number'
  }]
};

// 泛型推导失败时尤其繁琐
const createNode = <NI, SI, T>(id: NI, type: string): Node<NI, SI, T> => ({ id, type });
```

**改进建议**

```typescript
// 提供默认类型别名
export type AnyNode = Node<any, any, any>;
export type AnyEdge = Edge<any, any, any>;
export type AnySlot = Slot<any, any, any>;
export type AnyGraph = Graph<any, any, any, any>;

// 提供工厂函数简化创建
export function createNode<T = unknown>(
  id: string,
  type: string,
  options?: {
    title?: string;
    inputs?: Slot[];
    outputs?: Slot[];
  }
): Node<NodeId, SlotId, T> {
  return {
    id: id as NodeId,
    type,
    title: options?.title,
    inputs: options?.inputs,
    outputs: options?.outputs
  };
}

// 提供类型推断的 builder
export interface NodeBuilder<T = unknown> {
  id(id: string): NodeBuilder<T>;
  type(type: string): NodeBuilder<T>;
  title(title: string): NodeBuilder<T>;
  addInput(name: string, direction: 'input' | 'output', type?: string): NodeBuilder<T>;
  addOutput(name: string, direction: 'output' | 'input', type?: string): NodeBuilder<T>;
  build(): Node<NodeId, SlotId, T>;
}
```

---

### 3.7 【低】缺陷七：节点位置信息缺失

**缺陷描述**

`Node` 类型没有 `position` 字段，节点在 UI 中的位置信息需要外部存储，增加了图形渲染的复杂度。

**使用场景**

| 场景 | 需求 |
|------|------|
| 持久化 | 保存/加载图形布局 |
| 协作编辑 | 多用户同时编辑位置 |
| 自动布局 | 算法计算节点位置 |

**litegraph.js 实现**

```javascript
LGraphNode: {
  id: number;
  type: string;
  title: string;
  pos: [number, number],   // ✅ 位置 [x, y]
  size: [number, number],  // ✅ 尺寸 [width, height]
}
```

**node-red 实现**

```javascript
Node: {
  id: string;
  type: string;
  x: number,   // ✅ X 坐标
  y: number,   // ✅ Y 坐标
  z: string,   // 子图 ID
}
```

**改进建议**

```typescript
// 位置信息
export interface Position {
  x: number;
  y: number;
}

// 尺寸信息
export interface Size {
  width: number;
  height: number;
}

// 带布局信息的节点
export interface LayoutNode<NI, SI, T> extends Node<NI, SI, T> {
  position?: Position;
  size?: Size;
}

// 或分离为独立的 NodeLayout 类型
export interface NodeLayout {
  nodeId: NodeId;
  position: Position;
  size?: Size;
}

// 布局图
export interface LayoutGraph<NI, EI, SI, T> {
  graph: Graph<NI, EI, SI, T>;
  layouts: Map<NI, NodeLayout>;  // ✅ 独立的布局信息
}
```

---

### 3.8 【低】缺陷八：缺少特殊节点入口/出口

**缺陷描述**

没有 `START`/`END` 等特殊节点标识，无法在类型层面表达图的入口和出口，降低了图形语义完整性。

**langgraph START/END 设计**

```python
from langgraph.graph import START, END, StateGraph

builder = StateGraph(State)

# START 和 END 是特殊的虚拟节点
builder.add_edge(START, "first_node")    # 入口
builder.add_edge("last_node", END)      # 出口

# 编译后的图执行时从 START 开始，到 END 结束
graph = builder.compile()
result = graph.invoke(initial_state)
```

**改进建议**

```typescript
// 特殊节点标识
export type SpecialNodeId = Brand<string, 'START'> | Brand<string, 'END'>;

// 图元数据
export interface GraphMeta<NI extends NodeId> {
  entry: NI;           // 入口节点
  exit?: NI | NI[];    // 出口节点（可多个）
}

// 更新后的 Graph
export interface ExecutableGraph<NI, EI, SI, T> {
  id?: string;
  nodes: Record<NI, Node<NI, SI, T>>;
  edges: Map<EI, Edge<EI, NI, SI>>;
  meta: GraphMeta<NI>;  // ✅ 图元数据
}
```

---

### 3.9 【低】缺陷九：缺少图变体支持

**缺陷描述**

当前只有一种 `Graph` 类型，无法处理索引稳定性、稀疏/密集图切换等不同场景需求。

**petgraph 图变体体系**

```rust
// 1. 标准有向图
type DiGraph<N, E> = Graph<N, E, Directed, DefaultIx>;

// 2. 无向图  
type UnGraph<N, E> = Graph<N, E, Undirected, DefaultIx>;

// 3. 稳定图（删除节点后索引不变）
struct StableGraph<N, E, Ty = Directed, Ix = DefaultIx> {
    g: Graph<Option<N>, Option<E>, Ty, Ix>,  // Option 包装，支持空洞
    free_node: NodeIndex<Ix>,  // 空闲节点链表
    free_edge: EdgeIndex<Ix>,
}

// 4. 基于 HashMap 的图（适合稀疏图）
struct GraphMap<N, E, Ty, Ix> { /* ... */ }

// 5. 邻接矩阵图（适合密集图）
struct MatrixGraph<N, E, Ty> { /* ... */ }
```

**改进建议**

```typescript
// 图类型枚举
export enum GraphType {
  Directed = 'directed',
  Undirected = 'undirected',
  Stable = 'stable'  // 索引稳定
}

// 配置选项
export interface GraphOptions {
  type?: GraphType;
  directed?: boolean;  // 是否为有向图
}

// 稳定图（支持节点/边删除）
export interface StableGraph<NI, EI, SI, T> {
  // 使用 Option 类型包装，允许空洞
  nodes: Record<NI, Node<NI, SI, T> | null>;
  edges: Map<EI, Edge<EI, NI, SI> | null>;
  deletedNodes: Set<NI>;  // 已删除的节点ID
  deletedEdges: Set<EI>;  // 已删除的边ID
}
```

---

## 4. 改进建议汇总

### 4.1 优先级矩阵

| 优先级 | 缺陷 | 改进难度 | 影响范围 |
|:------:|------|:--------:|---------|
| **高** | 边的方向性验证 | 中 | 类型安全 |
| **高** | 条件边机制 | 高 | 功能完整 |
| **高** | 反向追踪能力 | 中 | 图遍历 |
| **中** | 边元数据 | 低 | 业务扩展 |
| **中** | 状态建模 | 高 | 状态流 |
| **中** | 泛型简化 | 低 | DX |
| **低** | 节点位置 | 低 | UI 集成 |
| **低** | 特殊节点 | 低 | 语义完整 |
| **低** | 图变体 | 高 | 高级用法 |

### 4.2 改进路线图

#### Phase 1: 基础增强（1-2周）

```typescript
// 1.1 边的方向性验证
export interface OutputSlot extends Slot { direction: 'output'; }
export interface InputSlot extends Slot { direction: 'input'; }

// 1.2 边元数据支持
export interface Edge<EI, NI, SI, M = unknown> {
  id: EI;
  source: OutputEndpoint;
  target: InputEndpoint;
  metadata?: M;
}

// 1.3 泛型简化
export type AnyNode = Node<any, any, any>;
```

#### Phase 2: 功能完善（2-4周）

```typescript
// 2.1 条件边
export interface ConditionalEdge<EI, NI, SI, S> {
  id: EI;
  source: NI;
  router: (state: S) => NI;
  routes: Record<string, NI>;
}

// 2.2 反向追踪
export interface Slot {
  // ...
  links?: EI[];
}

// 2.3 节点位置
export interface Position { x: number; y: number; }
export interface LayoutNode extends Node {
  position?: Position;
}
```

#### Phase 3: 高级特性（4-8周）

```typescript
// 3.1 状态建模
export interface StateGraph<S> {
  nodes: Record<string, StateNode<S>>;
  edges: Map<string, Edge>;
  state: S;
}

// 3.2 特殊节点
export interface GraphMeta<NI> {
  entry: NI;
  exit?: NI | NI[];
}

// 3.3 图变体
export interface StableGraph extends Graph {
  deletedIds: Set<string>;
}
```

---

## 5. 附录

### 5.1 参考资料

| 库/框架 | 语言 | 特点 | 参考章节 |
|---------|------|------|---------|
| [litegraph.js](https://github.com/jagenjo/litegraph.js) | JavaScript | 节点编辑、Canvas渲染 | 3.1, 3.5, 3.7 |
| [node-red](https://github.com/node-red/node-red) | JavaScript | 流程编排、物联网 | 2.2.1, 3.3, 3.5 |
| [petgraph](https://github.com/petgraph/petgraph) | Rust | 高性能图算法 | 2.2.2, 3.3, 3.9 |
| [langgraph](https://github.com/langchain-ai/langgraph) | Python | 状态图、LLM工作流 | 2.2.3, 3.2, 3.4 |

### 5.2 术语表

| 术语 | 定义 |
|------|------|
| Brand Type | 类型标记技术，通过交叉类型为原始类型添加语义标签 |
| Endpoint | 边的端点引用，仅包含节点ID和端口ID |
| Slot | 节点端口定义，包含端点引用及元数据 |
| Partial Update | 部分状态更新，只返回需要变更的字段 |
| Reducer | 状态合并函数，定义如何合并多次更新 |
|邻接表 | 图的存储结构，通过每个节点的相邻节点列表表示图 |
| 条件边 | 根据状态动态决定目标节点的边 |

---

**文档结束**
