# 仕様駆動ドキュメント構成 規約ガイド（汎用テンプレート）

> このファイルは **プロジェクト非依存の再利用テンプレート**です。新しいプロジェクトにコピーし、
> `<PROJECT>` などのプレースホルダを置き換えて使ってください。
>
> 目的: 「なぜ作るか → 何を作るか → どう作るか → 品質記録」を、番号付きの階層で一貫管理する
> 仕様駆動開発（spec-driven development）のドキュメント規約を定義する。

---

## 1. 設計思想（3行）

1. **番号プレフィックス**でトップフォルダを工程順に並べ、読む順序を強制する。
2. **階層の入れ子** `Initiative → UseCase → Scenario` で、大きな意図から実装単位まで一直線に辿れる。
3. **1シナリオ = 決まった文書セット**で、調査→設計→実装→レビューの粒度を揃える。

---

## 2. トップレベル構成

| フォルダ / ファイル | 役割 | 工程 |
|---|---|---|
| `CLAUDE.md` / `AGENTS.md`（ルート） | 開発ルール・AIエージェント指示（プロジェクトの憲法） | 全体 |
| `00_docs/` | 横断ドキュメント（ビジネス要件・技術標準・アーキ・ADR） | 参照 |
| `01_vision/` | Initiative 憲章・ビジョン | **なぜ / 何を** |
| `02_backlog/` | Epic / UseCase / Feature（要件・受け入れ基準） | **要件** |
| `03_specs/` | 詳細設計（シナリオ単位） | **どう作るか** |
| `99_reviews/` | レビュー成果物（上記構造のミラー） | 品質記録 |

> 番号は「工程の順序」を表す。`00`＝常時参照、`01→03`＝上流から下流、`99`＝最後（レビュー/記録）。

---

## 3. フォルダ階層（全体像）

```
<PROJECT>/
├─ CLAUDE.md                         # 開発ルール（AGENTS.md を併用してもよい）
├─ SPEC_DRIVEN_DOC_STRUCTURE.md      # 本ガイド
│
├─ 00_docs/
│  ├─ 10_business/
│  │  └─ requirements_specification.md      # ビジネス要件定義（正本）
│  └─ 20_tech/
│     ├─ 20_architecture/
│     │  ├─ 01_SystemOverview.md
│     │  ├─ adr/                             # 意思決定記録
│     │  │  ├─ README.md                     # ADR 索引 + テンプレート
│     │  │  └─ ADR-0001_<Title>.md
│     │  ├─ backend/01_ArchitectureDesign.md
│     │  └─ frontend/01_ArchitectureDesign.md
│     └─ 99_standard/                        # 実装で守る標準（番号付き）
│        ├─ backend/   (00_Overview.md, 01_..., 02_...)
│        ├─ frontend/  (00_Overview.md, 01_...)
│        └─ security/  (00_Overview.md, 01_...)
│
├─ 01_vision/
│  └─ initiatives/
│     └─ INI-001-<slug>/
│        ├─ charter.md                       # イニシアチブ憲章
│        └─ usecases/                        # （任意）親 UC 定義
│
├─ 02_backlog/
│  └─ 01_epics/
│     └─ INI-001-<slug>/
│        ├─ README.md                        # Epic/UC 索引
│        └─ UC-001-<slug>/
│           ├─ README.md                     # UC の要件・受け入れ基準
│           ├─ Commands/  F-00N_<name>.md    # 状態変更系フィーチャ
│           └─ Queries/   F-00N_<name>.md    # 照会系フィーチャ
│
├─ 03_specs/
│  ├─ _template/                             # 1シナリオ7文書の雛形（コピー元）
│  │  ├─ README.md  research.md  plan.md  data-model.md
│  │  ├─ specs/backend/spec.md
│  │  ├─ specs/frontend/spec.md
│  │  └─ tasks/task.md
│  └─ INI-001-<slug>/
│     └─ UC-001-<slug>/
│        ├─ README.md                        # UC 詳細設計のナビ
│        ├─ progress.md                      # 進捗の正本
│        ├─ issues.md                        # 未決事項の正本
│        ├─ Commands/US-001-C1-<slug>/       # ↓ 7文書（_template と同じ）
│        └─ Queries/ US-001-Q1-<slug>/
│
└─ 99_reviews/                               # （任意）01_/03_/00_ をミラーしレビュー結果を格納
```

---

## 4. 階層の意味と命名規約

### 4.1 入れ子の階層
```
Initiative(INI)  … 事業/プロダクト単位の大目標
  └ UseCase(UC)  … ユーザーの達成目標
      └ Scenario / User Story(US)  … 実装単位（Command / Query に分類）
```

