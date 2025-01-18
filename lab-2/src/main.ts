import { ASTBuilder } from './ast-builder';
import { ExpressionAnalyzer } from './expression-analyzer';
import { ExpressionOptimizer } from './expression-optimizer';

const analyzer = new ExpressionAnalyzer();
const optimizer = new ExpressionOptimizer();
const treeBuilder = new ASTBuilder();

const examples = [
  '15/3',
  // '10-9-8-7-6-5-4-3-2-1',
  // '64-(32-16)-8-(4-2-1)',
  // '-(-i)/1.0 + 0 - 0*k*h + 2 - 4.8/2 + 1*e/2',
  // 'a*2/0 + b/(b+b*0-1*b) - 1/(c*2*4.76*(1-2+1))',
];

for (const example of examples) {
  const result = analyzer.analyzeExpression(example);
  if (!result.valid) {
    analyzer.logResult(example, result);
  }

  console.log('Tokens:', optimizer.tokensToString(result.tokens!));

  const optimizationResult = optimizer.handleOptimization(result.tokens!);
}
