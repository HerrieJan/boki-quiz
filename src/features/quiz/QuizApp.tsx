import { useEffect, useMemo, useState } from 'react';
import { questions } from '@/data/questions';
import { GRADE_LABEL, type Grade, type Question } from '@/domain/types';
import { QuizPage } from '@/features/quiz/QuizPage';

const GRADES: Grade[] = ['grade_3', 'grade_2', 'grade_1'];

const TYPE_LABEL: Record<Question['type'], string> = {
  journal: '仕訳',
  choice: '選択',
  calc: '計算',
};

const STORAGE_KEY = 'boki-quiz:wrong-ids';
type Tab = 'quiz' | 'wrong';

// ブラウザを閉じても残したいので localStorage に入れている
function loadWrongIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function QuizApp() {
  const [tab, setTab] = useState<Tab>('quiz');
  const [gradeFilter, setGradeFilter] = useState<Grade | 'all'>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string>(questions[0].id);
  const [wrongIds, setWrongIds] = useState<string[]>(loadWrongIds);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wrongIds));
  }, [wrongIds]);

  // 選択中の級で使える論点の一覧（重複排除）
  const topicOptions = useMemo(() => {
    const inGrade = gradeFilter === 'all' ? questions : questions.filter((q) => q.grade === gradeFilter);
    return [...new Set(inGrade.map((q) => q.topic))];
  }, [gradeFilter]);

  const matches = (q: Question, g: Grade | 'all', t: string) =>
    (g === 'all' || q.grade === g) && (t === 'all' || q.topic === t);

  const visibleQuestions = useMemo(
    () => questions.filter((q) => matches(q, gradeFilter, topicFilter)),
    [gradeFilter, topicFilter],
  );

  // 絞り込みで選択中の問題が一覧から外れたら先頭を選び直す
  const reselect = (g: Grade | 'all', t: string) => {
    const next = questions.filter((q) => matches(q, g, t));
    if (next.length > 0 && !next.some((q) => q.id === selectedId)) setSelectedId(next[0].id);
  };

  const selectGrade = (g: Grade | 'all') => {
    // 級を変えたら、その級に無い論点が選ばれていれば「全論点」に戻す
    const inGrade = g === 'all' ? questions : questions.filter((q) => q.grade === g);
    const nextTopic = topicFilter !== 'all' && inGrade.some((q) => q.topic === topicFilter) ? topicFilter : 'all';
    setGradeFilter(g);
    setTopicFilter(nextTopic);
    reselect(g, nextTopic);
  };

  const selectTopic = (t: string) => {
    setTopicFilter(t);
    reselect(gradeFilter, t);
  };

  const selected = questions.find((q) => q.id === selectedId)!;
  const addWrong = (id: string) => setWrongIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const removeWrong = (id: string) => setWrongIds((prev) => prev.filter((x) => x !== id));

  const wrongQuestions = wrongIds
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is Question => Boolean(q));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <nav className="mb-5 flex gap-1 border-b border-slate-200">
        <TabButton active={tab === 'quiz'} onClick={() => setTab('quiz')}>
          問題
        </TabButton>
        <TabButton active={tab === 'wrong'} onClick={() => setTab('wrong')}>
          間違えた問題
          {wrongIds.length > 0 && (
            <span className="ml-1.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
              {wrongIds.length}
            </span>
          )}
        </TabButton>
      </nav>

      {tab === 'quiz' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
          <aside>
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                問題一覧（{visibleQuestions.length}）
              </h2>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <select
                value={gradeFilter}
                onChange={(e) => selectGrade(e.target.value as Grade | 'all')}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
              >
                <option value="all">全級</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {GRADE_LABEL[g]}
                  </option>
                ))}
              </select>
              <select
                value={topicFilter}
                onChange={(e) => selectTopic(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
              >
                <option value="all">全論点</option>
                {topicOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <ul className="space-y-1">
              {visibleQuestions.length === 0 && (
                <li className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">
                  条件に合う問題がありません
                </li>
              )}
              {visibleQuestions.map((q) => {
                const active = q.id === selectedId;
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(q.id)}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                        active ? 'border-indigo-300 bg-white shadow-sm' : 'border-transparent hover:bg-white/70'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                          {GRADE_LABEL[q.grade]}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                          {TYPE_LABEL[q.type]}
                        </span>
                        {wrongIds.includes(q.id) && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-600">見直し</span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-slate-700">{q.body}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section>
            <QuizPage
              key={selected.id}
              question={selected}
              isWrong={wrongIds.includes(selected.id)}
              onAddWrong={() => addWrong(selected.id)}
              onRemoveWrong={() => removeWrong(selected.id)}
            />
          </section>
        </div>
      ) : (
        <WrongList
          items={wrongQuestions}
          onReview={(id) => {
            setSelectedId(id);
            setTab('quiz');
          }}
          onRemove={removeWrong}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px flex items-center border-b-2 px-4 py-2 text-sm font-medium transition ${
        active ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

function WrongList({
  items,
  onReview,
  onRemove,
}: {
  items: Question[];
  onReview: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm text-slate-500">まだありません。</p>
        <p className="mt-1 text-xs text-slate-400">間違えると、ここに残すか聞かれます。</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((q) => (
        <li key={q.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                {GRADE_LABEL[q.grade]}
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                {TYPE_LABEL[q.type]}
              </span>
              <span className="text-[10px] text-slate-400">{q.topic}</span>
            </div>
            <p className="truncate text-sm text-slate-700">{q.body}</p>
          </div>
          <button
            type="button"
            onClick={() => onReview(q.id)}
            className="shrink-0 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            復習する
          </button>
          <button
            type="button"
            onClick={() => onRemove(q.id)}
            className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
          >
            削除
          </button>
        </li>
      ))}
    </ul>
  );
}
