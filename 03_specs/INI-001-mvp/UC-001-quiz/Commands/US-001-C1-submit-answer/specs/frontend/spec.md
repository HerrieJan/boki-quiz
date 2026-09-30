# frontend spec — 仕訳自動採点

最終更新: 2026-07-09
ステータス: Draft

> 本アプリの核心ロジック。データモデルは ../../data-model.md を唯一のソースとする。

## 1. 画面・コンポーネント
- 演習画面: 問題表示 → 仕訳入力フォーム（借方/貸方 複数行）→ 提出 → 採点結果 → 解説。
- 入力は React Hook Form + Zod。

## 2. ドメインロジック（採点）

### 2.1 データ表現
```typescript
type JournalLine = {
  side: 'debit' | 'credit'; // 借方 / 貸方
  accountId: string;
  amount: number;
};
type JournalAnswer = JournalLine[];
```

### 2.2 採点アルゴリズム（順不同マッチング）
借方・貸方それぞれで「(勘定科目, 金額) の多重集合」の一致を見る。
```typescript
function gradeJournal(correct: JournalAnswer, submitted: JournalAnswer): Result {
  const key = (l: JournalLine) => `${l.side}:${l.accountId}:${l.amount}`;
  const correctBag = toCountMap(correct.map(key));
  const submittedBag = toCountMap(submitted.map(key));
  const isPerfect = mapsEqual(correctBag, submittedBag);
  const matched = countMatched(correctBag, submittedBag);
  const score = matched / correct.length; // 部分点
  return { isPerfect, score };
}
```

### 2.3 採点レベル（段階）
| レベル | 内容 |
|--------|------|
| A 完全一致のみ | 集合完全一致で正解。まずこれ |
| B 部分点 | 合った行数に応じて加点 |
| C エラー種別提示 | 貸借不一致/科目違い/金額違い を明示 |

## 3. バリデーション（採点前段）
- 各行に科目・金額が入力済みか。
- 借方合計 = 貸方合計（ISS-D: 警告 or 不正解）。
- 金額は正の整数。

## 4. 他形式への一般化
- 選択問題: `answer_entries.is_correct` と比較。
- 計算問題: 正解値と一致（許容誤差の要否は要検討）。
- 共通の `Result` 型を返す。

## 5. テスト戦略
`domain/scoring.ts` を Vitest で網羅（完全一致/順不同/複合仕訳/金額違い/科目違い/貸借不一致）。

---
## 変更履歴
| 日付 | 変更内容 |
|------|---------|
| 2026-07-09 | 初版作成（旧 docs/05-scoring-design.md から移植） |
