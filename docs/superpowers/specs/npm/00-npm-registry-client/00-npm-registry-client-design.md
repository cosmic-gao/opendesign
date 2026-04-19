# @opendesign/npm NPM Registry 客户端库设计

**版本**: v1.0
**状态**: 设计完成

***

## 一、核心价值

| 能力 | 说明 |
|---|---|
| **跨运行时支持** | Node.js 18+ / Bun / Deno / Browser 原生支持 |
| **零运行时依赖** | 仅依赖 Web Standards（`fetch`, `ArrayBuffer`） |
| **链式调用** | Builder Pattern 提供直观的 API 和完善的 TypeScript 类型推导 |
| **多 Registry** | 通过 Adapter 模式支持 npmjs.org、Verdaccio 等多种私服 |
| **完整功能** | 查询、搜索、发布、下载、删除，覆盖 NPM Registry 完整生命周期 |

***

## 二、目录结构

```
packages/npm/
├── types.ts              # 核心接口与类型定义
├── client.ts             # NpmClient 入口
├── index.ts              # 统一导出
├── adapters/
│   ├── adapter.ts        # Registry 适配器接口
│   ├── factory.ts        # 适配器工厂
│   ├── npmjs.ts         # npmjs.org 适配器
│   └── verdaccio.ts     # Verdaccio 适配器
└── builders/
    ├── builder.ts        # Builder 基类
    ├── list.ts          # 列表/搜索 Builder
    ├── versions.ts       # 版本查询 Builder
    ├── meta.ts          # 元数据 Builder
    ├── publish.ts        # 发布 Builder
    ├── download.ts       # 下载 Builder
    └── remove.ts        # 删除 Builder
```

***

## 三、核心类型 (`types.ts`)

### 3.1 基础选项

```typescript
export interface RegistryOptions {
  registry?: string; // 默认 'https://registry.npmjs.org'
  token?: string;
}
```

### 3.2 跨平台二进制数据

```typescript
// tarball 可以是 ArrayBuffer、Uint8Array 或 base64 字符串
export type TarballData = ArrayBuffer | Uint8Array | string;
```

### 3.3 查询选项

```typescript
export interface PackageListOptions extends RegistryOptions {
  scopes?: string[];
  author?: string;
  visibility?: 'public' | 'private' | 'all';
}

export interface VersionListOptions extends RegistryOptions {
  page?: number;
  pageSize?: number;
}

export interface PackageMetaOptions extends RegistryOptions {
  version?: string;
}

export interface SearchOptions {
  text: string;
  size?: number;
  from?: number;
  quality?: number;
  popularity?: number;
  maintenance?: number;
}
```

### 3.4 数据模型

```typescript
// 包摘要信息
export interface PackageSummary {
  name: string;
  version: string;
  description?: string;
  author?: { name: string; email?: string };
}

// 包完整元数据
export interface PackageMeta {
  name: string;
  version: string;
  description?: string;
  author?: { name: string; email?: string };
  license?: string;
  repository?: { type: string; url: string };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  dist?: { shasum: string; tarball: string };
}

// Packument (Package Document)
export interface Packument {
  name: string;
  description?: string;
  'dist-tags': Record<string, string>;
  versions: Record<string, PackageMeta>;
  time: Record<string, string>;
  maintainers?: { name: string; email?: string }[];
  author?: { name: string; email?: string };
  repository?: { type: string; url: string };
  license?: string;
  readme?: string;
}

// 搜索结果
export interface SearchResult {
  package: {
    name: string;
    version: string;
    description?: string;
    keywords?: string[];
    date: string;
    links: { npm?: string; homepage?: string; repository?: string; bugs?: string };
    publisher: { username: string; email?: string };
    maintainers?: { username: string; email?: string }[];
  };
  score: {
    final: number;
    detail: { quality: number; popularity: number; maintenance: number };
  };
  searchScore: number;
}
```

### 3.5 结果类型

```typescript
export interface VersionListResult {
  versions: string[];
  total: number;
}

export interface DownloadResult {
  data: ArrayBuffer;
  fileName: string;
  contentType: string | null;
}

export interface PublishResult {
  success: boolean;
  message: string;
}

export interface RemoveResult {
  success: boolean;
  message: string;
}
```

