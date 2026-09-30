import { useMemo, useState } from 'react';
import type {
  Account,
  Choice,
  Grade,
  JournalLine,
  JournalSide,
  Question,
  QuestionType,
} from '@/domain/types';
import { GRADE_LABEL } from '@/domain/types';

const TYPE_LABEL: Record<QuestionType, string> = { journal: '仕訳', choice: '選択', calc: '計算' };
const GRADES: Grade[] = ['grade_3', 'grade_2', 'grade_1'];
const yen = (n: number) => n.toLocaleString('ja-JP');
const uid = () => Math.random().toString(36).slice(2, 8);

interface Draft {
  id: string;
  grade: Grade;
  type: QuestionType;
  topic: string;
  difficulty: number;
  body: string;
  explanation: string;
  lines: JournalLine[];
  choices: Choice[];
  expectedValue: number;
  tolerance: number;
  unit: string;
}

function toDraft(q: Question | null, accounts: Account[]): Draft {
  const firstAcc = accounts[0]?.id ?? '';
  const base: Draft = {
    id: q?.id ?? `q-${uid()}`,
    grade: q?.grade ?? 'grade_3',
    type: q?.type ?? 'journal',
    topic: q?.topic ?? '',
    difficulty: q?.difficulty ?? 1,
    body: q?.body ?? '',
    explanation: q?.explanation ?? '',
    lines: [
      { side: 'debit', accountId: firstAcc, amount: 0 },
      { side: 'credit', accountId: firstAcc, amount: 0 },
    ],
    choices: [
      { id: `ch-${uid()}`, label: 'ア', body: '', isCorrect: true },
      { id: `ch-${uid()}`, label: 'イ', body: '', isCorrect: false },
    ],
    expectedValue: 0,
    tolerance: 0,
    unit: '円',
  };
  if (q?.type === 'journal') base.lines = q.correct.map((l) => ({ ...l }));
  if (q?.type === 'choice') base.choices = q.choices.map((c) => ({ ...c }));
  if (q?.type === 'calc') {
    base.expectedValue = q.expectedValue;
    base.tolerance = q.tolerance;
    base.unit = q.unit ?? '';
  }
  return base;
}

function toQuestion(d: Draft): Question {
  const base = {
    id: d.id,
    grade: d.grade,
    topic: d.topic,
    difficulty: d.difficulty,
    body: d.body,
    explanation: d.explanation,
  };
  if (d.type === 'journal') return { ...base, type: 'journal', correct: d.lines };
  if (d.type === 'choice') return { ...base, type: 'choice', choices: d.choices };
  return { ...base, type: 'calc', expectedValue: d.expectedValue, tolerance: d.tolerance, unit: d.unit || undefined };
}

interface Props {
  question: Question | null; // null = 新規
  accounts: Account[];
  onSave: (q: Question) => void;
  onClose: () => void;
}

const field = 'w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none';
const labelCls = 'text-xs font-medium text-slate-500';

