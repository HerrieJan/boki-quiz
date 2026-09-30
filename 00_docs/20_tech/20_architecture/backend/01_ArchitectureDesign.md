# バックエンド アーキテクチャ設計（Supabase）

最終更新: 2026-07-09
ステータス: Draft

> Supabase を採用（ADR-0002）。スキーマの正本は [02_DataModel.md](./02_DataModel.md)、RLS 方針は `../../99_standard/security/02_RLSPolicy.md`。

## 1. 構成要素

| 要素 | 用途 |
|------|------|
| Supabase Auth | 認証（メール+パスワード、将来 OAuth） |
| PostgreSQL | 全データ。RLS で権限分離 |
| PostgREST | テーブル/ビューの自動 REST/SDK アクセス |
| Database Functions (RPC) | **採点**（`grade_and_record`）など、正解を露出させないサーバー処理 |
| Storage | （将来）問題画像など |

## 2. アクセス経路

```
React (api層) ──supabase-js──> PostgREST ──RLS──> tables / views
                        └────> RPC (SECURITY DEFINER) ──> 採点 + attempts 記録
```

- 通常の読み取り（問題一覧・履歴・統計）は RLS 付きテーブル/ビューへ直接。
- 正解を伴う操作（採点・回答記録）は RPC 経由に限定。

## 3. スキーマ管理
- Supabase migrations（SQL）で管理。本番未稼働のため `supabase db reset` で再構築可。
- 順序・シードは [02_DataModel.md §9](./02_DataModel.md) を参照。

## 4. RLS（権限）方針
- 権限判定は必ず DB 側。詳細は [02_DataModel.md §7](./02_DataModel.md) と RLS 標準。
- 正解データ（`journal_lines` / `calc_answers` / `question_choices.is_correct`）はユーザーに露出しない。

## 5. 採点（RPC）
- `grade_and_record(question_id, answer, duration_ms)` が採点し `attempts` を記録、提出後に正解・解説を返す。
- クライアント `domain/scoring.ts` は同ロジックの即時フィードバック用。RPC を正とする。

---
## 変更履歴
| 日付 | 変更内容 |
|------|---------|
| 2026-07-09 | Supabase 構成・アクセス経路・採点RPC を記述 |
