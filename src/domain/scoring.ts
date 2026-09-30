// 採点。仕訳は並び順を見ない。借方・貸方で「科目と金額」が同じなら正解。

import type {
  Answer,
  ChoiceQuestion,
  GradeResult,
  JournalLine,
  JournalQuestion,
  CalcQuestion,
  Question,
} from './types';

function toCountMap(keys: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const k of keys) map.set(k, (map.get(k) ?? 0) + 1);
  return map;
}

function mapsEqual(a: Map<string, number>, b: Map<string, number>): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) if (b.get(k) !== v) return false;
  return true;
}

const journalKey = (l: JournalLine) => `${l.side}|${l.accountId}|${l.amount}`;

// 仕訳が正解か（順番は関係ない）
export function isJournalCorrect(correct: JournalLine[], submitted: JournalLine[]): boolean {
  return mapsEqual(toCountMap(correct.map(journalKey)), toCountMap(submitted.map(journalKey)));
}

// 借方と貸方の合計が同じか
export function sumBySide(lines: JournalLine[]): { debit: number; credit: number; balanced: boolean } {
  const debit = lines.filter((l) => l.side === 'debit').reduce((s, l) => s + (l.amount || 0), 0);
  const credit = lines.filter((l) => l.side === 'credit').reduce((s, l) => s + (l.amount || 0), 0);
  return { debit, credit, balanced: debit === credit && debit > 0 };
}

function isChoiceCorrect(q: ChoiceQuestion, choiceIds: string[]): boolean {
  const correct = new Set(q.choices.filter((c) => c.isCorrect).map((c) => c.id));
  const submitted = new Set(choiceIds);
  if (correct.size !== submitted.size) return false;
  for (const id of correct) if (!submitted.has(id)) return false;
  return true;
}

function isCalcCorrect(q: CalcQuestion, value: number): boolean {
  return Math.abs(value - q.expectedValue) <= q.tolerance;
}

function correctAnswerOf(q: Question): Answer {
  switch (q.type) {
    case 'journal':
      return { type: 'journal', lines: (q as JournalQuestion).correct };
    case 'choice':
      return { type: 'choice', choiceIds: q.choices.filter((c) => c.isCorrect).map((c) => c.id) };
    case 'calc':
      return { type: 'calc', value: q.expectedValue };
  }
}

// 問題の種類ごとに採点する
export function gradeQuestion(q: Question, answer: Answer): GradeResult {
  let isCorrect = false;
  if (q.type === 'journal' && answer.type === 'journal') {
    isCorrect = isJournalCorrect(q.correct, answer.lines);
  } else if (q.type === 'choice' && answer.type === 'choice') {
    isCorrect = isChoiceCorrect(q, answer.choiceIds);
  } else if (q.type === 'calc' && answer.type === 'calc') {
    isCorrect = isCalcCorrect(q, answer.value);
  }
  return {
    isCorrect,
    score: isCorrect ? 1 : 0,
    explanation: q.explanation,
    correctAnswer: correctAnswerOf(q),
  };
}
