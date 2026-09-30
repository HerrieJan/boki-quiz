import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Account, JournalLine, JournalQuestion, JournalSide } from '@/domain/types';
import { accounts as allAccounts, accountMap, accountName } from '@/data/accounts';
import { sumBySide } from '@/domain/scoring';

interface Props {
  question: JournalQuestion;
  onChange: (lines: JournalLine[]) => void;
  disabled?: boolean;
}

const yen = (n: number) => n.toLocaleString('ja-JP');
const uniq = <T,>(arr: T[]): T[] => [...new Set(arr)];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ドラッグする部品。勘定科目か金額。
type Token =
  | { id: string; kind: 'account'; accountId: string }
  | { id: string; kind: 'amount'; amount: number };

const CATEGORY_COLOR: Record<Account['category'], string> = {
  asset: 'bg-sky-100 text-sky-700 border-sky-200',
  liability: 'bg-rose-100 text-rose-700 border-rose-200',
  equity: 'bg-violet-100 text-violet-700 border-violet-200',
  revenue: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  expense: 'bg-amber-100 text-amber-700 border-amber-200',
};

function distractorAmounts(correct: number[]): number[] {
  const set = new Set(correct);
  const cand: number[] = [];
  for (const a of correct) cand.push(a * 2, Math.round(a / 2), a + 1000, a - 1000);
  cand.push(5000, 15000, 50000, 100000);
  return uniq(cand).filter((n) => n > 0 && !set.has(n));
}

// 正解の科目・金額に、関係ない選択肢を少し混ぜる。
// 借方と貸方で同じ金額が必要なので、金額は行の数だけ作る。
function buildPool(q: JournalQuestion): Token[] {
  const correctAccIds = q.correct.map((l) => l.accountId);
  const usedAcc = new Set(correctAccIds);
  // 3級の問題に1級の科目が出ないようにする
  const distractAcc = shuffle(allAccounts.filter((a) => !usedAcc.has(a.id) && a.grades.includes(q.grade)))
    .slice(0, 3)
    .map((a) => a.id);
  const accTokens: Token[] = shuffle([...correctAccIds, ...distractAcc]).map((accountId, i) => ({
    id: `acc-${i}`,
    kind: 'account',
    accountId,
  }));

  const correctAmts = q.correct.map((l) => l.amount);
  const distractAmt = shuffle(distractorAmounts(uniq(correctAmts))).slice(0, 2);
  const amtTokens: Token[] = shuffle([...correctAmts, ...distractAmt]).map((amount, i) => ({
    id: `amt-${i}`,
    kind: 'amount',
    amount,
  }));

  return [...accTokens, ...amtTokens];
}

const tokenLabel = (t: Token) => (t.kind === 'account' ? accountName(t.accountId) : yen(t.amount));

