import { ExpressionAnalyzer } from './expression-analyzer';

const analyzer = new ExpressionAnalyzer();
const example = '5.0 + 12';

const result = analyzer.analyzeExpression(example);
analyzer.logResult(example, result);
