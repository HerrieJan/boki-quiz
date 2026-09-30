# Epic 索引 — INI-001-mvp

最終更新: 2026-07-09
ステータス: Draft

> 要件・受け入れ基準の一次ソース。ビジョンは `01_vision/`、詳細設計は `03_specs/`。

## UseCase 一覧

| UC ID | 名前 | 主なシナリオ（Command/Query） |
|-------|------|------------------------------|
| [UC-001](./UC-001-quiz/README.md) | 問題演習 | Q1 問題取得 / C1 回答提出・採点 |
| [UC-002](./UC-002-review/README.md) | 錯題復習 | Q1 錯題一覧 / C1 再挑戦記録 |
| [UC-003](./UC-003-progress/README.md) | 学習履歴・ダッシュボード | Q1 正答率集計 |
| [UC-004](./UC-004-admin/README.md) | 題库管理（管理者） | C1 問題作成 / C2 勘定科目管理 |

## 命名規約
- UC: `UC-00N-<slug>`
- Feature/シナリオ: `Commands/` `Queries/` 配下に `F-00N_<名前>.md`
- 詳細設計側の User Story ID: `US-00N-{C|Q}n-<slug>`

---
## 変更履歴
| 日付 | 変更内容 |
|------|---------|
| 2026-07-09 | 初版作成（skeleton） |
