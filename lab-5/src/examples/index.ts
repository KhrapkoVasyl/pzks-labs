import { TreeBuilder } from '../tree-builder';
import { ExpressionAnalyzer } from '../expression-analyzer';
import { ExpressionOptimizer } from '../expression-optimizer';
import { ExpressionGrouper } from '../expression-grouper';
import { MatrixSystem, MatrixSystemEvaluator } from '../modeling';

const analyzer = new ExpressionAnalyzer();
const optimizer = new ExpressionOptimizer();
const grouper = new ExpressionGrouper();
const treeBuilder = new TreeBuilder();

export function handleExpressions(expressions: string[]): void {
  for (const expression of expressions) {
    console.log('\n\n ====== ОБРОБКА ВИРАЗУ:', expression, '======\n\n');

    const result = analyzer.analyzeExpression(expression);
    if (!result.valid) {
      analyzer.logResult(expression, result);
      continue;
    }

    const optimizationResult = optimizer.handleOptimization(result.tokens!);
    if (!optimizationResult.success) {
      continue;
    }

    const groupingResult = grouper.handleGroupTokens(
      optimizationResult.optimizedExpression!
    );

    const tree = treeBuilder.handleTree(groupingResult.groupedExpression);

    const parSystem = new MatrixSystem(tree, 5);
    const seqSystem = new MatrixSystem(tree, 1, false);
    parSystem.simulate();
    seqSystem.simulate();

    const evaluator = new MatrixSystemEvaluator(parSystem, seqSystem);
    evaluator.logResults();
  }
}
