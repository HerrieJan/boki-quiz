import { useMemo, useState } from 'react';
import { questions as seedQuestions } from '@/data/questions';
import { accounts as seedAccounts } from '@/data/accounts';
import {
  GRADE_LABEL,
  type Account,
  type AccountCategory,
  type Grade,
  type Question,
  type QuestionType,
} from '@/domain/types';
import { QuestionEditor } from '@/features/admin/QuestionEditor';

const TYPE_LABEL: Record<QuestionType, string> = { journal: '仕訳', choice: '選択', calc: '計算' };
const CATEGORY_LABEL: Record<AccountCategory, string> = {
  asset: '資産',
  liability: '負債',
  equity: '純資産',
  revenue: '収益',
  expense: '費用',
};
const CATEGORY_COLOR: Record<AccountCategory, string> = {
  asset: 'bg-sky-100 text-sky-700',
  liability: 'bg-rose-100 text-rose-700',
  equity: 'bg-violet-100 text-violet-700',
  revenue: 'bg-emerald-100 text-emerald-700',
  expense: 'bg-amber-100 text-amber-700',
};
const GRADES: Grade[] = ['grade_3', 'grade_2', 'grade_1'];
const uid = () => Math.random().toString(36).slice(2, 8);

type Tab = 'dashboard' | 'questions' | 'accounts';

export function AdminApp() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [list, setList] = useState<Question[]>(seedQuestions);
  const [accounts, setAccounts] = useState<Account[]>(seedAccounts);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <nav className="mb-5 flex gap-1 border-b border-slate-200">
        {([
          ['dashboard', 'ダッシュボード'],
          ['questions', '問題管理'],
          ['accounts', '勘定科目管理'],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'dashboard' && <Dashboard list={list} accounts={accounts} />}
      {tab === 'questions' && <QuestionManager list={list} accounts={accounts} onChange={setList} />}
      {tab === 'accounts' && <AccountManager accounts={accounts} onChange={setAccounts} />}
    </div>
  );
}

