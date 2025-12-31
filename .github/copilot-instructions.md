# GitCanvas の GitHub Copilot 指示書

## プロジェクト概要
GitCanvas は GitHub のブランチとコミットを可視化する Web アプリケーションです。
実用的な開発ツールであり、ポートフォリオプロジェクトでもあります。

## 技術スタック
- **Frontend**: React 19.x, TypeScript 5.9.x, Vite 7.x
- **Backend**: Express 5.x, TypeScript 5.7.x, Node.js 24.x
- **Shared**: 共通型定義用の TypeScript
- **ツール**: pnpm 10.x, Biome 2.x, Vitest 2.x
- **Monorepo**: pnpm workspaces

## コーディング規約

### TypeScript
- **常にアロー関数**を使用 (function 宣言は使わない)
- 関数の引数と戻り値には**明示的な型**を指定
- 型のみのインポートには `import type` を使用
- `any` ではなく `unknown` を優先
- ターゲット: **ES2024**
- 防御的プログラミング (null チェック, エラーハンドリング)

### コードスタイル
- **フォーマッター**: Biome
- **インデント**: 2 スペース
- **クォート**: シングルクォート
- **セミコロン**: 必須
- **行の長さ**: 100 文字

### React
- **関数コンポーネント**のみ使用
- 戻り値の型アノテーションは省略 (型推論に任せる)
- コンポーネントのファイル構成:
```
  ComponentName/
  ├── __tests__/
  │   └── ComponentName.test.tsx
  ├── ComponentName.tsx
  ├── ComponentSubA.tsx
  ├── ComponentSubB.tsx
  └── index.ts
```

### ファイル構成
- Backend: `packages/backend/src/`
- Frontend: `packages/frontend/src/`
- 共通の型: `packages/shared/src/types/`

## 開発原則

### SOLID 原則
設計時は常に SOLID 原則を考慮する:
- **SRP (単一責任の原則)**: コンポーネント/関数は1つの責任のみ
- **OCP (開放閉鎖の原則)**: 拡張に開いて、修正に閉じている
- **LSP (リスコフの置換原則)**: サブタイプは置換可能
- **ISP (インターフェース分離の原則)**: インターフェースを分離
- **DIP (依存性逆転の原則)**: 抽象に依存する

### Git ワークフロー
- **機能追加**: `feature/description`
- **バグ修正**: `fix/description`
- **テスト**: `test/description`
- **雑務**: `chore/description`

### テスト
- すべての新機能にテストを書く
- テストファイル名: `*.test.ts` または `*.test.tsx`
- 配置場所: 実装の隣の `__tests__/` ディレクトリ
- Backend: Vitest (node 環境)
- Frontend: Vitest (jsdom) + React Testing Library
- カバレッジ目標: 90% 以上

## コード生成ガイドライン

### コンポーネント作成時:
1. 適切な構造でコンポーネントディレクトリを作成
2. 関心を分離 (Loading, Error, Success 状態)
3. 実装と並行してテストを書く
4. `@git-canvas/shared` の共通型を使用

### API 作成時:
1. `packages/shared/src/types/` に型を定義
2. Backend ハンドラーを実装
3. Backend テストを書く (100% カバレッジを目指す)
4. Frontend の hook/コンポーネントを作成
5. Frontend テストを書く

### コード修正時:
1. 変更内容と理由を説明
2. SOLID 原則を考慮
3. テストを更新
4. `pnpm lint` と `pnpm type-check` を実行

## コミュニケーションスタイル
- 詳細な技術的説明を提供
- すべての技術で最新の安定版を使用
- 公式ドキュメントを参照
- アーキテクチャ判断の「理由」を説明

## 避けるべきこと
- 古いパターン (例: function 宣言)
- `any` 型の使用
- チェックなしの非 null アサーション
- 単一コンポーネントでの関心の混在
- 複数の無関係な変更を含む大きなコミット
- 説明なしの依存関係追加

## その他・人格
日本語を使用すること
丁寧で礼儀正しい口調を保つこと
