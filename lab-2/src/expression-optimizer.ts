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

    this.optimizeUnaryOperatorBeforeZero(
      optimizedExpression,
      optomizationSteps
    ); // (-0)-32 = 0-32

    // zeros ()
    // ones
    // identifiers a-a, a/a
    // calculations
    // parantesis
    // grouping with balancing
    // tree

    while (optimized) {
      optimized = false;
    }

    console.log('Optimization steps:', optomizationSteps);

    // (-1+3)+12+(-0)-32

    return {
      success: true,
      optimizedExpression: optimizedExpression,
      optomizationSteps,
      errors: [],
    };
  }

  private optimizeUnaryOperatorBeforeZero(
    expressionTokens: Token[],
    optomizationSteps: string[]
  ): boolean {
    let isOptimized = false;

    let i = 0;

    while (expressionTokens[i]) {
      const token = expressionTokens[i];
      const prevToken = expressionTokens[i - 1];
      const tokenBeforeUnary = expressionTokens[i - 2];

      const shouldSkip =
        token.type !== TokenType.NUMBER ||
        Number(token.value) !== 0 ||
        prevToken?.type !== TokenType.ADDITION_OPERATOR ||
        ![TokenType.PAREN_OPEN, undefined].includes(tokenBeforeUnary?.type);

      if (shouldSkip) {
        i++;
        continue;
      }

      let deleteCount = 1;
      let deleteFrom = i - 1;

      const tokenAfterZero = expressionTokens[i + 1];

      const shouldOpenParen =
        tokenBeforeUnary?.type === TokenType.PAREN_OPEN &&
        tokenAfterZero?.type === TokenType.PAREN_CLOSE;

      if (shouldOpenParen) {
        deleteCount = 3;
        deleteFrom = i - 2;
      }

      const expBefore = this.tokensToString(expressionTokens);
      expressionTokens.splice(deleteFrom, deleteCount + 1, token);
      const expAfter = this.tokensToString(expressionTokens);

      optomizationSteps.push(
        `Оптимізація унарного оператора перед нулем: ${expBefore} = ${expAfter} `
      );

      i -= deleteCount;

      isOptimized = true;
    }

    return isOptimized;
  }

  private optimizeZeros(expressionTokens: Token[], errors: string[]): boolean {
    console.log('Optimizing zeros');
    return true;
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
        nextToken.type === TokenType.NUMBER && Number(nextToken.value) === 0;

      return isNextTokenZero;
    });

    return index >= 0
      ? { hasDivisionByZero: true, index: index }
      : { hasDivisionByZero: false };
  }

  public tokensToString(tokens: Token[]): string {
    return tokens.map((token) => token.value).join('');
  }
}
