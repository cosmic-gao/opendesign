# @openspace/signal

一个轻量级（< 1KB）、类型安全且支持通配符的事件发射器（Event Emitter）。

## 特性

- 🔒 **完全类型安全**：基于 TypeScript 泛型，提供极致的代码提示和类型检查。
- 🌟 **通配符支持**：支持监听所有事件 (`*`)。
- ⚡ **高性能**：优化的事件分发机制，无外部依赖。
- �️ **健壮可靠**：支持安全移除 `once` 监听器，边界情况处理完善。
- �📦 **ESM & CJS**：同时支持 ES Module 和 CommonJS。

## 安装

```bash
pnpm add @openspace/signal
```

## 使用指南

### 1. 基础用法

```typescript
import { Signal } from '@openspace/signal';

// 定义事件映射
interface AppEvents {
  'user:login': { id: number; name: string };
  'user:logout': void;
  'error': Error;
}

// 创建实例
const signal = new Signal<AppEvents>();

// 监听事件
const off = signal.on('user:login', (user) => {
  console.log(`User logged in: ${user.name}`);
});

// 触发事件
signal.emit('user:login', { id: 1, name: 'Alice' });

// 取消监听
off();
```

### 2. 通配符监听

你可以使用 `*` 监听所有发生的事件，这对调试或日志记录非常有用。

```typescript
signal.on('*', (type, event) => {
  console.log(`[Event Log] ${String(type)}:`, event);
});
```

### 3. 一次性监听

`once` 注册的监听器只会执行一次。

```typescript
const handler = (err) => {
  console.error('Critical error:', err);
};

signal.once('error', handler);

// 支持使用原始 handler 引用提前取消
signal.off('error', handler);
```

### 4. 清除监听

```typescript
// 清除特定事件的所有监听器
signal.off('user:login');

// 清除所有事件的所有监听器
signal.clear();
```

## API

### `class Signal<E>`

泛型 `E` 定义了事件名称到载荷类型的映射。

#### `on(type, handler)`

注册事件监听器。

- `type`: 事件名称或 `'*'`
- `handler`: 事件处理函数
- **Returns**: 取消订阅的函数 `() => void`

#### `once(type, handler)`

注册只执行一次的监听器。

- **注意**: 即使 `once` 会自动移除，你仍然可以手动调用 `off(type, handler)` 提前移除它。

#### `off(type, handler?)`

移除监听器。如果未提供 `handler`，则移除该事件类型下的所有监听器。

- `type`: 事件名称或 `'*'`
- `handler`: (可选) 要移除的处理函数。支持移除 `once` 注册的原始函数引用。

#### `emit(type, event)`

触发事件。

#### `clear()`

清除所有监听器。

## License

MIT
