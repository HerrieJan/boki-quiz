-- =============================================================================
-- ビュー
--  * question_choices_public: is_correct を隠して選択肢を公開（DEFINER=owner 権限で
--    RLS を越えて読み、安全な列のみ露出）。
--  * attempts 系ビュー: security_invoker=true で呼び出しユーザーの RLS を適用し、
--    自分の履歴だけが集計されるようにする。
-- =============================================================================

-- 選択肢の公開ビュー（is_correct を含めない / 公開問題のみ）
create view question_choices_public as
select id, question_id, label, body, sort_order
from question_choices
where question_id in (select id from questions where status = 'published');

-- 各(ユーザー,問題)の最新の解答のみ
create view latest_attempts
with (security_invoker = true) as
select distinct on (user_id, question_id) *
from attempts
order by user_id, question_id, created_at desc;

-- 錯題（最新の解答が不正解の問題）
create view wrong_questions
with (security_invoker = true) as
select user_id, question_id, created_at as last_attempt_at
from latest_attempts
where is_correct = false;

-- 分野別 正答率（ダッシュボード用）
create view user_topic_stats
with (security_invoker = true) as
select a.user_id,
       q.grade,
       q.topic_id,
       count(*)                             as total,
       count(*) filter (where a.is_correct) as correct,
       avg(a.score)                         as avg_score
from attempts a
join questions q on q.id = a.question_id
group by a.user_id, q.grade, q.topic_id;