### 3.6 Builder 基类

```typescript
export abstract class Builder<T> {
  protected options: Record<string, unknown> = {};
  abstract fetch(): Promise<T>;
}
```

***

## 四、适配器接口 (`adapters/adapter.ts`)

```typescript
import type {
  PackageListOptions,
  VersionListOptions,
  PackageMetaOptions,
  RegistryOptions,
  TarballData,
  PackageSummary,
  PackageMeta,
  Packument,
  SearchOptions,
  SearchResult,
  VersionListResult,
  DownloadResult,
  PublishResult,
  RemoveResult,
} from '../types';

export interface RegistryAdapter {
  listPackages(options: PackageListOptions): Promise<PackageSummary[]>;
  searchPackages(options: SearchOptions): Promise<SearchResult[]>;
  listVersions(packageName: string, options: VersionListOptions): Promise<VersionListResult>;
  getPackageMeta(packageName: string, options: PackageMetaOptions): Promise<PackageMeta>;
  getPackument(packageName: string, options?: PackageMetaOptions): Promise<Packument>;
  publish(packageName: string, options: RegistryOptions, manifest: object, tarballData: TarballData): Promise<PublishResult>;
  download(packageName: string, options: RegistryOptions & { version?: string }): Promise<DownloadResult>;
  removePackage(packageName: string, options: RegistryOptions): Promise<RemoveResult>;
  removeVersion(packageName: string, version: string, options: RegistryOptions): Promise<RemoveResult>;
}
```

***

## 五、npmjs.org 适配器 (`adapters/npmjs.ts`)

### 5.1 核心实现

```typescript
import type { RegistryAdapter } from './adapter';
import type {
  PackageListOptions,
  VersionListOptions,
  PackageMetaOptions,
  RegistryOptions,
  TarballData,
  PackageSummary,
  PackageMeta,
  Packument,
  SearchOptions,
  SearchResult,
  VersionListResult,
  DownloadResult,
  PublishResult,
  RemoveResult,
} from '../types';

export class NpmJsAdapter implements RegistryAdapter {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl = 'https://registry.npmjs.org', token?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
  }

  private async fetch(url: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    if (this.token) {
      headers.set('authorization', `Bearer ${this.token}`);
    }
    return fetch(url, { ...init, headers });
  }
```

### 5.2 查询方法

```typescript
  async listPackages(options: PackageListOptions): Promise<PackageSummary[]> {
    const url = `${this.baseUrl}/-/all/static/today.json`;
    const response = await this.fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to list packages: ${response.status}`);
    }
    const data = await response.json();
    let packages: PackageSummary[] = Object.values(data);
    if (options.scopes?.length) {
      packages = packages.filter(pkg =>
        options.scopes!.some(scope => pkg.name.startsWith(`${scope}/`))
      );
    }
    if (options.author) {
      packages = packages.filter(pkg => pkg.author?.name === options.author);
    }
    return packages;
  }

  async searchPackages(options: SearchOptions): Promise<SearchResult[]> {
    const params = new URLSearchParams({ text: options.text });
    if (options.size) params.set('size', String(options.size));
    if (options.from) params.set('from', String(options.from));
    if (options.quality) params.set('quality', String(options.quality));
    if (options.popularity) params.set('popularity', String(options.popularity));
    if (options.maintenance) params.set('maintenance', String(options.maintenance));
    const url = `${this.baseUrl}/-/v1/search?${params}`;
    const response = await this.fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to search packages: ${response.status}`);
    }
    const data = await response.json();
    return data.objects || [];
  }

  async listVersions(packageName: string, options: VersionListOptions): Promise<VersionListResult> {
    const encodedName = encodeURIComponent(packageName);
    const url = `${this.baseUrl}/${encodedName}`;
    const response = await this.fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to get versions: ${response.status}`);
    }
    const data = await response.json();
    const versions = Object.keys(data.versions || {});
    return { versions, total: versions.length };
  }

  async getPackageMeta(packageName: string, options: PackageMetaOptions): Promise<PackageMeta> {
    const encodedName = encodeURIComponent(packageName);
    const url = options.version
      ? `${this.baseUrl}/${encodedName}/${encodeURIComponent(options.version)}`
      : `${this.baseUrl}/${encodedName}`;
    const response = await this.fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to get package meta: ${response.status}`);
    }
    return response.json();
  }

  async getPackument(packageName: string, options?: PackageMetaOptions): Promise<Packument> {
    const encodedName = encodeURIComponent(packageName);
    const url = `${this.baseUrl}/${encodedName}`;
    const response = await this.fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to get packument: ${response.status}`);
    }
    return response.json();
  }
