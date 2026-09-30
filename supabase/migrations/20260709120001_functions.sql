-- =============================================================================
-- 関数・トリガ（権限判定 / サインアップ / 採点）
-- 採点は SECURITY DEFINER で行い、正解データをユーザーに露出させない。
-- =============================================================================

-- --- 管理者判定（RLS から使用。DEFINER で再帰RLSを回避）----------------------
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- --- サインアップ時に profiles を自動作成 ------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- --- 採点ヘルパ（いずれも DEFINER：正解テーブルを読む）----------------------

-- 仕訳: 借方・貸方それぞれ (side, account_id, amount) の多重集合が完全一致（順不同）
create or replace function is_journal_correct(p_question_id uuid, p_answer jsonb)
returns boolean
language sql
security definer
set search_path = public
as $$
  with correct as (
    select side::text as side, account_id, amount
    from journal_lines
    where question_id = p_question_id
  ),
  submitted as (
    select (e->>'side')                as side,
           (e->>'accountId')::uuid     as account_id,
           (e->>'amount')::numeric     as amount
    from jsonb_array_elements(coalesce(p_answer->'lines', '[]'::jsonb)) as e
  ),
  diff as (
    (select side, account_id, amount from correct
     except all
     select side, account_id, amount from submitted)
    union all
    (select side, account_id, amount from submitted
     except all
     select side, account_id, amount from correct)
  )
  select not exists (select 1 from diff);
$$;

-- 選択: is_correct=true の選択肢集合と choiceIds が一致
create or replace function is_choice_correct(p_question_id uuid, p_answer jsonb)
returns boolean
language sql
security definer
set search_path = public
as $$
  with correct as (
    select id from question_choices
    where question_id = p_question_id and is_correct
  ),
  submitted as (
    select v::uuid as id
    from jsonb_array_elements_text(coalesce(p_answer->'choiceIds', '[]'::jsonb)) v
  ),
  diff as (
    (select id from correct except select id from submitted)
    union all
    (select id from submitted except select id from correct)
  )
  select not exists (select 1 from diff);
$$;

-- 計算: |value - expected| <= tolerance
create or replace function is_calc_correct(p_question_id uuid, p_answer jsonb)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select abs((p_answer->>'value')::numeric - expected_value) <= tolerance
     from calc_answers
     where question_id = p_question_id),
    false
  );
$$;

-- 正解の開示（提出後に返す）
create or replace function get_correct_answer(p_question_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type  question_type;
  v_result jsonb;
begin
  select type into v_type from questions where id = p_question_id;

  if v_type = 'journal' then
    select jsonb_build_object(
             'type', 'journal',
             'lines', coalesce(jsonb_agg(
               jsonb_build_object('side', side, 'accountId', account_id, 'amount', amount)
               order by side, line_no), '[]'::jsonb))
      into v_result
      from journal_lines where question_id = p_question_id;

  elsif v_type = 'choice' then
    select jsonb_build_object(
             'type', 'choice',
             'choiceIds', coalesce(jsonb_agg(id), '[]'::jsonb))
      into v_result
      from question_choices where question_id = p_question_id and is_correct;

  elsif v_type = 'calc' then
    select jsonb_build_object(
             'type', 'calc',
             'value', expected_value,
             'tolerance', tolerance)
      into v_result
      from calc_answers where question_id = p_question_id;
  end if;

  return v_result;
end;
$$;

-- --- エントリ関数: 採点して attempts に記録し、結果を返す --------------------
create or replace function grade_and_record(
  p_question_id uuid,
  p_answer      jsonb,
  p_duration_ms int default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type    question_type;
  v_expl    text;
  v_correct boolean := false;
  v_score   numeric := 0;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select type, explanation
    into v_type, v_expl
    from questions
   where id = p_question_id and status = 'published';

  if not found then
    raise exception 'question not found or not published';
  end if;

  if v_type = 'journal' then
    v_correct := is_journal_correct(p_question_id, p_answer);
  elsif v_type = 'choice' then
    v_correct := is_choice_correct(p_question_id, p_answer);
  elsif v_type = 'calc' then
    v_correct := is_calc_correct(p_question_id, p_answer);
  end if;

  v_score := case when v_correct then 1 else 0 end;  -- レベルA（完全一致）

  insert into attempts (user_id, question_id, is_correct, score, submitted_answer, duration_ms)
  values (auth.uid(), p_question_id, v_correct, v_score, p_answer, p_duration_ms);

  return jsonb_build_object(
    'is_correct',     v_correct,
    'score',          v_score,
    'explanation',    v_expl,
    'correct_answer', get_correct_answer(p_question_id)
  );
end;
$$;

-- 内部ヘルパは直接呼ばせない（grade_and_record から DEFINER 権限で呼ばれる）
revoke execute on function is_journal_correct(uuid, jsonb) from public;
revoke execute on function is_choice_correct(uuid, jsonb)  from public;
revoke execute on function is_calc_correct(uuid, jsonb)    from public;
revoke execute on function get_correct_answer(uuid)        from public;
