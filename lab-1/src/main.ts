import { ExpressionAnalyzer } from './expression-analyzer';

const analyzer = new ExpressionAnalyzer();
const example = 'a + (b - 3.23.23)';
const result = analyzer.analyzeExpression(example);

console.log(result);