```

### 5.3 发布与删除

```typescript
  async publish(packageName: string, options: RegistryOptions, manifest: object, tarballData: TarballData): Promise<PublishResult> {
    const encodedName = encodeURIComponent(packageName);
    const url = `${this.baseUrl}/${encodedName}`;

    // 将 tarballData 转换为 base64
    let base64Data: string;
    if (typeof tarballData === 'string') {
      base64Data = tarballData;
    } else if (tarballData instanceof Uint8Array) {
      base64Data = btoa(String.fromCharCode(...tarballData));
    } else {
      const bytes = new Uint8Array(tarballData);
      base64Data = btoa(String.fromCharCode(...bytes));
    }

    const version = (manifest as { version?: string }).version || '1.0.0';
    const fileName = `${packageName}-${version}.tgz`;

    const payload = {
      _id: packageName,
      name: packageName,
      description: (manifest as { description?: string }).description || '',
      'dist-tags': { latest: version },
      versions: { [version]: manifest },
      readme: (manifest as { readme?: string }).readme || '',
      _attachments: {
        [fileName]: {
          content_type: 'application/octet-stream',
          data: base64Data,
          length: base64Data.length,
        },
      },
    };

    const response = await this.fetch(url, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, message: `Publish failed (${response.status}): ${errorText}` };
    }

    return { success: true, message: 'Successfully published' };
  }

  async download(packageName: string, options: RegistryOptions & { version?: string }): Promise<DownloadResult> {
    const packument = await this.getPackument(packageName);
    const version = options.version || packument['dist-tags']?.latest || 'latest';
    const versionMeta = packument.versions[version];

    if (!versionMeta?.dist?.tarball) {
      throw new Error(`Tarball not found for version ${version}`);
    }

    const tarballUrl = versionMeta.dist.tarball;
    const response = await this.fetch(tarballUrl);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const data = await response.arrayBuffer();
    const fileName = tarballUrl.split('/').pop() || `${packageName}-${version}.tgz`;

    return {
      data,
      fileName,
      contentType: response.headers.get('content-type'),
    };
  }

  async removePackage(packageName: string, options: RegistryOptions): Promise<RemoveResult> {
    const encodedName = encodeURIComponent(packageName);
    const url = `${this.baseUrl}/${encodedName}`;
    const response = await this.fetch(url, { method: 'DELETE' });
    if (!response.ok) {
      return { success: false, message: `Failed to remove package: ${response.status}` };
    }
    return { success: true, message: 'Package removed successfully' };
  }

  async removeVersion(packageName: string, version: string, options: RegistryOptions): Promise<RemoveResult> {
    const encodedName = encodeURIComponent(packageName);
    const encodedVersion = encodeURIComponent(version);
    const url = `${this.baseUrl}/${encodedName}/${encodedVersion}`;
    const response = await this.fetch(url, { method: 'DELETE' });
    if (!response.ok) {
      return { success: false, message: `Failed to remove version: ${response.status}` };
    }
    return { success: true, message: `Version ${version} removed successfully` };
  }
}
```

***

## 六、Verdaccio 适配器 (`adapters/verdaccio.ts`)

```typescript
import { NpmJsAdapter } from './npmjs';

export class VerdaccioAdapter extends NpmJsAdapter {
  constructor(baseUrl: string, token?: string) {
    super(baseUrl, token);
  }
}
```

***

## 七、适配器工厂 (`adapters/factory.ts`)

```typescript
import { NpmJsAdapter } from './npmjs';
import { VerdaccioAdapter } from './verdaccio';
import type { RegistryAdapter } from './adapter';

export function createAdapter(registry: string, token?: string): RegistryAdapter {
  const normalizedRegistry = registry.replace(/\/$/, '');

  if (
    normalizedRegistry === 'https://registry.npmjs.org' ||
    normalizedRegistry === 'http://registry.npmjs.org'
  ) {
    return new NpmJsAdapter(normalizedRegistry, token);
  }

  return new VerdaccioAdapter(normalizedRegistry, token);
}

