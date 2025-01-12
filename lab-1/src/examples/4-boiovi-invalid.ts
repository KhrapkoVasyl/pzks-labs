import { expressionAnalyzer } from './index';

const exampleExpressions: string[] = [
  '/a*b**c + m)*a*b + a*c - a*smn(j*k/m + m',
  '(1/a*b*c + m)*a*b + a*c - a*smn*(j*k/m+m)', // fixed - now valid,

  '//(*0)- an*0p(a+b)-1.000.5//6(*f(-b, 1.8-0*(2-6) %1 + (++a)/(6x^2+4x-1) + d/dt',

  '-(-5x((int*))/t - 3.14.15k/(2x^2-5x-1)*y',

  '/.1(2*x^2-5*x+7)-(-i)+ (j++)/0 - )/q + )/',
];

for (const expression of exampleExpressions) {
  console.log('\n\n\n========\n\n\n');
  const result = expressionAnalyzer.analyzeExpression(expression);
  expressionAnalyzer.logResult(expression, result);
}
console.log('\n\n\n');
