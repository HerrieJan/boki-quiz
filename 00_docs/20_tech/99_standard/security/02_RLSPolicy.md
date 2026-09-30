# RLS（行レベルセキュリティ）ポリシー

> ステータス: skeleton。権限分離の核心。テーブルごとに定義する。

## 1. 原則
- 権限判定は必ず DB 側（RLS）で行う。フロント表示制御は補助。

## 2. テーブル別ポリシー
実スキーマは `../20_architecture/backend/02_DataModel.md §7` が正本。

| テーブル | user（一般） | admin |
|---------|-------------|-------|
| profiles | 自分の行 select/update（role 変更不可） | 全行 |
| accounts / topics | select（is_active）のみ | 全操作 |
| questions | `status='published'` の select のみ | 全操作 |
| journal_lines / calc_answers | **直接 select 不可**（正解漏洩防止） | 全操作 |
| question_choices | 公開ビュー（`is_correct` 除外）経由のみ | 全操作 |
| attempts | 自分の行 select のみ（insert は採点RPC経由） | select 可 |
| bookmarks | 自分の行のみ全操作 | — |

## 3. 正解データの保護
- 正解（仕訳行・計算値・選択肢の正誤）はユーザーに露出させない。
- 採点は `SECURITY DEFINER` の RPC `grade_and_record()` で行い、提出後に正解・解説を返す。

## 4. ロール判定
- `is_admin()`（`profiles.role='admin'` を参照する stable 関数）をポリシーで使う。
