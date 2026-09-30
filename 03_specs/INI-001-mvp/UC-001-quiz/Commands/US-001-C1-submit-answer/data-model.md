# data-model — 回答提出・採点（UC-001 スライス）

最終更新: 2026-07-09
ステータス: Draft

> 本シナリオが扱うエンティティ。**スキーマの正本は
> [`00_docs/20_tech/20_architecture/backend/02_DataModel.md`](../../../../../../00_docs/20_tech/20_architecture/backend/02_DataModel.md)**。
> ここでは採点に関わる部分のみを抜粋・補足する。

## 1. 対象エンティティ

| エンティティ | 役割（本シナリオ） |
|-------------|-------------------|
| `questions` | 出題対象（`type` で採点方式が決まる） |
| `journal_lines` | 仕訳問題の正解行（借方/貸方 × 勘定科目 × 金額） |
| `question_choices` | 選択問題の選択肢（`is_correct`） |
| `calc_answers` | 計算問題の正解値（許容誤差付き） |
| `accounts` | 仕訳の勘定科目マスタ（入力候補） |
| `attempts` | 提出結果の記録（採点RPCが insert） |

> ISS-B の決定により、正解は**形式別テーブルに正規化**（旧 `answer_entries` 単一テーブル案は破棄）。

## 2. 採点対象データの流れ

```
[出題] questions(published) + accounts + question_choices_public(is_correct除外)
   │  ← ユーザーには正解を渡さない
[入力] ユーザーが仕訳/選択/計算を入力（submitted_answer: jsonb）
[採点] RPC grade_and_record(question_id, answer)  ← SECURITY DEFINER
   │    journal_lines / question_choices / calc_answers と照合
[記録] attempts に insert（is_correct, score, submitted_answer）
[応答] { is_correct, score, explanation, correct_answer } を返却
```

## 3. submitted_answer（jsonb）の形

```jsonc
// 仕訳
{ "type": "journal",
  "lines": [ { "side": "debit",  "accountId": "...", "amount": 10000 },
             { "side": "credit", "accountId": "...", "amount": 10000 } ] }
// 選択
{ "type": "choice", "choiceIds": ["..."] }
// 計算
{ "type": "calc", "value": 12345 }
```

## 4. RLS 影響
- 正解テーブル（`journal_lines` / `calc_answers`）と `question_choices.is_correct` はユーザー非公開。
- `attempts` はユーザー直接 insert 不可（RPC 経由のみ）、select は自分の行のみ。
- 詳細は正本 §7。

---
## 変更履歴
| 日付 | 変更内容 |
|------|---------|
| 2026-07-09 | 正規化設計へ整合。スキーマ正本を 02_DataModel.md に集約し参照化 |
