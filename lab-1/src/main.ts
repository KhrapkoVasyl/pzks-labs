import { ExpressionAnalyzer } from './expression-analyzer';

const analyzer = new ExpressionAnalyzer();
const example =
  '*101*1#(t-q)(t+q)//dt - (int*)f(8t, -(k/h)A[i+6.]), exp(), ))(t-k*8.00.1/.';

const result = analyzer.analyzeExpression(example);
analyzer.logResult(example, result);
