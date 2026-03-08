# InterviewAI

AI を活用した面接管理 SaaS プラットフォーム。リアルタイム音声面接・自動文字起こし・AI 評価を一つのプラットフォームで提供します。

## 主な機能

- **AI リアルタイム面接** — OpenAI Realtime API による音声対話型の面接を実施
- **自動文字起こし・録画** — 面接の会話を自動で記録・保存
- **AI 評価** — 質問ごとの評価基準に基づいた自動スコアリング
- **候補者管理** — プロフィール・学歴・職歴・スキルの一元管理
- **質問セット管理** — 再利用可能な質問テンプレートと評価基準の設定
- **招待フロー** — メール招待リンクによる候補者のオンボーディング
- **履歴書 AI 解析** — PDF/Word からのプロフィール自動入力
- **PDF 出力** — 評価レポートの PDF エクスポート
- **マルチテナント** — 組織単位のデータ分離（RLS）

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router, Turbopack) |
| 言語 | TypeScript 5.9 |
| DB / 認証 | Supabase (PostgreSQL + Auth + Storage) |
| AI | OpenAI GPT-4o / Realtime API |
| メール | Resend |
| スタイリング | Tailwind CSS 4 |
| パッケージマネージャ | pnpm |

## プロジェクト構成

```
src/
├── app/
│   ├── dashboard/          # 管理者画面（候補者・面接・質問セット・設定）
│   ├── portal/             # 候補者ポータル（面接・プロフィール）
│   ├── interview/          # 面接ルーム（リアルタイム音声）
│   └── api/                # API Routes
├── components/
│   ├── dashboard/          # 管理者 UI コンポーネント
│   ├── interview/          # 面接 UI コンポーネント
│   └── ui/                 # 共通 UI コンポーネント
├── hooks/                  # カスタムフック
├── lib/
│   ├── supabase/           # Supabase クライアント・マイグレーション
│   ├── openai/             # OpenAI 連携
│   ├── email/              # メールテンプレート
│   └── pdf/                # PDF 解析
└── types/                  # TypeScript 型定義
```

## セットアップ

### 前提条件

- Node.js 20+
- pnpm 10+
- Supabase プロジェクト
- OpenAI API キー
- Resend API キー

### インストール

```bash
pnpm install
```

### 環境変数

`.env.local` を作成:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=InterviewAI <noreply@yourdomain.com>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### DB マイグレーション

Supabase の SQL Editor で `src/lib/supabase/migrations/` 内のファイルを順番に実行:

1. `001_initial_schema.sql`
2. `002_add_candidate_fields.sql`
3. `003_add_portal_tables.sql`
4. `004_add_invitations_and_guidelines.sql`

### 開発サーバー

```bash
pnpm dev
```

http://localhost:3000 でアクセスできます。

## ユーザーフロー

### 管理者

1. サインアップ → 組織作成
2. 質問セット作成（質問・評価基準を設定）
3. 候補者を招待（メール or 手動登録）
4. 面接を作成・スケジュール
5. AI 評価結果を確認・面接官補正

### 候補者

1. 招待メールからアカウント作成
2. プロフィール入力
3. ロビーで面接ガイドラインを確認
4. AI リアルタイム面接を実施
5. 結果は管理者から連絡

## ライセンス

Private
