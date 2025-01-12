import { expressionAnalyzer } from './index';

// simple invalid
const exampleExpressions: string[] = [
  // вирази з неправильними символами
  '-17.23 & a',

  // вирази без токенів або без жодного валідного токену
  '     ',
  '$%!@ #',

  // неправильні початкові токени
  '/ a',
  ') 12.32 - 11',

  // неправильні кінцеві токени
  '12.32 - 11 +',
  'var1 - var2 + (',

  // зайва десяткова крапка
  '31 + 127.0.0.1',

  // невалідні ідентифікатори
  '31var',
  'ident@fier',

  // невідповідні відкриваючі та закриваючі дужки
  'a + (b - 12 + (31 - b)',
  '12.32 + c - b)',
  '31 - 12 + ) - (',

  // неправильна послідовність токенів
  'a b c',
  '74 89.23',
  '12.32 + * 11',
  'var1 / - + var2',
];

for (const expression of exampleExpressions) {
  console.log('\n\n\n========\n\n\n');
  const result = expressionAnalyzer.analyzeExpression(expression);
  expressionAnalyzer.logResult(expression, result);
}
console.log('\n\n\n');
