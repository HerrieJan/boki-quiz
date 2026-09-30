import type { Account } from '@/domain/types';

// 勘定科目の一覧
export const accounts: Account[] = [
  { id: 'a01', name: '現金', category: 'asset', grades: ['grade_3', 'grade_2', 'grade_1'] },
  { id: 'a02', name: '売掛金', category: 'asset', grades: ['grade_3', 'grade_2', 'grade_1'] },
  { id: 'a03', name: '買掛金', category: 'liability', grades: ['grade_3', 'grade_2', 'grade_1'] },
  { id: 'a04', name: '売上', category: 'revenue', grades: ['grade_3', 'grade_2', 'grade_1'] },
  { id: 'a05', name: '仕入', category: 'expense', grades: ['grade_3', 'grade_2', 'grade_1'] },
  { id: 'a06', name: '資本金', category: 'equity', grades: ['grade_3', 'grade_2', 'grade_1'] },
  { id: 'a07', name: '当座預金', category: 'asset', grades: ['grade_3', 'grade_2', 'grade_1'] },
  { id: 'a08', name: '給料', category: 'expense', grades: ['grade_3', 'grade_2', 'grade_1'] },
  // 2級以上
  { id: 'a09', name: '備品', category: 'asset', grades: ['grade_3', 'grade_2', 'grade_1'] },
  { id: 'a10', name: '未払金', category: 'liability', grades: ['grade_3', 'grade_2', 'grade_1'] },
  { id: 'a11', name: '減価償却費', category: 'expense', grades: ['grade_3', 'grade_2', 'grade_1'] },
  { id: 'a12', name: '減価償却累計額', category: 'asset', grades: ['grade_2', 'grade_1'] },
  // 1級
  { id: 'a13', name: 'その他有価証券', category: 'asset', grades: ['grade_1'] },
  { id: 'a14', name: 'その他有価証券評価差額金', category: 'equity', grades: ['grade_1'] },
];

export const accountMap = new Map(accounts.map((a) => [a.id, a]));
export const accountName = (id: string) => accountMap.get(id)?.name ?? '(不明)';
