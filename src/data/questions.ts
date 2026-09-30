import type { Question } from '@/domain/types';

// 練習用の問題。あとでサーバーに移す予定。
export const questions: Question[] = [
  {
    id: 'c1',
    type: 'journal',
    grade: 'grade_3',
    topic: '仕入・売上',
    difficulty: 1,
    body: '商品 10,000 円を仕入れ、代金は現金で支払った。',
    explanation: '仕入は費用の増加（借方）、現金は資産の減少（貸方）。',
    correct: [
      { side: 'debit', accountId: 'a05', amount: 10000 },
      { side: 'credit', accountId: 'a01', amount: 10000 },
    ],
  },
  {
    id: 'c2',
    type: 'journal',
    grade: 'grade_3',
    topic: '仕入・売上',
    difficulty: 1,
    body: '商品を 20,000 円で売り上げ、代金は掛けとした。',
    explanation: '売掛金は資産の増加（借方）、売上は収益の増加（貸方）。',
    correct: [
      { side: 'debit', accountId: 'a02', amount: 20000 },
      { side: 'credit', accountId: 'a04', amount: 20000 },
    ],
  },
  {
    id: 'c3',
    type: 'choice',
    grade: 'grade_3',
    topic: '現金預金',
    difficulty: 1,
    body: '資産の増加は、仕訳のどちら側（借方・貸方）に記入するか。',
    explanation: '資産の増加は借方に記入する。',
    choices: [
      { id: 'c3-1', label: 'ア', body: '借方', isCorrect: true },
      { id: 'c3-2', label: 'イ', body: '貸方', isCorrect: false },
    ],
  },
  {
    id: 'c4',
    type: 'calc',
    grade: 'grade_3',
    topic: '仕入・売上',
    difficulty: 2,
    body: '売上 100,000 円、売上原価 60,000 円のとき、売上総利益はいくらか（円）。',
    explanation: '売上総利益 = 売上 − 売上原価 = 100,000 − 60,000 = 40,000 円。',
    expectedValue: 40000,
    tolerance: 0,
    unit: '円',
  },

  // --- 2級 ---
  {
    id: 'c5',
    type: 'journal',
    grade: 'grade_2',
    topic: '固定資産',
    difficulty: 2,
    body: '備品 300,000 円を購入し、代金は月末に支払うこととした。',
    explanation: '備品は資産の増加（借方）。代金後払いは商品売買以外なので未払金（負債の増加・貸方）で処理する。',
    correct: [
      { side: 'debit', accountId: 'a09', amount: 300000 },
      { side: 'credit', accountId: 'a10', amount: 300000 },
    ],
  },
  {
    id: 'c6',
    type: 'journal',
    grade: 'grade_2',
    topic: '減価償却',
    difficulty: 3,
    body: '決算にあたり、当期首に取得した備品（取得原価 300,000 円）について、定額法（耐用年数5年・残存価額ゼロ・間接法）で減価償却を行う。',
    explanation: '減価償却費 = 300,000 ÷ 5 = 60,000 円。間接法なので相手勘定は減価償却累計額。',
    correct: [
      { side: 'debit', accountId: 'a11', amount: 60000 },
      { side: 'credit', accountId: 'a12', amount: 60000 },
    ],
  },
  {
    id: 'c7',
    type: 'choice',
    grade: 'grade_2',
    topic: '固定資産',
    difficulty: 2,
    body: '固定資産の機能を維持するための支出（通常の修繕）は、次のどちらに区分されるか。',
    explanation: '機能を維持する支出は収益的支出として、その期の費用（修繕費）に計上する。資本的支出は資産計上する。',
    choices: [
      { id: 'c7-1', label: 'ア', body: '収益的支出（費用として処理）', isCorrect: true },
      { id: 'c7-2', label: 'イ', body: '資本的支出（資産として計上）', isCorrect: false },
    ],
  },

  // --- 1級 ---
  {
    id: 'c8',
    type: 'journal',
    grade: 'grade_1',
    topic: '有価証券',
    difficulty: 4,
    body: 'その他有価証券（取得原価 800,000 円）を、決算にあたり時価 900,000 円に評価替えする（全部純資産直入法、税効果は考慮しない）。',
    explanation: '評価差額 = 900,000 − 800,000 = 100,000 円。全部純資産直入法では、評価差額をその他有価証券評価差額金（純資産）で処理する。',
    correct: [
      { side: 'debit', accountId: 'a13', amount: 100000 },
      { side: 'credit', accountId: 'a14', amount: 100000 },
    ],
  },
  {
    id: 'c9',
    type: 'calc',
    grade: 'grade_1',
    topic: '社債',
    difficulty: 3,
    body: '額面総額 1,000,000 円の社債を、額面 100 円につき 98 円で発行した。払込金額（発行価額）はいくらか（円）。',
    explanation: '発行価額 = 1,000,000 × 98 ÷ 100 = 980,000 円。',
    expectedValue: 980000,
    tolerance: 0,
    unit: '円',
  },
];
