# ADR-0001: フロントエンド技術スタック

- ステータス: Proposed
- 日付: 2026-07-09

## コンテキスト
簿記刷題アプリの Web フロントを、一人開発・ポートフォリオ映え・将来アプリ化を前提に選定する。

## 決定
- ビルド/言語: **Vite + React + TypeScript**
- UI: **Tailwind CSS + shadcn/ui**
- ルーティング: **React Router**
- サーバー通信: **TanStack Query**
- クライアント状態: **Zustand**
- フォーム/検証: **React Hook Form + Zod**（仕訳入力の複雑な検証に強い）
- テスト: **Vitest + React Testing Library**

## 選択肢と比較
| 項目 | 採用 | 対抗 | 理由 |
|------|------|------|------|
| ビルド | Vite | CRA | 高速・現代的 |
| 状態 | Zustand | Redux | 軽量・学習コスト低 |
| UI | shadcn/ui | MUI | カスタム性・見た目 |

## 結果（トレードオフ）
- 現代的で拡張しやすい。shadcn/ui はコピー配置方式のため自由度が高い反面、自前管理が増える。

---
（旧 docs/02-tech-stack.md から移植）
