import { useState } from 'react';
import { QuizApp } from '@/features/quiz/QuizApp';
import { AdminApp } from '@/features/admin/AdminApp';

export default function App() {
  const [page, setPage] = useState<'quiz' | 'admin'>('quiz');

  return (
    <div className="min-h-full bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">
            簿
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">簿記クイズ</h1>
            <p className="text-xs text-slate-400">
              {page === 'quiz' ? '問題を解く' : '問題を管理'}
            </p>
          </div>
          <div className="ml-auto flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setPage('quiz')}
              className={`rounded-md px-3 py-1 font-medium ${
                page === 'quiz' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              問題を解く
            </button>
            <button
              type="button"
              onClick={() => setPage('admin')}
              className={`rounded-md px-3 py-1 font-medium ${
                page === 'admin' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              問題を管理
            </button>
          </div>
        </div>
      </header>

      {page === 'quiz' ? <QuizApp /> : <AdminApp />}
    </div>
  );
}
