import { Token, TokenType, ValidationError } from './expression-analyzer';

export class ExpressionOptimizer {
  optimize(expressionTokens: Token[]): {
    success: boolean;
    optimizedExpression: Token[];
    optomizationSteps: string[];
    errors: ValidationError[];
  } {
    const optomizationSteps: string[] = [];
    let optimizedExpression: Token[] = expressionTokens;
    let optimized = true;

    while (optimized) {
      const { shouldStop, error } =
        this.handleDivisionByZero(optimizedExpression);

      if (shouldStop) {
        const success = false;
        const errors = [error!];
        return { success, optimizedExpression, optomizationSteps, errors };
      }

      optimized = false;
      optimized = optimized || this.optimizeZeros(optimizedExpression);
      optimized = optimized || this.optimizeCalculations(optimizedExpression);
    }

    return {
      success: true,
      optimizedExpression: optimizedExpression,
      optomizationSteps,
      errors: [],
    };
  }

  private handleDivisionByZero(expressionTokens: Token[]): {
    shouldStop: boolean;
    error?: ValidationError;
  } {
    const { hasDivisionByZero, index } =
      this.checkDivisionByZero(expressionTokens);

    if (hasDivisionByZero) {
      console.log('Division by zero');
      return {
        shouldStop: true,
        error: { message: 'Division by zero', position: index },
      };
    }

    return { shouldStop: false };
  }

  private checkDivisionByZero(expressionTokens: Token[]): {
    hasDivisionByZero: boolean;
    index?: number;
  } {
    const index = expressionTokens.findIndex((token, index) => {
      const isDivision =
        token.type === TokenType.MULTIPLICATION_OPERATOR && token.value === '/';

      if (!isDivision) {
        return false;
      }

      const nextToken = expressionTokens[index + 1];
      const isNextTokenZero =
        nextToken.type === TokenType.NUMBER && nextToken.value === '0';

      return isNextTokenZero;
    });

    return index >= 0
      ? { hasDivisionByZero: true, index: index }
      : { hasDivisionByZero: false };
  }

  private optimizeZeros(expressionTokens: Token[]): boolean {
    console.log('Optimizing zeros');
    return false;
  }

  private optimizeCalculations(expressionTokens: Token[]): boolean {
    console.log('Optimizing division');
    return false;
  }
}
