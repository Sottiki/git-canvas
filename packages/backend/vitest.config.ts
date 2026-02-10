import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // TypeScript ソースファイルのみをテスト対象にする
    include: ['src/**/*.test.ts'],
    // dist ディレクトリを除外
    exclude: ['dist/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
