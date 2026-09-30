-- =============================================================================
-- boki-quiz スキーマ定義（enum / テーブル / インデックス / updated_at トリガ）
-- 正本: 00_docs/20_tech/20_architecture/backend/02_DataModel.md
-- =============================================================================

-- --- 列挙型 -------------------------------------------------------------------
create type user_role        as enum ('user', 'admin');
create type exam_grade       as enum ('grade_3', 'grade_2', 'grade_1');            -- 3級/2級/1級
create type question_type    as enum ('journal', 'choice', 'calc');               -- 仕訳/選択/計算
create type question_status  as enum ('draft', 'published', 'archived');
create type journal_side     as enum ('debit', 'credit');                         -- 借方/貸方
create type account_category as enum ('asset', 'liability', 'equity', 'revenue', 'expense'); -- 資産/負債/純資産/収益/費用

-- --- updated_at 自動更新 -------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- --- profiles -----------------------------------------------------------------
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role         user_role not null default 'user',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- --- accounts（勘定科目マスタ）------------------------------------------------
create table accounts (
  id         uuid primary key default gen_random_uuid(),
  code       text unique,
  name       text not null,
  category   account_category not null,
  grades     exam_grade[] not null default '{}',
  sort_order int not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_accounts_updated before update on accounts
  for each row execute function set_updated_at();

-- --- topics（分野マスタ）------------------------------------------------------
create table topics (
  id         uuid primary key default gen_random_uuid(),
  grade      exam_grade not null,
  category   text not null,
  name       text not null,
  sort_order int not null default 0,
  unique (grade, category, name)
);

-- --- questions（問題：共通部）-------------------------------------------------
create table questions (
  id          uuid primary key default gen_random_uuid(),
  type        question_type not null,
  grade       exam_grade not null,
  topic_id    uuid references topics(id) on delete set null,
  difficulty  smallint not null default 1 check (difficulty between 1 and 5),
  body        text not null,
  explanation text not null default '',
  status      question_status not null default 'draft',
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_questions_updated before update on questions
  for each row execute function set_updated_at();

-- --- journal_lines（仕訳問題の正解行）-----------------------------------------
create table journal_lines (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  side        journal_side not null,
  account_id  uuid not null references accounts(id),
  amount      numeric(14,0) not null check (amount > 0),
  line_no     int not null default 0,
  unique (question_id, side, line_no)
);

-- --- question_choices（選択問題の選択肢）--------------------------------------
create table question_choices (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  label       text,
  body        text not null,
  is_correct  boolean not null default false,
  sort_order  int not null default 0
);

-- --- calc_answers（計算問題の正解：1:1）--------------------------------------
create table calc_answers (
  question_id    uuid primary key references questions(id) on delete cascade,
  expected_value numeric(14,0) not null,
  tolerance      numeric(14,0) not null default 0,
  unit           text
);

-- --- attempts（回答履歴）------------------------------------------------------
create table attempts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  question_id      uuid not null references questions(id) on delete cascade,
  is_correct       boolean not null,
  score            numeric(5,4) not null default 0,
  submitted_answer jsonb not null,
  duration_ms      int,
  created_at       timestamptz not null default now()
);

-- --- bookmarks（お気に入り）--------------------------------------------------
create table bookmarks (
  user_id     uuid references profiles(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, question_id)
);

-- --- インデックス -------------------------------------------------------------
create index idx_questions_filter               on questions (status, grade, topic_id);
create index idx_attempts_user_question_created on attempts (user_id, question_id, created_at desc);
create index idx_attempts_user_created          on attempts (user_id, created_at desc);
create index idx_journal_lines_question         on journal_lines (question_id);
create index idx_question_choices_question      on question_choices (question_id);
