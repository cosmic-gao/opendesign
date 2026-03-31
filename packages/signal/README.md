# @opendesign/signal

一个轻量级、类型安全并支持通配符监听的事件发射器（Event Emitter）。

## 特性

- 类型安全的事件映射与监听器签名
- 支持 `*` 通配符监听所有事件
- 支持 `once()` 一次性监听
- 支持通过原始 handler 提前移除 `once()` 监听
- 无外部运行时依赖

## 在本仓库中使用

在 workspace 包中声明依赖：

```json
{
  "dependencies": {
    "@opendesign/signal": "workspace:*"
  }
}
```

## 使用指南

### 基础用法

```typescript
import { Signal } from '@opendesign/signal';

interface AppEvents {
  'user:login': { id: number; name: string };
  'user:logout': void;
  error: Error;
}

const signal = new Signal<AppEvents>();

const off = signal.on('user:login', (user) => {
  console.log(`User logged in: ${user.name}`);
});

signal.emit('user:login', { id: 1, name: 'Alice' });

off();
```

### 通配符监听

```typescript
signal.on('*', (type, event) => {
  console.log(`[event] ${String(type)}`, event);
});
```

### 一次性监听

```typescript
const handler = (error: Error) => {
  console.error('Critical error:', error.message);
};

signal.once('error', handler);

signal.off('error', handler);
```

### 清理监听器

```typescript
signal.off('user:login');

signal.clear();
```

## API

### `class Signal<E>`

泛型 `E` 定义事件名到载荷类型的映射。

### `on(type, handler)`

注册事件监听器，返回取消订阅函数。

### `once(type, handler)`

注册只执行一次的监听器。

### `off(type, handler?)`

移除监听器；如果未提供 `handler`，则移除该事件类型下的全部监听器。

### `emit(type, event)`

触发一个事件。

### `clear()`

移除全部监听器。

## 开发

在仓库根目录运行：

```bash
pnpm --filter @opendesign/signal test
```

## License

MIT