### 4.2 ID 命名規約

| 対象 | 形式 | 例 |
|------|------|-----|
| Initiative | `INI-00N-<slug>` | `INI-001-mvp` |
| UseCase | `UC-00N-<slug>` | `UC-001-quiz` |
| Feature（backlog） | `F-00N_<name>.md` | `F-002_回答提出採点.md` |
| Scenario（specs） | `US-00N-{C\|Q}n-<slug>` | `US-001-C1-submit-answer` |
| ADR | `ADR-000N_<Title>.md` | `ADR-0002_Backend-BaaS.md` |
| 標準文書 | `NN_<Name>.md`（番号付き） | `01_CodingStandards.md` |

- **C = Command**（状態変更・作成・更新・削除・廃止）
- **Q = Query**（照会・表示・取得）
- `slug` は英小文字ハイフン区切り（フォルダ）、日本語名はファイル名で許容。

---

## 5. 1シナリオ = 7文書（`03_specs` の中核）

各シナリオフォルダは `_template/` をコピーして作る。読む順序＝作る順序。

| 順 | 文書 | 目的 |
|----|------|------|
| 1 | `README.md` | メタ情報・ナビ（関連リンク） |
| 2 | `research.md` | 既存実装・DB・API・画面の棚卸し、影響範囲。§8 に未解決事項 |
| 3 | `plan.md` | アーキテクチャ判断の1ページ合意（Draft→Agreed） |
| 4 | `data-model.md` | 集約・ER・状態遷移。**backend/frontend spec の唯一のソース** |
| 5 | `specs/backend/spec.md` | バックエンド詳細（API/データアクセス/検証/エラー/セキュリティ/テスト） |
| 6 | `specs/frontend/spec.md` | フロントエンド詳細（画面/状態/ドメインロジック/検証/テスト） |
| 7 | `tasks/task.md` | 実装タスク分解・進捗・Definition of Done |

さらに **UC 直下**に運用の正本を2つ置く:
- `progress.md` — 進捗（フェーズ・シナリオ別ステータス）の正本
- `issues.md` — 未解決事項・設計判断の正本（`research.md §8` から集約）

---

## 6. 共通の文書ルール

- 各文書の冒頭に **`最終更新` / `ステータス`**、末尾に **`変更履歴` 表**を置く。
- ステータス語彙: `Draft` → `Agreed`（plan）/ `Proposed`→`Accepted`→`Superseded`（ADR）/ `Done`（tasks・UC）。
- 未決は各所に散らさず **`issues.md` に一元化**し、ID（`ISS-xxx`）で参照する。
- `data-model.md` を単一の真実とし、spec 側はスキーマを重複記述せず参照する。
- リンクは相対パスで貼り、階層を跨ぐナビを README に集約する。

---

## 7. スケール調整（プロジェクト規模に合わせる）

このフルセットはチーム/大規模向け。小さいプロジェクトでは段階的に簡略化してよい。

| 規模 | 推奨 |
|------|------|
| 個人/小規模 | `_template/` は残す。UC は必要な分だけ実体化。`99_reviews/` は省略可 |
| 中規模 | 上記 + backend/frontend 標準を埋める。ADR を運用 |
| 大規模/チーム | フルセット。`99_reviews/` でレビュー結果もミラー管理 |

- 迷ったら「フォルダ階層＋見出しテンプレートだけ先に作り、中身は後で埋める（skeleton）」でよい。

---

## 8. 新規プロジェクトへの適用手順

1. 本ファイルと `03_specs/_template/` を新プロジェクトにコピーする。
2. ルートに `CLAUDE.md`（開発ルール）を作る。
3. `01_vision/initiatives/INI-001-<slug>/charter.md` にビジョン・成功基準・UC 一覧を書く。
4. `00_docs/10_business/requirements_specification.md` に要件（MoSCoW）を書く。
5. `02_backlog/01_epics/INI-001-<slug>/` に UC と Feature（Commands/Queries）を起こす。
6. `03_specs/INI-001-<slug>/UC-00N-<slug>/` を作り、`README/progress/issues` を置く。
7. 実装したいシナリオごとに `_template/` をコピーして 7 文書を起こす。
8. 主要な技術判断は `00_docs/20_tech/20_architecture/adr/` に ADR として残す。

---

## 変更履歴
| 日付 | 変更内容 |
|------|---------|
| 2026-07-09 | 初版作成（wqp-prt の構成規約を汎用テンプレート化） |