// --- ダッシュボード ----------------------------------------------------------
function Dashboard({ list, accounts }: { list: Question[]; accounts: Account[] }) {
  const byGrade = GRADES.map((g) => ({ g, n: list.filter((q) => q.grade === g).length }));
  const byType = (['journal', 'choice', 'calc'] as QuestionType[]).map((t) => ({
    t,
    n: list.filter((q) => q.type === t).length,
  }));
  const max = Math.max(1, ...byType.map((x) => x.n));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="問題の数" value={list.length} />
        <StatCard label="勘定科目の数" value={accounts.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Panel title="級別の問題数">
          <ul className="space-y-2">
            {byGrade.map(({ g, n }) => (
              <li key={g} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{GRADE_LABEL[g]}</span>
                <span className="font-medium tabular-nums">{n} 問</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="種別の内訳">
          <ul className="space-y-2">
            {byType.map(({ t, n }) => (
              <li key={t} className="text-sm">
                <div className="mb-1 flex justify-between">
                  <span className="text-slate-600">{TYPE_LABEL[t]}</span>
                  <span className="tabular-nums">{n}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${(n / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value.toLocaleString('ja-JP')}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-600">{title}</h3>
      {children}
    </div>
  );
}

// --- 問題管理 ----------------------------------------------------------------
function QuestionManager({
  list,
  accounts,
  onChange,
}: {
  list: Question[];
  accounts: Account[];
  onChange: (list: Question[]) => void;
}) {
  const [grade, setGrade] = useState<Grade | 'all'>('all');
  const [type, setType] = useState<QuestionType | 'all'>('all');
  const [kw, setKw] = useState('');
  const [editing, setEditing] = useState<Question | null | undefined>(undefined); // undefined=閉, null=新規

  const filtered = useMemo(
    () =>
      list.filter(
        (q) =>
          (grade === 'all' || q.grade === grade) &&
          (type === 'all' || q.type === type) &&
          (kw === '' || q.body.includes(kw) || q.topic.includes(kw)),
      ),
    [list, grade, type, kw],
  );

  const save = (q: Question) => {
    onChange(list.some((x) => x.id === q.id) ? list.map((x) => (x.id === q.id ? q : x)) : [...list, q]);
    setEditing(undefined);
  };
  const remove = (id: string) => {
    if (confirm('この問題を削除しますか？')) onChange(list.filter((q) => q.id !== id));
  };
  const duplicate = (q: Question) => onChange([...list, { ...q, id: `q-${uid()}` }]);

  const selCls = 'rounded-md border border-slate-300 px-2.5 py-1.5 text-sm';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select className={selCls} value={grade} onChange={(e) => setGrade(e.target.value as Grade | 'all')}>
          <option value="all">全級</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>{GRADE_LABEL[g]}</option>
          ))}
        </select>
        <select className={selCls} value={type} onChange={(e) => setType(e.target.value as QuestionType | 'all')}>
          <option value="all">全種別</option>
          {(['journal', 'choice', 'calc'] as QuestionType[]).map((t) => (
            <option key={t} value={t}>{TYPE_LABEL[t]}</option>
          ))}
        </select>
        <input
          className={`${selCls} flex-1 min-w-40`}
          placeholder="問題文・論点で検索"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
        />
        <button
          onClick={() => setEditing(null)}
          className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          ＋ 新規作成
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-3 py-2 font-medium">級</th>
              <th className="px-3 py-2 font-medium">種別</th>
              <th className="px-3 py-2 font-medium">論点</th>
              <th className="px-3 py-2 font-medium">難易度</th>
              <th className="px-3 py-2 font-medium">問題文</th>
              <th className="px-3 py-2 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((q) => (
              <tr key={q.id} className="hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-3 py-2">{GRADE_LABEL[q.grade]}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{TYPE_LABEL[q.type]}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-500">{q.topic}</td>
                <td className="whitespace-nowrap px-3 py-2 text-amber-500">{'★'.repeat(q.difficulty)}</td>
                <td className="max-w-xs truncate px-3 py-2 text-slate-700">{q.body}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <button onClick={() => setEditing(q)} className="text-indigo-600 hover:underline">編集</button>
                  <button onClick={() => duplicate(q)} className="ml-3 text-slate-500 hover:underline">複製</button>
                  <button onClick={() => remove(q.id)} className="ml-3 text-rose-500 hover:underline">削除</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-400">該当する問題がありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-right text-xs text-slate-400">{filtered.length} / {list.length} 件</p>

      {editing !== undefined && (
        <QuestionEditor question={editing} accounts={accounts} onSave={save} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}

// --- 勘定科目管理 ------------------------------------------------------------
function AccountManager({ accounts, onChange }: { accounts: Account[]; onChange: (a: Account[]) => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AccountCategory>('asset');
  const [error, setError] = useState('');

  const add = () => {
    if (!name.trim()) {
      setError('科目名を入力してから追加してください');
      return;
    }
    onChange([
      ...accounts,
      { id: `a-${uid()}`, name: name.trim(), category, grades: [...GRADES] },
    ]);
    setName('');
    setError('');
  };
  const remove = (id: string) => onChange(accounts.filter((a) => a.id !== id));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <input
          className="min-w-40 flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
          placeholder="例: 現金"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
        />
        <select
          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value as AccountCategory)}
        >
          {(Object.keys(CATEGORY_LABEL) as AccountCategory[]).map((c) => (
            <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          ＋ 追加
        </button>
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-3 py-2 font-medium">科目名</th>
              <th className="px-3 py-2 font-medium">区分</th>
              <th className="px-3 py-2 font-medium">対応級</th>
              <th className="px-3 py-2 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accounts.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/70">
                <td className="px-3 py-2 font-medium text-slate-700">{a.name}</td>
                <td className="px-3 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs ${CATEGORY_COLOR[a.category]}`}>{CATEGORY_LABEL[a.category]}</span>
                </td>
                <td className="px-3 py-2 text-slate-500">{a.grades.map((g) => GRADE_LABEL[g]).join('・')}</td>
                <td className="px-3 py-2 text-right">
                  <button type="button" onClick={() => remove(a.id)} className="text-rose-500 hover:underline">削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