function TokenChip({ token }: { token: Token }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: token.id });
  const color =
    token.kind === 'account'
      ? CATEGORY_COLOR[accountMap.get(token.accountId)!.category]
      : 'bg-slate-100 text-slate-700 border-slate-300 tabular-nums';
  return (
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      className={`cursor-grab touch-none rounded-full border px-3 py-1.5 text-sm font-medium active:cursor-grabbing ${color} ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      {tokenLabel(token)}
    </button>
  );
}

function AmountSlot({
  rowKey,
  amount,
  onClear,
  disabled,
}: {
  rowKey: string;
  amount: number | null;
  onClear: () => void;
  disabled?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `amt-slot:${rowKey}`, disabled });
  if (amount != null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm tabular-nums">
        {yen(amount)}
        {!disabled && (
          <button type="button" onClick={onClear} className="text-slate-400 hover:text-rose-500" aria-label="金額を戻す">
            ✕
          </button>
        )}
      </span>
    );
  }
  return (
    <span
      ref={setNodeRef}
      className={`inline-flex min-w-24 items-center justify-center rounded-md border border-dashed px-2 py-1 text-xs ${
        isOver ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-slate-300 text-slate-400'
      }`}
    >
      金額をドロップ
    </span>
  );
}

interface RowVM {
  key: string;
  side: JournalSide;
  accountId: string;
  amount: number | null;
}

function Zone({
  side,
  rows,
  onClearAmount,
  onRemove,
  disabled,
}: {
  side: JournalSide;
  rows: RowVM[];
  onClearAmount: (key: string) => void;
  onRemove: (key: string) => void;
  disabled?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: side, disabled });
  const label = side === 'debit' ? '借方' : '貸方';
  const total = rows.reduce((s, r) => s + (r.amount ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-44 flex-col rounded-lg border-2 border-dashed p-3 transition ${
        isOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50/50'
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-600">{label}</span>
        <span className="text-xs tabular-nums text-slate-400">{yen(total)}</span>
      </div>

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5">
            <span className="flex-1 truncate text-sm">{accountName(r.accountId)}</span>
            <AmountSlot rowKey={r.key} amount={r.amount} onClear={() => onClearAmount(r.key)} disabled={disabled} />
            {!disabled && (
              <button type="button" onClick={() => onRemove(r.key)} className="text-slate-400 hover:text-rose-500" aria-label="行を削除">
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      {!disabled && (
        <p className="mt-2 text-center text-xs text-slate-400">
          {rows.length === 0 ? '勘定科目をここへドラッグ' : '＋ さらにドラッグで行を追加'}
        </p>
      )}
      {disabled && rows.length === 0 && <p className="m-auto text-xs text-slate-400">（なし）</p>}
    </div>
  );
}

interface InternalRow {
  key: string;
  side: JournalSide;
  accTokenId: string;
  amtTokenId: string | null;
}

export function JournalOptionsDnd({ question, onChange, disabled }: Props) {
  const pool = useMemo(() => buildPool(question), [question.id]);
  const tokenById = useMemo(() => new Map(pool.map((t) => [t.id, t])), [pool]);
  const [rows, setRows] = useState<InternalRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  // 使用済みトークンを除いた候補
  const usedIds = new Set<string>();
  rows.forEach((r) => {
    usedIds.add(r.accTokenId);
    if (r.amtTokenId) usedIds.add(r.amtTokenId);
  });
  const available = pool.filter((t) => !usedIds.has(t.id));

  // 表示用の行 VM
  const toVM = (r: InternalRow): RowVM => {
    const acc = tokenById.get(r.accTokenId);
    const amt = r.amtTokenId ? tokenById.get(r.amtTokenId) : null;
    return {
      key: r.key,
      side: r.side,
      accountId: acc && acc.kind === 'account' ? acc.accountId : '',
      amount: amt && amt.kind === 'amount' ? amt.amount : null,
    };
  };
  const vms = rows.map(toVM);
  const totals = sumBySide(vms.map((v) => ({ side: v.side, accountId: v.accountId, amount: v.amount ?? 0 })));

  // 採点用に JournalLine[] を親へ通知
  useEffect(() => {
    onChange(vms.map((v) => ({ side: v.side, accountId: v.accountId, amount: v.amount ?? 0 })));
    // rows の変化だけで再通知（onChange は安定参照）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const onDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const overId = e.over?.id as string | undefined;
    const token = tokenById.get(e.active.id as string);
    if (!overId || !token) return;

    if (token.kind === 'account' && (overId === 'debit' || overId === 'credit')) {
      setRows((prev) => [
        ...prev,
        { key: crypto.randomUUID(), side: overId as JournalSide, accTokenId: token.id, amtTokenId: null },
      ]);
    } else if (token.kind === 'amount' && overId.startsWith('amt-slot:')) {
      const rowKey = overId.slice('amt-slot:'.length);
      setRows((prev) => prev.map((r) => (r.key === rowKey ? { ...r, amtTokenId: token.id } : r)));
    }
  };

  const removeRow = (key: string) => setRows((prev) => prev.filter((r) => r.key !== key));
  const clearAmount = (key: string) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, amtTokenId: null } : r)));

  const zones = (
    <div className="grid grid-cols-2 gap-3">
      <Zone side="debit" rows={vms.filter((v) => v.side === 'debit')} onClearAmount={clearAmount} onRemove={removeRow} disabled={disabled} />
      <Zone side="credit" rows={vms.filter((v) => v.side === 'credit')} onClearAmount={clearAmount} onRemove={removeRow} disabled={disabled} />
    </div>
  );

  if (disabled) return zones;

  const accountsAvail = available.filter((t) => t.kind === 'account');
  const amountsAvail = available.filter((t) => t.kind === 'amount');

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="space-y-3">
        {zones}

        {!totals.balanced && rows.length > 0 && (
          <p className="text-right text-sm text-amber-600">貸借が一致していません</p>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="mb-1.5 text-xs font-medium text-slate-400">勘定科目（ダミー含む・ドラッグして配置）</p>
          <div className="flex min-h-9 flex-wrap gap-2">
            {accountsAvail.length === 0 ? (
              <span className="text-xs text-slate-300">すべて配置済み</span>
            ) : (
              accountsAvail.map((t) => <TokenChip key={t.id} token={t} />)
            )}
          </div>
          <p className="mb-1.5 mt-3 text-xs font-medium text-slate-400">金額（ダミー含む）</p>
          <div className="flex min-h-9 flex-wrap gap-2">
            {amountsAvail.length === 0 ? (
              <span className="text-xs text-slate-300">すべて配置済み</span>
            ) : (
              amountsAvail.map((t) => <TokenChip key={t.id} token={t} />)
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeId && tokenById.get(activeId) ? (
          <div className="rounded-full border border-indigo-300 bg-white px-3 py-1.5 text-sm font-medium shadow-lg">
            {tokenLabel(tokenById.get(activeId)!)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
