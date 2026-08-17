/**
 * `@openconsole/graph` — 类型化端口的有向图内核。
 *
 * 四层职责，依赖只向下：
 * - {@link Graph} 负责编辑——整数索引存储，邻接是纯数组读取，变更走事件；
 * - {@link Structure} 是算法的契约——五个只读字段，凡是凑得出的实现都能跑全套算法；
 * - 算法层只认这个契约，可分步推进（{@link Task}），可中断、可续跑、可分帧；
 * - {@link Snapshot} 是两端之间唯一的编译器——把可变图压成不可变 CSR，过滤 / 折叠 /
 *   无向化 / 合并都在编译期完成，全部数据是 typed-array，可整份搬到 Worker。
 *
 * 契约（`core/structure.ts`）刻意不认识 `Graph`，编译器（`core/snapshot.ts`）才认识；
 * 算法层因此完全不依赖编辑层，这条边界由 `tests/unit/layering.test.ts` 机检。
 * 需要同时站在两侧的只有两个模块：编译器本身，以及订阅图事件增量维护拓扑序的
 * {@link Ordering}。
 *
 * @packageDocumentation
 */

export * from "./core";