export { NpmJsAdapter, VerdaccioAdapter };
export type { RegistryAdapter } from './adapter';
```

***

## 八、Builder 层实现

### 8.1 Builder 基类 (`builders/builder.ts`)

```typescript
export abstract class Builder<T> {
  protected options: Record<string, unknown> = {};
  abstract fetch(): Promise<T>;
}
```

### 8.2 列表/搜索 Builder (`builders/list.ts`)

```typescript
import { Builder } from './builder';
import { createAdapter } from '../adapters/factory';
import type { PackageSummary, SearchOptions } from '../types';

export class ListBuilder extends Builder<PackageSummary[]> {
  private scopes?: string[];
  private author?: string;
  private visibility?: 'public' | 'private' | 'all';
  private pageNumber = 1;
  private pageSize = 20;
  private searchQuery?: string;

  constructor(private options: { registry?: string; token?: string }) {
    super({});
  }

  scope(...scopes: string[]): this {
    this.scopes = scopes;
    return this;
  }

  author(authorName: string): this {
    this.author = authorName;
    return this;
  }

  visibility(visibilityType: 'public' | 'private' | 'all'): this {
    this.visibility = visibilityType;
    return this;
  }

  page(page: number, pageSize = 20): this {
    this.pageNumber = page;
    this.pageSize = pageSize;
    return this;
  }

  search(query: string): this {
    this.searchQuery = query;
    return this;
  }

  async fetch(): Promise<PackageSummary[]> {
    const registry = this.options.registry || 'https://registry.npmjs.org';
    const adapter = createAdapter(registry, this.options.token);

    if (this.searchQuery) {
      const searchOptions: SearchOptions = {
        text: this.searchQuery,
        size: this.pageSize,
        from: (this.pageNumber - 1) * this.pageSize,
      };
      const results = await adapter.searchPackages(searchOptions);
      return results.map(r => ({
        name: r.package.name,
        version: r.package.version,
        description: r.package.description,
        author: r.package.publisher
          ? { name: r.package.publisher.username, email: r.package.publisher.email }
          : undefined,
      }));
    }

    return adapter.listPackages({
      registry,
      scopes: this.scopes,
      author: this.author,
      visibility: this.visibility,
    });
  }
}
```

### 8.3 版本列表 Builder (`builders/versions.ts`)

```typescript
import { Builder } from './builder';
import { createAdapter } from '../adapters/factory';
import type { VersionListResult } from '../types';

export class VersionsBuilder extends Builder<VersionListResult> {
  private pageNumber = 1;
  private pageSize = 50;

  constructor(private packageName: string, private options: { registry?: string; token?: string }) {
    super({});
  }

  page(page: number, pageSize = 50): this {
    this.pageNumber = page;
    this.pageSize = pageSize;
    return this;
  }

  async fetch(): Promise<VersionListResult> {
    const registry = this.options.registry || 'https://registry.npmjs.org';
    const adapter = createAdapter(registry, this.options.token);
    return adapter.listVersions(this.packageName, {
      registry,
      page: this.pageNumber,
      pageSize: this.pageSize,
    });
  }
}
```

### 8.4 元数据 Builder (`builders/meta.ts`)

```typescript
import { Builder } from './builder';
import { createAdapter } from '../adapters/factory';
import type { PackageMeta, Packument } from '../types';

export class MetaBuilder extends Builder<PackageMeta | Packument> {
  private version?: string;
  private fullPackument = false;

  constructor(private packageName: string, private options: { registry?: string; token?: string }) {
    super({});
  }

  version(version: string): this {
    this.version = version;
    return this;
  }

  full(): this {
    this.fullPackument = true;
    return this;
  }

  async fetch(): Promise<PackageMeta | Packument> {
    const registry = this.options.registry || 'https://registry.npmjs.org';
    const adapter = createAdapter(registry, this.options.token);
    if (this.fullPackument) {
      return adapter.getPackument(this.packageName, { registry, version: this.version });
    }
    return adapter.getPackageMeta(this.packageName, { registry, version: this.version });
  }
}
```

### 8.5 发布 Builder (`builders/publish.ts`)

```typescript
import { Builder } from './builder';
import { createAdapter } from '../adapters/factory';
import type { PublishResult, TarballData } from '../types';

