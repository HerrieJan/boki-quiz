# backend spec — 回答提出・採点

最終更新: 2026-07-09
ステータス: Draft

> 採点はサーバー側 RPC（`SECURITY DEFINER`）で行い、正解を露出させない。
> スキーマ正本: [`00_docs/.../backend/02_DataModel.md`](../../../../../../00_docs/20_tech/20_architecture/backend/02_DataModel.md)。

## 1. メタ情報
| 項目 | 値 |
|------|-----|
| エントリ | RPC `grade_and_record(p_question_id uuid, p_answer jsonb, p_duration_ms int)` |
| 対象 | 読取: questions/journal_lines/question_choices/calc_answers、書込: attempts |
| 認証 | Supabase Auth（`auth.uid()`） |

## 2. API（RPC）

### Request（supabase-js）
```ts
const { data, error } = await supabase.rpc('grade_and_record', {
  p_question_id: questionId,
  p_answer: submittedAnswer,   // §data-model の jsonb 形
  p_duration_ms: elapsedMs,
});
```

### Response
```jsonc
{ "is_correct": true, "score": 1,
  "explanation": "...", "correct_answer": { /* 提出後に開示 */ } }
```

### エラー
| 条件 | 挙動 |
|------|------|
| 未認証 | RPC 実行不可（`auth.uid()` null）→ 401 相当 |
| 問題が存在しない / 非公開 | `raise exception`（400 相当） |
| answer の形式不正 | 検証で弾く（下記） |

## 3. データアクセス / 採点ロジック
- `questions.type` で分岐（journal / choice / calc）。
- **仕訳**: 借方・貸方それぞれ `(account_id, amount)` の**多重集合が完全一致**（順不同）。複合仕訳対応。
- **選択**: `is_correct=true` の選択肢集合と `choiceIds` が一致。
- **計算**: `abs(value - expected_value) <= tolerance`。
- レベルA（完全一致）で `score ∈ {0,1}`。部分点は `score` 列で将来拡張（ISS-C）。

## 4. バリデーション
- `p_answer.type` が `questions.type` と一致すること。
- 仕訳: 各行 `side/accountId/amount` 必須、`amount > 0` の整数。
- **貸借一致（借方合計=貸方合計）はクライアントで事前検証し警告**（ISS-D）。サーバーは不一致でも不正解として記録。

## 5. エラーハンドリング
- 例外は一般メッセージのみ返す（内部情報を含めない）。

## 6. セキュリティ（認証・認可）
- `journal_lines` / `calc_answers` と `question_choices.is_correct` は RLS で**ユーザー非公開**。
- `attempts` は直接 insert 不可（RPC のみ）、select は自分の行。
- RPC は `SECURITY DEFINER` + `set search_path = public`。公開問題のみ採点対象。

## 7. テスト戦略
- RPC 単体（pgTAP or Supabase test）: 完全一致 / 順不同 / 複合仕訳 / 金額違い / 科目違い / 選択 / 計算許容誤差。
- クライアント `domain/scoring.ts` は Vitest で同ケースを網羅（frontend spec 参照）。

---
## 変更履歴
| 日付 | 変更内容 |
|------|---------|
| 2026-07-09 | 採点RPC設計・RLS・検証・テスト方針を記述 |
