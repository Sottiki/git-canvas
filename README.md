# 🎨 GitCanvas

Paint your Git history - Visualize GitHub branches and commits beautifully

## 概要
GitCanvas は GitHubのブランチとコミット履歴を可視化するWebアプリケーションです。  
※ このプロジェクトは TypeScriptの開発の学習を目的として作成しています。

### 主な機能 (予定)

- ブランチ構造の視覚化
- コミットタイムラインの表示
- リポジトリ統計情報
- インタラクティブな UI

## 技術スタック

### Frontend
- **React**
- **TypeScript**
- **Vite**

### Backend
- **Express**
- **TypeScript**
- **Node.js**

### 開発ツール
- **pnpm** (monorepo管理)
- **Biome** (Linter & Formatter)

## プロジェクト構成
```
git-canvas/
├── packages/
│   ├── frontend/        # React + Vite
│   ├── backend/         # Express API
│   └── shared/          # 共通の型定義
├── biome.json           # Linter設定
├── pnpm-workspace.yaml  # Workspace設定
└── package.json
```

## セットアップ
### インストール
```bash
# リポジトリをクローン
git clone https://github.com/Sottiki/git-canvas.git
cd git-canvas

# 依存関係をインストール
pnpm install
```

## 開発コマンド

### Backend
```bash
# 開発サーバー起動
pnpm dev:backend

# ビルド
pnpm --filter @git-canvas/backend build

# 本番起動
pnpm --filter @git-canvas/backend start
```

**Backend API:**
- Health Check: http://localhost:3000/api/health

### Frontend
```bash
# 開発サーバー起動
pnpm dev:frontend

# ビルド
pnpm --filter @git-canvas/frontend build

# プレビュー
pnpm --filter @git-canvas/frontend preview
```

**Frontend URL:**
- Development: http://localhost:5173

### Linting & Formatting
```bash
# Lint チェック
pnpm lint

# 自動修正
pnpm lint:fix

# フォーマット
pnpm format
```

## テスト(未実装)
```bash
# テスト実行 (未実装)
pnpm test

# カバレッジ (未実装)
pnpm test:coverage
```

## ロードマップ

### Phase 1: 基盤構築 ✅
- [x] Monorepo セットアップ
- [x] Backend API (Express + TypeScript)
- [x] Frontend (React + Vite)
- [x] Linter/Formatter (Biome)

### Phase 2: Core 機能 (進行中)
- [ ] GitHub API 連携
- [ ] リポジトリ情報取得
- [ ] ブランチ一覧表示
- [ ] コミットタイムライン

### Phase 3: 可視化
- [ ] ブランチ構造のグラフ表示
- [ ] コミット詳細表示
- [ ] インタラクティブな UI

### Phase 4: デプロイ
- [ ] GitHub Pages (Frontend)
- [ ] Render / Vercel (Backend)


## Author

**Sottiki**
- GitHub: [@Sottiki](https://github.com/Sottiki)
- Repository: [git-canvas](https://github.com/Sottiki/git-canvas)