export class PublishBuilder extends Builder<PublishResult> {
  private manifestObj?: object;
  private tarballData?: TarballData;

  constructor(private options: { registry?: string; token?: string }) {
    super({});
  }

  manifest(manifest: object): this {
    this.manifestObj = manifest;
    return this;
  }

  tarball(data: TarballData): this {
    this.tarballData = data;
    return this;
  }

  async fetch(): Promise<PublishResult> {
    if (!this.manifestObj || !this.tarballData) {
      throw new Error('manifest and tarball data are required');
    }
    const registry = this.options.registry || 'https://registry.npmjs.org';
    if (!this.options.token) {
      throw new Error('token is required for publishing');
    }
    const adapter = createAdapter(registry, this.options.token);
    const packageName = (this.manifestObj as { name?: string }).name;
    if (!packageName) {
      throw new Error('package name is required');
    }
    return adapter.publish(packageName, { registry, token: this.options.token }, this.manifestObj, this.tarballData);
  }
}
```

### 8.6 下载 Builder (`builders/download.ts`)

```typescript
import { Builder } from './builder';
import { createAdapter } from '../adapters/factory';
import type { DownloadResult } from '../types';

export class DownloadBuilder extends Builder<DownloadResult> {
  private version?: string;

  constructor(private packageName: string, private options: { registry?: string; token?: string }) {
    super({});
  }

  version(version: string): this {
    this.version = version;
    return this;
  }

  async fetch(): Promise<DownloadResult> {
    const registry = this.options.registry || 'https://registry.npmjs.org';
    const adapter = createAdapter(registry, this.options.token);
    return adapter.download(this.packageName, { registry, version: this.version });
  }
}
```

### 8.7 删除 Builder (`builders/remove.ts`)

```typescript
import { Builder } from './builder';
import { createAdapter } from '../adapters/factory';
import type { RemoveResult } from '../types';

export class RemoveBuilder extends Builder<RemoveResult> {
  private version?: string;

  constructor(private packageName: string, private options: { registry?: string; token?: string }) {
    super({});
  }

  version(version: string): this {
    this.version = version;
    return this;
  }

  async fetch(): Promise<RemoveResult> {
    const registry = this.options.registry || 'https://registry.npmjs.org';
    if (!this.options.token) {
      throw new Error('token is required for removing');
    }
    const adapter = createAdapter(registry, this.options.token);
    if (this.version) {
      return adapter.removeVersion(this.packageName, this.version, { registry, token: this.options.token });
    }
    return adapter.removePackage(this.packageName, { registry, token: this.options.token });
  }
}
```

***

## 九、NpmClient 主类 (`client.ts`)

```typescript
import { ListBuilder } from './builders/list';
import { VersionsBuilder } from './builders/versions';
import { MetaBuilder } from './builders/meta';
import { PublishBuilder } from './builders/publish';
import { DownloadBuilder } from './builders/download';
import { RemoveBuilder } from './builders/remove';

export class NpmClient {
  static list(options: { registry?: string; token?: string } = {}): ListBuilder {
    return new ListBuilder(options);
  }

  static versions(packageName: string, options: { registry?: string; token?: string } = {}): VersionsBuilder {
    return new VersionsBuilder(packageName, options);
  }

  static meta(packageName: string, options: { registry?: string; token?: string } = {}): MetaBuilder {
    return new MetaBuilder(packageName, options);
  }

  static publish(options: { registry?: string; token?: string }): PublishBuilder {
    return new PublishBuilder(options);
  }

  static download(packageName: string, options: { registry?: string; token?: string } = {}): DownloadBuilder {
    return new DownloadBuilder(packageName, options);
  }

  static remove(packageName: string, options: { registry?: string; token?: string }): RemoveBuilder {
    return new RemoveBuilder(packageName, options);
  }
}
```

***

## 十、统一导出 (`index.ts`)

```typescript
export { NpmClient } from './client';
export { ListBuilder } from './builders/list';
export { VersionsBuilder } from './builders/versions';
export { MetaBuilder } from './builders/meta';
export { PublishBuilder } from './builders/publish';
export { DownloadBuilder } from './builders/download';
export { RemoveBuilder } from './builders/remove';
export { createAdapter, NpmJsAdapter, VerdaccioAdapter } from './adapters/factory';
export type { RegistryAdapter } from './adapters/adapter';

