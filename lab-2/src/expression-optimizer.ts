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
    const errors: ValidationError[] = [];

    // zeros ()
    // ones
    // identifiers a-a, a/a
    // calculations
    // parantesis
    // grouping with balancing
    // tree

    let optimized = true;

    while (optimized && optimizedExpression.length > 1 && errors.length === 0) {
      console.log(
        '\n\nOptimized expression:',
        this.tokensToString(optimizedExpression),
        '\n\n'
      );
      optimized = false;

      optimized = this.optimizeUnaryOperatorBeforeZero(
        optimizedExpression,
        optomizationSteps
      ); // (-0)-32 = 0-32

      const { shouldStop } = this.handleDivisionByZero(
        optimizedExpression,
        errors
      );

      if (shouldStop) {
        break;
      }

      optimized =
        optimized ||
        this.optimizeZeros(optimizedExpression, optomizationSteps) ||
        this.optimizeOnes(optimizedExpression, optomizationSteps) ||
        this.optimizeCalculations(optimizedExpression, optomizationSteps) ||
        this.openParenthesis(optimizedExpression, optomizationSteps);
    }

    console.log(
      'Finnaly optimized expression:',
      this.tokensToString(optimizedExpression)
    );
    console.log('Optimization steps:', optomizationSteps);
    console.log('Optimization erros:', errors);

    // (-1+3)+12+(-0)-32

    return {
      success: true,
      optimizedExpression: optimizedExpression,
      optomizationSteps,
      errors: [],
    };
  }

  private optimizeZeros(tokens: Token[], steps: string[]): boolean {
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type !== TokenType.NUMBER || Number(token.value) !== 0) {
        continue;
      }

      const prevToken = tokens[i - 1];
      const nextToken = tokens[i + 1];

      // a-0+b = a+b
      const isSurroundedByAdditionOperators =
        (!prevToken ||
          prevToken.type === TokenType.ADDITION_OPERATOR ||
          prevToken.type === TokenType.PAREN_OPEN) &&
        (!nextToken ||
          nextToken.type === TokenType.ADDITION_OPERATOR ||
          nextToken.type === TokenType.PAREN_CLOSE);

      if (isSurroundedByAdditionOperators) {
        const expBefore = this.tokensToString(tokens);

        let deleteCount = 1;
        let deleteFrom = i;

        // remove operation before 0
        if (prevToken && prevToken.type === TokenType.ADDITION_OPERATOR) {
          deleteCount++;
          deleteFrom--;
        }

        // remove unary "+" after 0
        if (
          !prevToken ||
          (prevToken.type === TokenType.PAREN_OPEN &&
            nextToken?.type === TokenType.ADDITION_OPERATOR &&
            nextToken.value === '+')
        ) {
          deleteCount++;
        }

        tokens.splice(deleteFrom, deleteCount);
        const expAfter = this.tokensToString(tokens);

        steps.push(
          `Оптимізація додавання/віднімання з нулем: ${expBefore} = ${expAfter}`
        );

        return true;
      }

      // a + b*0 = a + 0
      const isMultiplicationByZero =
        prevToken?.type === TokenType.MULTIPLICATION_OPERATOR &&
        prevToken?.value === '*';

      if (isMultiplicationByZero) {
        let deleteCount = 2;
        const firstMultiplierIndex = i - 2;
        let deleteFrom = firstMultiplierIndex;
        const firstMultiplier = tokens[firstMultiplierIndex];

        if (firstMultiplier?.type === TokenType.PAREN_CLOSE) {
          const tokensInParenthesis = this.findTokensInParanthesisRight(
            tokens,
            firstMultiplierIndex
          );
          deleteCount = tokensInParenthesis.length + 1;
          deleteFrom = i - deleteCount;
        }

        const expBefore = this.tokensToString(tokens);

        const removed = tokens.splice(deleteFrom, deleteCount);

        const expAfter = this.tokensToString(tokens);

        const removedStr = this.tokensToString(removed.slice(0, -1));

        steps.push(
          `Оптимізація множення ${removedStr} на 0: ${expBefore} = ${expAfter}`
        );

        return true;
      }

      // b + 0*c = b + 0; b + 0/c = b + 0
      const isZeroMultiplicationOrDivision =
        nextToken?.type === TokenType.MULTIPLICATION_OPERATOR;

      if (isZeroMultiplicationOrDivision) {
        let deleteCount = 2;
        const secondOperandIndex = i + 2;
        let deleteFrom = i + 1;

        const secondOperand = tokens[secondOperandIndex];

        if (secondOperand?.type === TokenType.PAREN_OPEN) {
          const tokensInParenthesis = this.findTokensInParanthesisLeft(
            tokens,
            secondOperandIndex
          );
          deleteCount = tokensInParenthesis.length + 1;
        }

        const expBefore = this.tokensToString(tokens);
        const operation = nextToken?.value === '*' ? 'множення' : 'ділення';

        const removed = tokens.splice(deleteFrom, deleteCount);
        const expAfter = this.tokensToString(tokens);
        const removedStr = this.tokensToString(removed.slice(1));

        steps.push(
          `Оптимізація ${operation} 0 на ${removedStr}: ${expBefore} = ${expAfter}`
        );

        return true;
      }

      //
    }

    return false;
  }

  private optimizeOnes(tokens: Token[], steps: string[]): boolean {
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type !== TokenType.NUMBER || Number(token.value) !== 1) {
        continue;
      }

      const prevToken = tokens[i - 1];
      const nextToken = tokens[i + 1];

      // a * 1 = a;  a / 1 = a
      const isMultiplicationOrDivisionByOne =
        prevToken?.type === TokenType.MULTIPLICATION_OPERATOR &&
        (prevToken?.value === '*' || prevToken?.value === '/');

      if (isMultiplicationOrDivisionByOne) {
        const expBefore = this.tokensToString(tokens);
        const operation = prevToken?.value === '*' ? 'множення' : 'ділення';

        tokens.splice(i - 1, 2);

        const expAfter = this.tokensToString(tokens);

        steps.push(`Оптимізація ${operation} на 1: ${expBefore} = ${expAfter}`);

        return true;
      }

      // 1 * (a+b+c) = a+b+c
      const isOneBeforeMultiplication =
        nextToken?.type === TokenType.MULTIPLICATION_OPERATOR &&
        nextToken.value === '*';

      if (isOneBeforeMultiplication) {
        const expBefore = this.tokensToString(tokens);

        tokens.splice(i, 2);

        const expAfter = this.tokensToString(tokens);

        steps.push(
          `Оптимізація множення 1 на вираз: ${expBefore} = ${expAfter}`
        );

        return true;
      }
    }

    return false;
  }

  private optimizeCalculations(tokens: Token[], steps: string[]): boolean {
    let isOptimized = false;

    return isOptimized;
  }

  private openParenthesis(tokens: Token[], steps: string[]): boolean {
    let isOptimized = false;

    return isOptimized;
  }

  private handleDivisionByZero(
    tokens: Token[],
    errors: ValidationError[]
  ): {
    shouldStop: boolean;
  } {
    const { hasDivisionByZero, index } = this.checkDivisionByZero(tokens);

    if (hasDivisionByZero) {
      errors.push({ message: 'Division by zero', position: index });
      return { shouldStop: true };
    }

    return { shouldStop: false };
  }

  private checkDivisionByZero(tokens: Token[]): {
    hasDivisionByZero: boolean;
    index?: number;
  } {
    const index = tokens.findIndex((token, index) => {
      const isDivision =
        token.type === TokenType.MULTIPLICATION_OPERATOR && token.value === '/';

      if (!isDivision) {
        return false;
      }

      const nextToken = tokens[index + 1];
      const isNextTokenZero =
        nextToken.type === TokenType.NUMBER && Number(nextToken.value) === 0;

      return isNextTokenZero;
    });

    return index >= 0
      ? { hasDivisionByZero: true, index: index }
      : { hasDivisionByZero: false };
  }

  private optimizeUnaryOperatorBeforeZero(
    tokens: Token[],
    optomizationSteps: string[]
  ): boolean {
    let isOptimized = false;

    let i = 0;

    while (tokens[i]) {
      const token = tokens[i];
      const prevToken = tokens[i - 1];
      const tokenBeforeUnary = tokens[i - 2];

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

      const tokenAfterZero = tokens[i + 1];

      const shouldOpenParen =
        tokenBeforeUnary?.type === TokenType.PAREN_OPEN &&
        tokenAfterZero?.type === TokenType.PAREN_CLOSE;

      if (shouldOpenParen) {
        deleteCount = 3;
        deleteFrom = i - 2;
      }

      const expBefore = this.tokensToString(tokens);
      tokens.splice(deleteFrom, deleteCount + 1, token);
      const expAfter = this.tokensToString(tokens);

      optomizationSteps.push(
        `Оптимізація унарного оператора перед нулем: ${expBefore} = ${expAfter} `
      );

      i -= deleteCount;

      isOptimized = true;
    }

    return isOptimized;
  }

  public tokensToString(tokens: Token[]): string {
    return tokens.map((token) => token.value).join('');
  }

  private findTokensInParanthesisRight(
    tokens: Token[],
    closingParenthesisIndex: number
  ): Token[] {
    const result: Token[] = [];
    let openParensCount = 0;

    for (let i = closingParenthesisIndex; i >= 0; i--) {
      const token = tokens[i];
      result.unshift(token);

      if (token.type === TokenType.PAREN_CLOSE) {
        openParensCount++;
      } else if (token.type === TokenType.PAREN_OPEN) {
        openParensCount--;

        if (openParensCount === 0) {
          return result;
        }
      }
    }

    throw new Error(
      `Відповідна відкриваюча дужка не знайдена для закриваючої на індексі ${closingParenthesisIndex}. Вираз ${this.tokensToString(
        tokens
      )}`
    );
  }

  private findTokensInParanthesisLeft(
    tokens: Token[],
    openingParenthesisIndex: number
  ): Token[] {
    const result: Token[] = [];
    let openParensCount = 0;

    for (let i = openingParenthesisIndex; i < tokens.length; i++) {
      const token = tokens[i];
      result.push(token);

      if (token.type === TokenType.PAREN_OPEN) {
        openParensCount++;
      } else if (token.type === TokenType.PAREN_CLOSE) {
        openParensCount--;

        if (openParensCount === 0) {
          return result;
        }
      }
    }

    throw new Error(
      `Відповідна закриваюча дужка не знайдена для відкриваючої на індексі ${openingParenthesisIndex}. Вираз ${this.tokensToString(
        tokens
      )}`
    );
  }
}
