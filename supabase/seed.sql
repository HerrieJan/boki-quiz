-- =============================================================================
-- 初期データ（seed）: 勘定科目マスタ・分野マスタ・サンプル問題
-- `supabase db reset` で自動投入される。UUID は参照のため固定値。
-- =============================================================================

-- --- 勘定科目マスタ -----------------------------------------------------------
insert into accounts (id, name, category, grades, sort_order) values
  ('00000000-0000-4000-8000-000000000a01', '現金',     'asset',     '{grade_3,grade_2,grade_1}', 10),
  ('00000000-0000-4000-8000-000000000a02', '売掛金',   'asset',     '{grade_3,grade_2,grade_1}', 20),
  ('00000000-0000-4000-8000-000000000a03', '買掛金',   'liability', '{grade_3,grade_2,grade_1}', 30),
  ('00000000-0000-4000-8000-000000000a04', '売上',     'revenue',   '{grade_3,grade_2,grade_1}', 40),
  ('00000000-0000-4000-8000-000000000a05', '仕入',     'expense',   '{grade_3,grade_2,grade_1}', 50),
  ('00000000-0000-4000-8000-000000000a06', '資本金',   'equity',    '{grade_3,grade_2,grade_1}', 60),
  ('00000000-0000-4000-8000-000000000a07', '当座預金', 'asset',     '{grade_3,grade_2,grade_1}', 70),
  ('00000000-0000-4000-8000-000000000a08', '給料',     'expense',   '{grade_3,grade_2,grade_1}', 80)
on conflict (id) do nothing;

-- --- 分野マスタ ---------------------------------------------------------------
insert into topics (id, grade, category, name, sort_order) values
  ('00000000-0000-4000-8000-0000000000b1', 'grade_3', '商業簿記', '現金預金', 10),
  ('00000000-0000-4000-8000-0000000000b2', 'grade_3', '商業簿記', '仕入・売上', 20)
on conflict (id) do nothing;

-- =============================================================================
-- サンプル問題
-- =============================================================================

-- --- Q1: 仕訳（現金仕入）------------------------------------------------------
insert into questions (id, type, grade, topic_id, difficulty, body, explanation, status) values
  ('00000000-0000-4000-8000-0000000000c1', 'journal', 'grade_3',
   '00000000-0000-4000-8000-0000000000b2', 1,
   '商品 10,000 円を仕入れ、代金は現金で支払った。',
   '仕入は費用の増加（借方）、現金は資産の減少（貸方）。',
   'published')
on conflict (id) do nothing;

insert into journal_lines (question_id, side, account_id, amount, line_no) values
  ('00000000-0000-4000-8000-0000000000c1', 'debit',  '00000000-0000-4000-8000-000000000a05', 10000, 0),
  ('00000000-0000-4000-8000-0000000000c1', 'credit', '00000000-0000-4000-8000-000000000a01', 10000, 0)
on conflict do nothing;

-- --- Q2: 仕訳（掛売上）--------------------------------------------------------
insert into questions (id, type, grade, topic_id, difficulty, body, explanation, status) values
  ('00000000-0000-4000-8000-0000000000c2', 'journal', 'grade_3',
   '00000000-0000-4000-8000-0000000000b2', 1,
   '商品を 20,000 円で売り上げ、代金は掛けとした。',
   '売掛金は資産の増加（借方）、売上は収益の増加（貸方）。',
   'published')
on conflict (id) do nothing;

insert into journal_lines (question_id, side, account_id, amount, line_no) values
  ('00000000-0000-4000-8000-0000000000c2', 'debit',  '00000000-0000-4000-8000-000000000a02', 20000, 0),
  ('00000000-0000-4000-8000-0000000000c2', 'credit', '00000000-0000-4000-8000-000000000a04', 20000, 0)
on conflict do nothing;

-- --- Q3: 選択 ----------------------------------------------------------------
insert into questions (id, type, grade, topic_id, difficulty, body, explanation, status) values
  ('00000000-0000-4000-8000-0000000000c3', 'choice', 'grade_3',
   '00000000-0000-4000-8000-0000000000b1', 1,
   '資産の増加は、仕訳のどちら側（借方・貸方）に記入するか。',
   '資産の増加は借方に記入する。',
   'published')
on conflict (id) do nothing;

insert into question_choices (question_id, label, body, is_correct, sort_order) values
  ('00000000-0000-4000-8000-0000000000c3', 'ア', '借方', true,  10),
  ('00000000-0000-4000-8000-0000000000c3', 'イ', '貸方', false, 20)
on conflict do nothing;

-- --- Q4: 計算 ----------------------------------------------------------------
insert into questions (id, type, grade, topic_id, difficulty, body, explanation, status) values
  ('00000000-0000-4000-8000-0000000000c4', 'calc', 'grade_3',
   '00000000-0000-4000-8000-0000000000b2', 2,
   '売上 100,000 円、売上原価 60,000 円のとき、売上総利益はいくらか（円）。',
   '売上総利益 = 売上 − 売上原価 = 100,000 − 60,000 = 40,000 円。',
   'published')
on conflict (id) do nothing;

insert into calc_answers (question_id, expected_value, tolerance, unit) values
  ('00000000-0000-4000-8000-0000000000c4', 40000, 0, '円')
on conflict (question_id) do nothing;
