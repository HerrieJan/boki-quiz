# supabase — ローカル DB とマイグレーション

boki-quiz の PostgreSQL スキーマ・RLS・採点 RPC・初期データ一式。
設計の正本は [`../00_docs/20_tech/20_architecture/backend/02_DataModel.md`](../00_docs/20_tech/20_architecture/backend/02_DataModel.md)。

## 前提
- Docker Desktop（起動しておく）
- Supabase CLI（例: `npm i -D supabase`、または `scoop/brew install supabase`）

## セットアップ手順
```bash
# 1. 初回のみ: config.toml を生成（この supabase/ 配下に作成される）
supabase init

# 2. ローカルスタックを起動（Postgres / Auth / Studio 等）
supabase start

# 3. マイグレーション + seed を適用（作り直しはいつでもこれ）
supabase db reset
```

起動後の主なURL:
| 用途 | URL |
|------|-----|
| Studio（GUI） | http://localhost:54323 |
| API（PostgREST/Auth） | http://localhost:54321 |
| DB 直接接続 | postgresql://postgres:postgres@localhost:54322/postgres |

## ファイル構成
```
supabase/
├─ migrations/
│  ├─ 20260709120000_schema.sql     enum・テーブル・index・updated_atトリガ
│  ├─ 20260709120001_functions.sql  is_admin・signupトリガ・採点関数・grade_and_record
│  ├─ 20260709120002_views.sql      選択肢公開ビュー・錯題・正答率ビュー
│  └─ 20260709120003_rls.sql        RLS有効化・ポリシー・grant
└─ seed.sql                         勘定科目・分野・サンプル問題4問
```
> マイグレーションはファイル名の昇順で適用される（schema → functions → views → rls）。

## 動作確認

### ユーザー作成と管理者昇格
1. アプリ or Studio の Authentication からユーザーを作成（サインアップ）。
   → トリガ `handle_new_user` が `profiles` 行を自動作成（role=user）。
2. 管理者にするには Studio の SQL エディタで:
```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

### 採点ロジックの単体確認（Studio SQL エディタ = postgres 権限）
`grade_and_record` は `auth.uid()` を要するためログインユーザー経由で呼ぶ。
採点判定ロジックだけなら内部ヘルパを直接検証できる:
```sql
-- Q1（現金仕入）に正しい仕訳 → true
select is_journal_correct(
  '00000000-0000-4000-8000-0000000000c1',
  '{"lines":[
     {"side":"debit","accountId":"00000000-0000-4000-8000-000000000a05","amount":10000},
     {"side":"credit","accountId":"00000000-0000-4000-8000-000000000a01","amount":10000}
   ]}'::jsonb
);  -- 借方貸方を入れ替えても順不同なので true、金額違いなら false

-- 選択問題
select is_choice_correct(
  '00000000-0000-4000-8000-0000000000c3',
  '{"choiceIds":["<question_choices_public で取得した借方の id>"]}'::jsonb
);

-- 計算問題
select is_calc_correct(
  '00000000-0000-4000-8000-0000000000c4',
  '{"value":40000}'::jsonb
);  -- true
```

### アプリからの採点呼び出し（ログイン後）
```ts
const { data } = await supabase.rpc('grade_and_record', {
  p_question_id: questionId,
  p_answer: { type: 'journal', lines: [...] },
  p_duration_ms: elapsedMs,
});
// data = { is_correct, score, explanation, correct_answer }
```

## クラウドへ反映（将来）
```bash
supabase link --project-ref <your-project-ref>
supabase db push        # ローカルの migrations をクラウドへ適用
```
