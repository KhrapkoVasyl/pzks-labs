import { expressionAnalyzer } from './index';

const exampleExpressions: string[] = [
  'a^b$c - d#h + q%t + !b&(z|t)',

  'x + var1 + var_2 + _var_3 + var#4 + var!5 + 6var_ + $7 + ?8',

  '0.71/0.72.3 + .3 + 127.0.0.1*8. + 6.07ab - 9f.89hgt',

  ')a+b( -(g+h)(g-k))*()) + (-b(t-2*x*(5) + A',
  'a+b -((g+h)*(g-k))*(+0) + (-b*(t-2*x*(5))) + A', // fixed - now valid

  '2(t) - f2(t) + g()/h(2, )*func(-t/q, f(4-t), -(x+2)*(y-2))',
  '2*t - f2*t + g/h * func', // functions are not supported
];

for (const expression of exampleExpressions) {
  console.log('\n\n\n========\n\n\n');
  const result = expressionAnalyzer.analyzeExpression(expression);
  expressionAnalyzer.logResult(expression, result);
}
console.log('\n\n\n');
