# 代码关系图扩展

本文档定义如何将框架扩展用于代码关系分析场景。

---

## 1. 场景需求

```
用途: 分析代码库的结构、依赖关系、影响范围

需求:
- 节点类型: 文件、函数、类、模块、接口
- 关系类型: 导入/导出、调用、继承、实现、引用
- 操作: 依赖分析、影响分析、循环依赖检测、重构模拟
- 规模: 从小型项目到百万级代码文件
```

---

## 2. 节点类型定义

```typescript
// 代码节点类型
type CodeNodeType = 'file' | 'function' | 'class' | 'interface' | 'module';

// 端点定义
interface CodeNodeEndpoints extends NodeEndpoints {
  in: {
    analyze: Slot<{ mode: 'full' | 'incremental' }>;
    query: Slot<DependencyQuery>;
    update: Slot<CodeUpdate>;
    control: Slot<ControlMessage>;
  };
  out: {
    ast: Slot<ASTNode>;
    deps: Slot<DependencyResult>;
    impacts: Slot<ImpactResult>;
    error: Slot<ErrorMessage>;
  };
}
```

---

## 3. 代码节点状态

```typescript
interface CodeNodeState extends NodeState {
  nodeType: CodeNodeType;
  
  // 代码信息
  filePath?: string;
  name: string;
  startLine?: number;
  endLine?: number;
  
  // 关系
  dependencies: string[];     // 直接依赖的节点 ID
  dependents: string[];        // 被依赖的节点 ID（反向索引）
  
  // AST（可选，节省内存）
  ast?: SerializedASTNode;
  symbolTable?: Map<string, SymbolInfo>;
  
  // 分析结果
  metrics?: {
    complexity?: number;
    coupling?: number;
    cohesion?: number;
  };
  
  // 错误
  parseError?: string;
}
```

---

## 4. 节点处理器

```typescript
const codeNodeHandler: NodeHandler<CodeNodeEndpoints['in'], CodeNodeEndpoints['out']> = {
  
  async onMessage(endpoint, message, state) {
    switch (endpoint) {
      case 'analyze':
        return this.analyzeCode(message, state);
      case 'query':
        return this.queryDependencies(message, state);
      case 'update':
        return this.updateCode(message, state);
      default:
        return { action: 'continue' };
    }
  },
  
  async analyzeCode(msg: { mode: 'full' | 'incremental' }, state: CodeNodeState) {
    // 解析代码生成 AST
    const ast = await parseCode(state.filePath);
    
    // 提取依赖
    const deps = extractDependencies(ast);
    
    // 更新状态
    return {
      updates: {
        ast,
        dependencies: deps.map(d => d.nodeId),
        metrics: calculateMetrics(ast)
      },
      messages: {
        deps: {
          type: 'deps',
          nodeId: state.nodeId,
          dependencies: deps
        }
      }
    };
  },
  
  async queryDependencies(msg: DependencyQuery, state: CodeNodeState) {
    // 回答依赖查询
    const result = await this.calculateImpacts(state, msg.direction);
    
    return {
      messages: {
        impacts: {
          type: 'impacts',
          nodeId: state.nodeId,
          result
        }
      }
    };
  }
};
```

---

## 5. 依赖分析流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    依赖分析流程                                   │
│                                                                  │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                │
│  │  Parser  │────►│ Analyzer │────►│ Collector│                │
│  │  节点    │     │  节点     │     │  节点    │                │
│  └──────────┘     └──────────┘     └──────────┘                │
│       │                │                │                        │
│       ▼                ▼                ▼                        │
│   [File A] ──────► [File B] ──────► [Dependency│                │
│   code:file       code:class       Graph]                         │
│                                                                  │
│  Superstep 0: Parser 解析所有文件，输出 AST                       │
│  Superstep 1: Analyzer 提取依赖关系                              │
│  Superstep 2: Collector 汇总依赖图                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 影响分析

```typescript
// 影响分析算法
async function calculateImpacts(
  nodeId: string,
  direction: 'upstream' | 'downstream' | 'both',
  state: CodeNodeState
): Promise<ImpactResult> {
  const visited = new Set<string>();
  const impacts = { upstream: [], downstream: [] };
  
  if (direction === 'upstream' || direction === 'both') {
    // 追踪上游依赖（谁依赖我）
    const upstream = this.traverseDependents(nodeId, visited);
    impacts.upstream = upstream;
  }
  
  if (direction === 'downstream' || direction === 'both') {
    // 追踪下游依赖（我依赖谁）
    const downstream = this.traverseDependencies(nodeId, visited);
    impacts.downstream = downstream;
  }
  
  return {
    nodeId,
    impacts,
    totalImpact: impacts.upstream.length + impacts.downstream.length
  };
}
```

---

## 7. 循环依赖检测

```typescript
// 在超步骤中检测循环依赖
async detectCircularDependencies(): Promise<CircularDependency[]> {
  const graph = this.buildDependencyGraph();
  const cycles: CircularDependency[] = [];
  
  for (const [nodeId, node] of graph.nodes) {
    const visited = new Set<string>();
    const stack: string[] = [];
    
    if (this.hasCycle(nodeId, graph, visited, stack)) {
      cycles.push({
        nodes: [...stack],
        length: stack.length
      });
    }
  }
  
  return cycles;
}
```

---

## 8. 示例图结构

```
代码关系图示例:

┌─────────────┐
│  index.ts   │
│ code:file   │
└──────┬──────┘
       │ depends
       ▼
┌─────────────┐     ┌─────────────┐
│  User.ts   │────►│  types.ts   │
│ code:class │     │code:interface│
└──────┬─────┘     └─────────────┘
       │ implements
       ▼
┌─────────────┐     ┌─────────────┐
│UserImpl.ts │────►│ Logger.ts   │
│code:class  │     │ code:class  │
└─────────────┘     └─────────────┘
```

---

## 9. 相关文档

- [核心概念索引](../02-concepts/)
- [待确认决策](../03-decisions/00-pending.md)
