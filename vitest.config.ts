import { defineConfig } from 'vitest/config';
import path from 'path';

// vitest 配置(feat-content-state-machine, 阶段5 A 路径)
// - node 环境:被测对象是 src/lib 纯函数(HMAC token/状态机/鉴权/评分),无需 jsdom
// - alias '@' 对齐 tsconfig paths
// - singleFork:测试总量小,单 fork 顺序跑更稳定(并行 fork 在受限沙箱/CI 小机型会崩)
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // 测试总量小，顺序跑更稳定（并行 fork 在受限沙箱/CI 小机型会崩）。
    // 注：Vitest 4 控制台对 poolOptions 有 deprecation 提示，但该形式当前仍生效。
    fileParallelism: false,
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
