import { ExpressionAnalyzer } from './expression-analyzer';
import { ExpressionOptimizer } from './expression-optimizer';

const analyzer = new ExpressionAnalyzer();
const optimizer = new ExpressionOptimizer();

const example = 'a/0+32 + ((35 / 32 - 12) / 0)';

const result = analyzer.analyzeExpression(example);
if (!result.valid) {
  analyzer.logResult(example, result);
}
const optimizationResult = optimizer.optimize(result.tokens!);
