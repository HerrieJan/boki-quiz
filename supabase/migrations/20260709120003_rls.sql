-- =============================================================================
-- RLS 有効化・ポリシー・権限付与
-- 方針: 権限判定は必ず DB 側。正解データはユーザーに露出させない。
-- 正本: 00_docs/20_tech/20_architecture/backend/02_DataModel.md §7
-- =============================================================================

-- --- RLS 有効化 ---------------------------------------------------------------
alter table profiles         enable row level security;
alter table accounts         enable row level security;
alter table topics           enable row level security;
alter table questions        enable row level security;
alter table journal_lines    enable row level security;
alter table question_choices enable row level security;
alter table calc_answers     enable row level security;
alter table attempts         enable row level security;
alter table bookmarks        enable row level security;

-- --- profiles -----------------------------------------------------------------
create policy profiles_select on profiles
  for select using (id = auth.uid() or is_admin());
create policy profiles_update_self on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on profiles
  for all using (is_admin()) with check (is_admin());

-- --- accounts -----------------------------------------------------------------
create policy accounts_select on accounts
  for select using (is_active or is_admin());
create policy accounts_admin_all on accounts
  for all using (is_admin()) with check (is_admin());

-- --- topics -------------------------------------------------------------------
create policy topics_select on topics
  for select using (true);
create policy topics_admin_all on topics
  for all using (is_admin()) with check (is_admin());

-- --- questions ----------------------------------------------------------------
create policy questions_select_published on questions
  for select using (status = 'published' or is_admin());
create policy questions_admin_all on questions
  for all using (is_admin()) with check (is_admin());

-- --- 正解テーブル: 管理者のみ（ユーザーは直接 select 不可）--------------------
create policy journal_lines_admin_all on journal_lines
  for all using (is_admin()) with check (is_admin());
create policy question_choices_admin_all on question_choices
  for all using (is_admin()) with check (is_admin());
create policy calc_answers_admin_all on calc_answers
  for all using (is_admin()) with check (is_admin());

-- --- attempts: 自分の行を select のみ（insert は grade_and_record 経由）--------
create policy attempts_select_own on attempts
  for select using (user_id = auth.uid() or is_admin());

-- --- bookmarks: 自分の行のみ ---------------------------------------------------
create policy bookmarks_all_own on bookmarks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =============================================================================
-- 権限付与（RLS と併せて動作。RLS が最終的なフィルタ）
-- =============================================================================
grant usage on schema public to anon, authenticated;

-- 一般ユーザーの読み取り（RLS でさらに制限）
grant select on profiles to authenticated;
grant update (display_name) on profiles to authenticated;   -- role は変更させない
grant select on accounts to authenticated;
grant select on topics   to authenticated;
grant select on questions to authenticated;
grant select on attempts  to authenticated;

-- 管理者操作（同じ authenticated ロール。RLS の is_admin() で制限）
grant insert, update, delete on accounts         to authenticated;
grant insert, update, delete on topics           to authenticated;
grant insert, update, delete on questions        to authenticated;
grant select, insert, update, delete on journal_lines    to authenticated;
grant select, insert, update, delete on question_choices to authenticated;
grant select, insert, update, delete on calc_answers     to authenticated;

-- お気に入り
grant select, insert, delete on bookmarks to authenticated;

-- ビュー
grant select on question_choices_public to anon, authenticated;
grant select on latest_attempts   to authenticated;
grant select on wrong_questions   to authenticated;
grant select on user_topic_stats  to authenticated;

-- 採点 RPC（一般ユーザーが実行可能）
grant execute on function grade_and_record(uuid, jsonb, int) to authenticated;