export function QuestionEditor({ question, accounts, onSave, onClose }: Props) {
  const [d, setD] = useState<Draft>(() => toDraft(question, accounts));
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const balance = useMemo(() => {
    const debit = d.lines.filter((l) => l.side === 'debit').reduce((s, l) => s + l.amount, 0);
    const credit = d.lines.filter((l) => l.side === 'credit').reduce((s, l) => s + l.amount, 0);
    return { debit, credit, ok: debit === credit && debit > 0 };
  }, [d.lines]);

  const canSave =
    d.body.trim().length > 0 &&
    (d.type === 'journal'
      ? balance.ok
      : d.type === 'choice'
        ? d.choices.some((c) => c.isCorrect) && d.choices.every((c) => c.body.trim())
        : true);

  // --- 仕訳行の編集 ---
  const updateLine = (i: number, patch: Partial<JournalLine>) =>
    set('lines', d.lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = (side: JournalSide) =>
    set('lines', [...d.lines, { side, accountId: accounts[0]?.id ?? '', amount: 0 }]);
  const removeLine = (i: number) => set('lines', d.lines.filter((_, idx) => idx !== i));

  // --- 選択肢の編集 ---
  const updateChoice = (i: number, patch: Partial<Choice>) =>
    set('choices', d.choices.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const addChoice = () =>
    set('choices', [...d.choices, { id: `ch-${uid()}`, label: '', body: '', isCorrect: false }]);
  const removeChoice = (i: number) => set('choices', d.choices.filter((_, idx) => idx !== i));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4">
      <div className="mt-6 w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="font-semibold">{question ? '問題を編集' : '問題を新規作成'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="閉じる">✕</button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="space-y-1">
              <span className={labelCls}>級</span>
              <select className={field} value={d.grade} onChange={(e) => set('grade', e.target.value as Grade)}>
                {GRADES.map((g) => (
                  <option key={g} value={g}>{GRADE_LABEL[g]}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className={labelCls}>種別</span>
              <select className={field} value={d.type} onChange={(e) => set('type', e.target.value as QuestionType)}>
                {(['journal', 'choice', 'calc'] as QuestionType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className={labelCls}>難易度</span>
              <select className={field} value={d.difficulty} onChange={(e) => set('difficulty', Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>★{n}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className={labelCls}>論点</span>
              <input className={field} value={d.topic} onChange={(e) => set('topic', e.target.value)} placeholder="仕入・売上 など" />
            </label>
          </div>

          <label className="block space-y-1">
            <span className={labelCls}>問題文</span>
            <textarea className={`${field} min-h-20`} value={d.body} onChange={(e) => set('body', e.target.value)} />
          </label>

          {/* 種別ごとの解答編集 */}
          {d.type === 'journal' && (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between">
                <span className={labelCls}>正解の仕訳</span>
                <span className={`text-xs tabular-nums ${balance.ok ? 'text-emerald-600' : 'text-amber-600'}`}>
                  借 {yen(balance.debit)} / 貸 {yen(balance.credit)} {balance.ok ? '✓' : '（不一致）'}
                </span>
              </div>
              <ul className="space-y-1.5">
                {d.lines.map((l, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <select className={`${field} w-20`} value={l.side} onChange={(e) => updateLine(i, { side: e.target.value as JournalSide })}>
                      <option value="debit">借方</option>
                      <option value="credit">貸方</option>
                    </select>
                    <select className={`${field} flex-1`} value={l.accountId} onChange={(e) => updateLine(i, { accountId: e.target.value })}>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className={`${field} w-28 text-right tabular-nums`}
                      value={l.amount}
                      onChange={(e) => updateLine(i, { amount: Number(e.target.value) })}
                    />
                    <button onClick={() => removeLine(i)} className="text-slate-400 hover:text-rose-500" aria-label="削除">✕</button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <button onClick={() => addLine('debit')} className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-white">＋ 借方</button>
                <button onClick={() => addLine('credit')} className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-white">＋ 貸方</button>
              </div>
            </div>
          )}

          {d.type === 'choice' && (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <span className={labelCls}>選択肢（正解にチェック）</span>
              <ul className="space-y-1.5">
                {d.choices.map((c, i) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <input type="checkbox" checked={c.isCorrect} onChange={(e) => updateChoice(i, { isCorrect: e.target.checked })} className="h-4 w-4" />
                    <input className={`${field} w-14`} value={c.label ?? ''} onChange={(e) => updateChoice(i, { label: e.target.value })} placeholder="記号" />
                    <input className={`${field} flex-1`} value={c.body} onChange={(e) => updateChoice(i, { body: e.target.value })} placeholder="選択肢の内容" />
                    <button onClick={() => removeChoice(i)} className="text-slate-400 hover:text-rose-500" aria-label="削除">✕</button>
                  </li>
                ))}
              </ul>
              <button onClick={addChoice} className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-white">＋ 選択肢</button>
            </div>
          )}

          {d.type === 'calc' && (
            <div className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <label className="space-y-1">
                <span className={labelCls}>正解値</span>
                <input type="number" className={`${field} text-right tabular-nums`} value={d.expectedValue} onChange={(e) => set('expectedValue', Number(e.target.value))} />
              </label>
              <label className="space-y-1">
                <span className={labelCls}>許容誤差</span>
                <input type="number" className={`${field} text-right tabular-nums`} value={d.tolerance} onChange={(e) => set('tolerance', Number(e.target.value))} />
              </label>
              <label className="space-y-1">
                <span className={labelCls}>単位</span>
                <input className={field} value={d.unit} onChange={(e) => set('unit', e.target.value)} />
              </label>
            </div>
          )}

          <label className="block space-y-1">
            <span className={labelCls}>解説</span>
            <textarea className={`${field} min-h-16`} value={d.explanation} onChange={(e) => set('explanation', e.target.value)} />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button onClick={onClose} className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">キャンセル</button>
          <button
            onClick={() => onSave(toQuestion(d))}
            disabled={!canSave}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
