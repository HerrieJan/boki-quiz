# データベース設計標準

最終更新: 2026-07-09
ステータス: Draft

> 命名・共通規約。実スキーマ（正本）は `../../20_architecture/backend/02_DataModel.md`。

## 1. 命名規約
- テーブル: `snake_case`・複数形（`questions`, `journal_lines`）。
- カラム: `snake_case`。真偽値は `is_*`（`is_correct`）。
- 外部キー: `<単数>_id`（`question_id`, `account_id`）。
- enum 型: `snake_case` 単数（`question_type`）、値も `snake_case`（`grade_3`）。
- ビュー: 用途が分かる名前（`latest_attempts`, `question_choices_public`）。

## 2. 共通カラム
- 主キー: `id uuid default gen_random_uuid()`（`profiles` のみ `auth.users` を参照）。
- 監査列: `created_at timestamptz not null default now()`、更新のあるテーブルは `updated_at` も。
- 金額: `numeric(14,0)`（円・非負整数）。`check (amount > 0)` 等の制約を付ける。

## 3. リレーション / 削除方針
- 子データは `on delete cascade`（`journal_lines` など）。
- 参照のみのマスタは `on delete set null`（`questions.topic_id`）。

## 4. マイグレーション / seed 運用
- Supabase migrations（SQL）で前方適用。本番未稼働のため破壊的変更は一括で可。
- seed でマスタ（勘定科目・分野）とサンプル問題を投入。

## 5. インデックス方針
- 絞り込み・並び替えに使う複合列にインデックス（`(status, grade, topic_id)` 等）。
- 詳細は 02_DataModel §6。

## 6. セキュリティ
- 全テーブル RLS 有効。正解データは露出させず採点は RPC。詳細は `../security/02_RLSPolicy.md`。
