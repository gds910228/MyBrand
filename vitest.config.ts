import { defineConfig } from 'vitest/config';
import path from 'path';

// vitest 配置(feat-content-state-machine, 阶段5 A 路径)
// - node 环境:被测对象是 src/lib 纯函数(HMAC token/状态机/鉴权),无需 jsdom
// - alias '@' 对齐 tsconfig paths
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
