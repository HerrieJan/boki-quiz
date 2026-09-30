# システム概要（System Overview）

最終更新: 2026-07-09
ステータス: Draft（構想段階）

> システム全体のアーキテクチャ俯瞰。詳細はレイヤ別設計（`backend/` `frontend/`）と ADR を参照。

---

## 1. 全体構成

```
[ブラウザ / 将来はアプリ(Capacitor)]
        │
   React + TypeScript (Vite)
   ├─ UI 層          (components / pages)
   ├─ ドメイン層      (domain/: 採点など純粋関数)
   ├─ データアクセス層 (api/: Supabase or モック)
        │
   [Supabase] Auth + PostgreSQL + RLS
```

## 2. レイヤー方針

責務を分離し、将来のアプリ化・バックエンド差し替えを容易にする。

| 層 | 責務 | 依存 |
|----|------|------|
| UI | 見た目 | ドメイン層・データアクセス層 |
| ドメイン | 採点などのビジネスロジック（純粋関数） | 何にも依存しない（テスト容易） |
| データアクセス | Supabase 呼び出しを閉じ込める | Supabase / モック |

**核心**: 採点ロジックを `domain/scoring.ts` の純粋関数に切り出す。

## 3. ディレクトリ構成（案）

```
src/
├─ routes/                 ルーティング
├─ pages/{user,admin}/     画面
├─ components/             汎用UI
├─ features/{quiz,review,admin}/
├─ domain/                 ★ドメインロジック（scoring.ts, types.ts）
├─ api/                    データアクセス（Supabase/モック切替）
├─ store/                  Zustand
└─ lib/                    supabaseクライアント等
```

## 4. 認証・権限

- 認証は Supabase Auth に委譲。
- ロールは `profiles.role`（user/admin）。
- 権限の要は RLS。フロント制御は補助に過ぎない。詳細は `99_standard/security/`。

## 5. 主要フロー

- 一般ユーザー: ログイン → 級/分野選択 → 演習（表示→入力→採点→解説）→ 錯題 → ダッシュボード
- 管理者: ログイン → 勘定科目管理 / 問題作成（正解行登録）→ プレビュー → 公開

---

## 変更履歴
| 日付 | 変更内容 |
|------|---------|
| 2026-07-09 | 初版作成（旧 docs/03-architecture.md から移植） |
