import type { JournalLine, JournalSide } from '@/domain/types';
import { accounts } from '@/data/accounts';
import { sumBySide } from '@/domain/scoring';

interface Props {
  lines: JournalLine[];
  onChange: (lines: JournalLine[]) => void;
  disabled?: boolean;
}

const yen = (n: number) => n.toLocaleString('ja-JP');

export function JournalInput({ lines, onChange, disabled }: Props) {
  const update = (i: number, patch: Partial<JournalLine>) => {
    onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };
  const addRow = (side: JournalSide) => {
    onChange([...lines, { side, accountId: '', amount: 0 }]);
  };
  const removeRow = (i: number) => onChange(lines.filter((_, idx) => idx !== i));

  const totals = sumBySide(lines);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="w-28 px-3 py-2 text-left font-medium">貸借</th>
              <th className="px-3 py-2 text-left font-medium">勘定科目</th>
              <th className="w-40 px-3 py-2 text-right font-medium">金額</th>
              <th className="w-10 px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <select
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 disabled:bg-slate-100"
                    value={line.side}
                    disabled={disabled}
                    onChange={(e) => update(i, { side: e.target.value as JournalSide })}
                  >
                    <option value="debit">借方</option>
                    <option value="credit">貸方</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 disabled:bg-slate-100"
                    value={line.accountId}
                    disabled={disabled}
                    onChange={(e) => update(i, { accountId: e.target.value })}
                  >
                    <option value="">— 選択 —</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-right tabular-nums disabled:bg-slate-100"
                    value={line.amount || ''}
                    disabled={disabled}
                    onChange={(e) => update(i, { amount: Number(e.target.value) })}
                  />
                </td>
                <td className="px-2 py-2 text-center">
                  {!disabled && lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="text-slate-400 hover:text-rose-500"
                      aria-label="行を削除"
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 text-slate-600">
            <tr className="border-t border-slate-200">
              <td colSpan={2} className="px-3 py-2 text-right">借方合計 / 貸方合計</td>
              <td className="px-3 py-2 text-right tabular-nums">
                <span className={totals.balanced ? '' : 'text-amber-600'}>
                  {yen(totals.debit)} / {yen(totals.credit)}
                </span>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {!disabled && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addRow('debit')}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            ＋ 借方行
          </button>
          <button
            type="button"
            onClick={() => addRow('credit')}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            ＋ 貸方行
          </button>
          {!totals.balanced && (
            <span className="ml-auto text-sm text-amber-600">貸借が一致していません</span>
          )}
        </div>
      )}
    </div>
  );
}
