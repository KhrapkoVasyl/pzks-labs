import { ExpressionAnalyzer } from './expression-analyzer';

const analyzer = new ExpressionAnalyzer();
const example = '';
const result = analyzer.analyzeExpression(example);
analyzer.logResult(example, result);
