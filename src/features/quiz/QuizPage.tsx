import { useState } from 'react';
import type { Answer, GradeResult, JournalLine, Question } from '@/domain/types';
import { GRADE_LABEL } from '@/domain/types';
import { gradeQuestion } from '@/domain/scoring';
import { JournalInput } from '@/components/JournalInput';
import { JournalOptionsDnd } from '@/components/JournalOptionsDnd';
import { ResultPanel } from '@/components/ResultPanel';

type JournalMode = 'dnd' | 'select';

const TYPE_LABEL: Record<Question['type'], string> = {
  journal: '仕訳',
  choice: '選択',
  calc: '計算',
};

function initialJournal(): JournalLine[] {
  return [
    { side: 'debit', accountId: '', amount: 0 },
    { side: 'credit', accountId: '', amount: 0 },
  ];
}

interface QuizPageProps {
  question: Question;
  isWrong: boolean;
  onAddWrong: () => void;
  onRemoveWrong: () => void;
}

export function QuizPage({ question, isWrong, onAddWrong, onRemoveWrong }: QuizPageProps) {
  const [lines, setLines] = useState<JournalLine[]>([]);
  const [journalMode, setJournalMode] = useState<JournalMode>('dnd');
  const [choiceIds, setChoiceIds] = useState<string[]>([]);
  const [calcValue, setCalcValue] = useState<string>('');
  const [result, setResult] = useState<GradeResult | null>(null);

  const buildAnswer = (): Answer => {
    switch (question.type) {
      case 'journal':
        return { type: 'journal', lines: lines.filter((l) => l.accountId && l.amount > 0) };
      case 'choice':
        return { type: 'choice', choiceIds };
      case 'calc':
        return { type: 'calc', value: Number(calcValue) };
    }
  };

  const canSubmit = (): boolean => {
    if (question.type === 'journal') return lines.some((l) => l.accountId && l.amount > 0);
    if (question.type === 'choice') return choiceIds.length > 0;
    return calcValue.trim() !== '';
  };

  const submit = () => setResult(gradeQuestion(question, buildAnswer()));
  const reset = () => {
    setLines(journalMode === 'select' ? initialJournal() : []);
    setChoiceIds([]);
    setCalcValue('');
    setResult(null);
  };

  const switchJournalMode = (m: JournalMode) => {
    // セレクト式は最低1行あると使いやすいので空なら初期行を用意
    if (m === 'select' && lines.length === 0) setLines(initialJournal());
    setJournalMode(m);
  };

  const answered = result !== null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
          {GRADE_LABEL[question.grade]}
        </span>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {TYPE_LABEL[question.type]}
        </span>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {question.topic}
        </span>
        <span className="text-xs text-slate-400">難易度 {question.difficulty}</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-base leading-relaxed text-slate-800">{question.body}</p>

        <div className="mt-5">
          {question.type === 'journal' && (
            <div className="space-y-3">
              {!answered && (
                <div className="flex items-center justify-end gap-1">
                  <span className="mr-1 text-xs text-slate-400">入力方式</span>
                  <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 text-sm">
                    <button
                      type="button"
                      onClick={() => switchJournalMode('dnd')}
                      className={`px-3 py-1 ${
                        journalMode === 'dnd' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'
                      }`}
                    >
                      ドラッグ
                    </button>
                    <button
                      type="button"
                      onClick={() => switchJournalMode('select')}
                      className={`px-3 py-1 ${
                        journalMode === 'select' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'
                      }`}
                    >
                      セレクト
                    </button>
                  </div>
                </div>
              )}
              {journalMode === 'dnd' ? (
                <JournalOptionsDnd question={question} onChange={setLines} disabled={answered} />
              ) : (
                <JournalInput lines={lines} onChange={setLines} disabled={answered} />
              )}
            </div>
          )}

          {question.type === 'choice' && (
            <div className="space-y-2">
              {question.choices.map((c) => {
                const checked = choiceIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${
                      checked ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
                    } ${answered ? 'pointer-events-none opacity-80' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checked}
                      onChange={(e) =>
                        setChoiceIds((prev) =>
                          e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id),
                        )
                      }
                    />
                    <span className="text-sm">
                      {c.label ? <b className="mr-1">{c.label}.</b> : null}
                      {c.body}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {question.type === 'calc' && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-48 rounded-md border border-slate-300 px-3 py-2 text-right tabular-nums disabled:bg-slate-100"
                value={calcValue}
                disabled={answered}
                onChange={(e) => setCalcValue(e.target.value)}
                placeholder="0"
              />
              {question.unit && <span className="text-slate-500">{question.unit}</span>}
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          {!answered ? (
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit()}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              採点する
            </button>
          ) : (
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-50"
            >
              もう一度
            </button>
          )}
        </div>

        {result && (
          <div className="mt-5">
            <ResultPanel question={question} result={result} />
          </div>
        )}

        {result && !result.isCorrect && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
            {isWrong ? (
              <>
                <span className="text-sm text-rose-700">復習リストに入れました。</span>
                <button
                  type="button"
                  onClick={onRemoveWrong}
                  className="ml-auto text-sm font-medium text-slate-500 hover:underline"
                >
                  やめる
                </button>
              </>
            ) : (
              <>
                <span className="text-sm text-rose-700">間違えたので、あとで見直せるように残しますか？</span>
                <button
                  type="button"
                  onClick={onAddWrong}
                  className="ml-auto rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
                >
                  残す
                </button>
              </>
            )}
          </div>
        )}

        {result && result.isCorrect && isWrong && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="text-sm text-emerald-700">正解でした。リストから外しますか？</span>
            <button
              type="button"
              onClick={onRemoveWrong}
              className="ml-auto rounded-md border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              外す
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
