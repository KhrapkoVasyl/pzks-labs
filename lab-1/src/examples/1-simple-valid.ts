import { expressionAnalyzer } from './index';

// simple valid
const exampleExpressions: string[] = [
  '32.12 + 52.623',
  '    cc / (32-b)',
  '-myVar_123',
  '12 * (a+ (b -  (c*(d / (e+f )))))',
  '12.32 * a + b - (-3) * (21 / a + 4)',
  'b + (c - 32 * q / kt + ((a - 3) * 2) + (32 / (41 - 0 + _customVariable)) / 4)',
];

for (const expression of exampleExpressions) {
  console.log('\n\n\n========\n\n\n');
  const result = expressionAnalyzer.analyzeExpression(expression);
  expressionAnalyzer.logResult(expression, result);
}
console.log('\n\n\n');