export type * from './types';
```

***

## 十一、使用示例

### 11.1 Node.js 环境

```typescript
import { readFileSync, writeFileSync } from 'node:fs';
import { NpmClient } from '@opendesign/npm';

const registry = 'https://registry.npmjs.org';
const token = process.env.NPM_TOKEN;

// 发布
const tarballBuffer = readFileSync('./dist/mypkg-1.0.0.tgz');
const manifest = JSON.parse(readFileSync('./package.json', 'utf-8'));

await NpmClient.publish({ registry, token })
  .manifest(manifest)
  .tarball(tarballBuffer)
  .fetch();

// 下载
const { data, fileName } = await NpmClient.download('lodash', { registry })
  .version('4.17.21')
  .fetch();

writeFileSync(`./downloads/${fileName}`, Buffer.from(data));
```

### 11.2 Deno 环境

```typescript
import { NpmClient } from "npm:@opendesign/npm";

const registry = 'https://registry.npmjs.org';
const token = Deno.env.get("NPM_TOKEN");

// 发布
const tarballData = await Deno.readFile('./dist/mypkg-1.0.0.tgz');
const manifest = JSON.parse(await Deno.readTextFile('./package.json'));

await NpmClient.publish({ registry, token })
  .manifest(manifest)
  .tarball(tarballData)
  .fetch();

// 下载
const { data, fileName } = await NpmClient.download('lodash', { registry })
  .version('4.17.21')
  .fetch();

await Deno.writeFile(`./downloads/${fileName}`, new Uint8Array(data));
```

### 11.3 Bun 环境

```typescript
import { NpmClient } from '@opendesign/npm';

const registry = 'https://registry.npmjs.org';
const token = Bun.env.NPM_TOKEN;

// 发布
const tarballData = await Bun.file('./dist/mypkg-1.0.0.tgz').arrayBuffer();
const manifest = await Bun.file('./package.json').json();

await NpmClient.publish({ registry, token })
  .manifest(manifest)
  .tarball(tarballData)
  .fetch();

// 下载
const { data, fileName } = await NpmClient.download('lodash', { registry })
  .version('4.17.21')
  .fetch();

await Bun.write(`./downloads/${fileName}`, data);
```

***

## 十二、功能总览

| 功能 | 方法 | 链式 API | 认证 |
|---|---|---|---|
| 搜索包 | `list().search()` | ✅ | ❌ |
| 获取包列表 | `list()` | ✅ | ❌ |
| 获取版本列表 | `versions()` | ✅ | ❌ |
| 获取包元数据 | `meta()` | ✅ | ❌ |
| 发布包 | `publish()` | ✅ | ✅ token |
| 下载包 | `download()` | ✅ | ❌ |
| 删除包 | `remove()` | ✅ | ✅ token |
| 删除版本 | `remove().version()` | ✅ | ✅ token |

***

## 十三、设计决策汇总

| 项目 | 决策 |
|---|---|
| 跨运行时策略 | 返回 `ArrayBuffer` 而非操作文件系统，实现真正的平台无关 |
| HTTP 客户端 | 原生 `fetch` API，零第三方依赖 |
| Builder 模式 | 链式调用收集参数，`fetch()` 执行请求 |
| 适配器模式 | `RegistryAdapter` 接口抽象网络请求，`Factory` 自动分发 |
| tarball 格式 | 支持 `ArrayBuffer \| Uint8Array \| string (base64)` |
| 默认 registry | `https://registry.npmjs.org` |

***

## 十四、后续扩展

| 优先级 | 特性 | 说明 |
|---|---|---|
| P1 | Nexus Repository 适配器 | 支持企业级 Nexus 私服 |
| P1 | JFrog Artifactory 适配器 | 支持企业级 Artifactory 私服 |
| P2 | 请求缓存机制 | 基于 etag/last-modified 的协商缓存 |
| P2 | 请求重试机制 | 自动重试失败请求 |
| P3 | 速率限制处理 | 自动处理 429 Too Many Requests |
