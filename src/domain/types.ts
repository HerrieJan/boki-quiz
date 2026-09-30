// 問題や解答で使う型

export type Grade = 'grade_3' | 'grade_2' | 'grade_1';
export type QuestionType = 'journal' | 'choice' | 'calc';
export type JournalSide = 'debit' | 'credit';
export type AccountCategory = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id: string;
  name: string;
  category: AccountCategory;
  grades: Grade[];
}

export interface JournalLine {
  side: JournalSide;
  accountId: string;
  amount: number;
}

interface BaseQuestion {
  id: string;
  grade: Grade;
  topic: string;
  difficulty: number; // 1..5
  body: string;
  explanation: string;
}

export interface JournalQuestion extends BaseQuestion {
  type: 'journal';
  correct: JournalLine[];
}

export interface Choice {
  id: string;
  label?: string;
  body: string;
  isCorrect: boolean;
}

export interface ChoiceQuestion extends BaseQuestion {
  type: 'choice';
  choices: Choice[];
}

export interface CalcQuestion extends BaseQuestion {
  type: 'calc';
  expectedValue: number;
  tolerance: number;
  unit?: string;
}

export type Question = JournalQuestion | ChoiceQuestion | CalcQuestion;

// ユーザーが送った答え
export type Answer =
  | { type: 'journal'; lines: JournalLine[] }
  | { type: 'choice'; choiceIds: string[] }
  | { type: 'calc'; value: number };

export interface GradeResult {
  isCorrect: boolean;
  score: number; // 0..1（レベルA では 0 or 1）
  explanation: string;
  correctAnswer: Answer;
}

export const GRADE_LABEL: Record<Grade, string> = {
  grade_3: '3級',
  grade_2: '2級',
  grade_1: '1級',
};
