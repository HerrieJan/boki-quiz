import type { GradeResult, Question } from '@/domain/types';
import { accountName } from '@/data/accounts';

interface Props {
  question: Question;
  result: GradeResult;
}

const yen = (n: number) => n.toLocaleString('ja-JP');

function CorrectAnswer({ question, result }: Props) {
  const a = result.correctAnswer;
  if (a.type === 'journal') {
    return (
      <ul className="space-y-1 text-sm">
        {a.lines.map((l, i) => (
          <li key={i} className="flex gap-2">
            <span className="w-10 text-slate-500">{l.side === 'debit' ? '借方' : '貸方'}</span>
            <span className="flex-1">{accountName(l.accountId)}</span>
            <span className="tabular-nums">{yen(l.amount)}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (a.type === 'choice' && question.type === 'choice') {
    const labels = question.choices
      .filter((c) => a.choiceIds.includes(c.id))
      .map((c) => `${c.label ?? ''} ${c.body}`.trim());
    return <p className="text-sm">{labels.join(' / ')}</p>;
  }
  if (a.type === 'calc') {
    return <p className="text-sm tabular-nums">{yen(a.value)} 円</p>;
  }
  return null;
}

export function ResultPanel({ question, result }: Props) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        result.isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
            result.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {result.isCorrect ? '正解' : '不正解'}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-slate-500">正解</p>
        <div className="mt-1">
          <CorrectAnswer question={question} result={result} />
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-slate-500">解説</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">{result.explanation}</p>
      </div>
    </div>
  );
}
