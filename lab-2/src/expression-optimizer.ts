import { Token, TokenType, ValidationError } from './expression-analyzer';
import {
  findTokensInParanthesisLeft,
  findTokensInParanthesisRight,
  tokensToString,
} from './utils';

type OptimizationResult = {
  success: boolean;
  optimizedExpression: Token[];
  optomizationSteps: string[];
  errors: ValidationError[];
};

export class ExpressionOptimizer {
  handleOptimization(expressionTokens: Token[]): OptimizationResult {
    const expressionStr = tokensToString(expressionTokens);

    const result = this.optimize(expressionTokens);

    const optimizedExprStr = tokensToString(result.optimizedExpression);
    const steps = result.optomizationSteps
      .map((step, index) => `${index + 1}. ${step}`)
      .join('\n');
    const errors = result.errors
      .map((error, index) => `${index + 1}. ${error.message}`)
      .join('\n');

    const red = '\x1b[31m';
    const reset = '\x1b[0m';
    const green = '\x1b[32m';

    let log = '\n==========\n';
    if (result.success) {
      log += `${green}Успішно оптимізовано вираз:${reset} ${expressionStr}`;
      log += `\n\nОптимізований вираз: ${optimizedExprStr}`;
      log += steps.length
        ? `\n\nКроки оптимізації:\n${steps}`
        : '\n\nЖодного можливого оптимізаційного кроку не знайдено.\n\n';
    } else {
      log += `${red}Помилка при оптимізації виразу:${reset} ${expressionStr}`;
      log += `\n\nПомилки:\n${errors}`;
      log += `\n\nКроки оптимізації:\n${steps}`;
    }

    log += '\n==========\n';

    console.log(log);

    return result;
  }

  optimize(expressionTokens: Token[]): OptimizationResult {
    const optomizationSteps: string[] = [];
    let optimizedExpression: Token[] = expressionTokens;
    const errors: ValidationError[] = [];

    let optimized = true;

    while (optimized && optimizedExpression.length > 1 && errors.length === 0) {
      optimized = false;

      optimized = this.optimizeUnaryOperatorBeforeZero(
        optimizedExpression,
        optomizationSteps
      );

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
        this.openParentheses(optimizedExpression, optomizationSteps);
    }

    return {
      success: errors.length === 0,
      optimizedExpression,
      optomizationSteps,
      errors,
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

      const isOnlyZeroInParenthesis =
        prevToken?.type === TokenType.PAREN_OPEN &&
        nextToken?.type === TokenType.PAREN_CLOSE;

      if (isSurroundedByAdditionOperators && !isOnlyZeroInParenthesis) {
        const expBefore = tokens.slice();

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
        const expAfter = tokensToString(tokens);

        const green = '\x1b[32m';
        const reset = '\x1b[0m';

        const formattedExpBefore = expBefore.map((token, index) => {
          if (index === i) {
            token.value = `${green}${token.value}${reset}`;
          }
          return token;
        });
        const expBeforeStr = tokensToString(formattedExpBefore);

        steps.push(
          `Оптимізація додавання/віднімання з нулем: ${expBeforeStr} = ${expAfter}`
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
          const tokensInParenthesis = findTokensInParanthesisRight(
            tokens,
            firstMultiplierIndex
          );
          deleteCount = tokensInParenthesis.length + 1;
          deleteFrom = i - deleteCount;
        }

        const expBefore = tokensToString(tokens);

        const removed = tokens.splice(deleteFrom, deleteCount);

        const expAfter = tokensToString(tokens);

        const removedStr = tokensToString(removed.slice(0, -1));

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
          const tokensInParenthesis = findTokensInParanthesisLeft(
            tokens,
            secondOperandIndex
          );
          deleteCount = tokensInParenthesis.length + 1;
        }

        const expBefore = tokensToString(tokens);
        const operation = nextToken?.value === '*' ? 'множення' : 'ділення';

        const removed = tokens.splice(deleteFrom, deleteCount);
        const expAfter = tokensToString(tokens);
        const removedStr = tokensToString(removed.slice(1));

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

      const expBefore = tokens.slice();
      const green = '\x1b[32m';
      const reset = '\x1b[0m';

      if (isMultiplicationOrDivisionByOne) {
        const formattedExpBefore = expBefore.map((token, index) => {
          if (index === i) {
            token.value = `${green}${token.value}${reset}`;
          }
          return token;
        });
        const expBeforeStr = tokensToString(formattedExpBefore);
        const operation = prevToken?.value === '*' ? 'множення' : 'ділення';

        tokens.splice(i - 1, 2);

        const expAfter = tokensToString(tokens);

        steps.push(
          `Оптимізація ${operation} на 1: ${expBeforeStr} = ${expAfter}`
        );

        return true;
      }

      // 1 * (a+b+c) = a+b+c
      const isOneBeforeMultiplication =
        nextToken?.type === TokenType.MULTIPLICATION_OPERATOR &&
        nextToken.value === '*';

      if (isOneBeforeMultiplication) {
        const formattedExpBefore = expBefore.map((token, index) => {
          if (index === i) {
            token.value = `${green}${token.value}${reset}`;
          }
          return token;
        });
        const expBeforeStr = tokensToString(formattedExpBefore);
        tokens.splice(i, 2);

        const expAfter = tokensToString(tokens);

        steps.push(
          `Оптимізація множення 1 на вираз: ${expBeforeStr} = ${expAfter}`
        );

        return true;
      }
    }

    return false;
  }

  private optimizeCalculations(tokens: Token[], steps: string[]): boolean {
    // Пріоритетно обраховуються операції множення та ділення
    return (
      this.optimizeMultiplicationAndDivision(tokens, steps) ||
      this.optimizeAdditionAndSubtraction(tokens, steps)
    );
  }

  private optimizeMultiplicationAndDivision(
    tokens: Token[],
    steps: string[]
  ): boolean {
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type !== TokenType.MULTIPLICATION_OPERATOR) {
        continue;
      }

      const prevToken = tokens[i - 1];
      const nextToken = tokens[i + 1];
      const beforePrevToken = tokens[i - 2];

      if (
        prevToken?.type === TokenType.NUMBER &&
        nextToken?.type === TokenType.NUMBER &&
        !(
          beforePrevToken?.type === TokenType.MULTIPLICATION_OPERATOR &&
          beforePrevToken?.value === '/'
        )
      ) {
        const expBefore = tokensToString(tokens);

        const firstOperand = Number(prevToken.value);
        const secondOperand = Number(nextToken.value);

        const result =
          token.value === '*'
            ? firstOperand * secondOperand
            : firstOperand / secondOperand;

        const operation = token.value === '*' ? 'множення' : 'ділення';

        const removed = tokens.splice(i - 1, 3, {
          type: TokenType.NUMBER,
          value: result.toString(),
          position: prevToken.position,
        });
        const removedStr = tokensToString(removed);

        const expAfter = tokensToString(tokens);

        steps.push(
          `Обрахунок ${operation}: ${removedStr} = ${result} | Повний вираз: ${expBefore} = ${expAfter}`
        );

        return true;
      }
    }

    return false;
  }

  private optimizeAdditionAndSubtraction(
    tokens: Token[],
    steps: string[]
  ): boolean {
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type !== TokenType.ADDITION_OPERATOR) {
        continue;
      }

      const firstOperandToken = tokens[i - 1];
      const secondOperandToken = tokens[i + 1];
      const operationBeforeFirstOperandToken = tokens[i - 2];
      const operationAfterSecondOperandToken = tokens[i + 2];
      const tokenBeforeOperationBeforeFirstOperandToken = tokens[i - 3];

      const firstOperandSign =
        operationBeforeFirstOperandToken?.type === TokenType.ADDITION_OPERATOR
          ? operationBeforeFirstOperandToken.value
          : '+';
      const secondOperandSign = token?.value;

      const canPerformAddition =
        (!operationBeforeFirstOperandToken ||
          operationBeforeFirstOperandToken.type !==
            TokenType.MULTIPLICATION_OPERATOR) &&
        (!operationAfterSecondOperandToken ||
          operationAfterSecondOperandToken.type !==
            TokenType.MULTIPLICATION_OPERATOR);

      const isValidAdditionOfNumbers =
        firstOperandToken?.type === TokenType.NUMBER &&
        secondOperandToken?.type === TokenType.NUMBER;

      const isAdditionOfSameIdentifier =
        firstOperandToken?.type === TokenType.IDENTIFIER &&
        secondOperandToken?.type === TokenType.IDENTIFIER &&
        firstOperandToken.value === secondOperandToken.value &&
        firstOperandSign !== secondOperandSign;

      if (
        canPerformAddition &&
        (isValidAdditionOfNumbers || isAdditionOfSameIdentifier)
      ) {
        const expBefore = tokensToString(tokens);

        const hasSignBefore =
          operationBeforeFirstOperandToken?.type ===
          TokenType.ADDITION_OPERATOR;
        const isSignUnary =
          !tokenBeforeOperationBeforeFirstOperandToken ||
          tokenBeforeOperationBeforeFirstOperandToken?.type ===
            TokenType.PAREN_OPEN;

        let firstOperand;
        let secondOperand;
        let result;

        if (isAdditionOfSameIdentifier) {
          firstOperand =
            firstOperandSign === '-'
              ? `${firstOperandSign}${firstOperandToken.value}`
              : firstOperandToken.value;
          secondOperand = `${secondOperandToken.value}`;
          result = 0;
        } else {
          firstOperand =
            operationBeforeFirstOperandToken?.value === '-'
              ? -Number(firstOperandToken.value)
              : Number(firstOperandToken.value);

          secondOperand = Number(secondOperandToken.value);

          result =
            token.value === '+'
              ? firstOperand + secondOperand
              : firstOperand - secondOperand;
        }

        const operation = token.value === '+' ? 'додавання' : 'віднімання';

        const tokensToAdd: Token[] = [
          {
            type: TokenType.NUMBER,
            value: Math.abs(result).toString(),
            position: firstOperandToken.position,
          },
        ];

        let deleteFrom = i - 1;
        let deleteCount = 3;

        if (!hasSignBefore && result < 0) {
          tokensToAdd.unshift({
            type: TokenType.ADDITION_OPERATOR,
            value: '-',
            position: firstOperandToken.position,
          });

          deleteFrom = i - 1;
          deleteCount = 3;
        }

        if (hasSignBefore && isSignUnary) {
          if (result < 0) {
            tokensToAdd.unshift({
              type: TokenType.ADDITION_OPERATOR,
              value: '-',
              position: firstOperandToken.position,
            });
          }

          deleteFrom = i - 2;
          deleteCount = 4;
        }

        if (hasSignBefore && !isSignUnary) {
          operationBeforeFirstOperandToken.value = result < 0 ? '-' : '+';
          deleteFrom = i - 1;
          deleteCount = 3;
        }

        tokens.splice(deleteFrom, deleteCount, ...tokensToAdd);
        const expAfter = tokensToString(tokens);

        steps.push(
          `Обрахунок ${operation}: ${firstOperand}${token.value}${secondOperand} = ${result} | Повний вираз: ${expBefore} = ${expAfter}`
        );

        return true;
      }
    }

    return false;
  }

  private openParentheses(tokens: Token[], steps: string[]): boolean {
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === TokenType.PAREN_OPEN) {
        const tokensInParenthesis = findTokensInParanthesisLeft(tokens, i);
        const parentStr = tokensToString(tokensInParenthesis);

        const innerTokens = tokensInParenthesis.slice(1, -1);

        if (innerTokens.some((t) => t.type === TokenType.PAREN_OPEN)) {
          continue; // шукаємо найбільш вкладені дужки
        }

        const prevToken = tokens[i - 1];
        const nextToken = tokens[i + tokensInParenthesis.length];

        const operandsCount = innerTokens.filter(
          (t) => t.type === TokenType.NUMBER || t.type === TokenType.IDENTIFIER
        ).length;

        const expBefore = tokensToString(tokens);

        // Обрахунок випадків, коли перед дужками стоїть оператор множення або ділення
        if (prevToken?.type === TokenType.MULTIPLICATION_OPERATOR) {
          if (operandsCount > 1) {
            continue;
          }

          const countOfInnerTokens = innerTokens.length;

          const hasUnarySign =
            countOfInnerTokens === 2 &&
            innerTokens[0].type === TokenType.ADDITION_OPERATOR;

          const singleOperand = hasUnarySign ? innerTokens[1] : innerTokens[0];
          let deleteFrom = i;

          if (hasUnarySign && innerTokens[0].value === '+') {
            innerTokens.shift();
          }

          if (hasUnarySign && innerTokens[0].value === '-') {
            for (
              let prevAdditionOrParenOpenIndex = i - 1;
              prevAdditionOrParenOpenIndex >= 0;
              prevAdditionOrParenOpenIndex--
            ) {
              const prevToken = tokens[prevAdditionOrParenOpenIndex];
              if (prevToken.type === TokenType.ADDITION_OPERATOR) {
                if (
                  prevAdditionOrParenOpenIndex === 0 &&
                  prevToken.value === '-'
                ) {
                  tokens.splice(prevAdditionOrParenOpenIndex, 1);
                  deleteFrom--;
                  break;
                }

                prevToken.value = prevToken.value === '+' ? '-' : '+';
                break;
              }

              if (
                prevToken.type === TokenType.PAREN_OPEN ||
                prevAdditionOrParenOpenIndex === 0
              ) {
                const addToPosition =
                  prevAdditionOrParenOpenIndex === 0
                    ? 0
                    : prevAdditionOrParenOpenIndex + 1;
                tokens.splice(addToPosition, 0, {
                  type: TokenType.ADDITION_OPERATOR,
                  value: '-',
                  position: prevAdditionOrParenOpenIndex,
                });

                deleteFrom++;
                break;
              }
            }
          }

          tokens.splice(deleteFrom, countOfInnerTokens + 2, singleOperand);
          const expAfter = tokensToString(tokens);

          steps.push(
            `Відкрито дужки: ${parentStr} | Вираз ${expBefore} = ${expAfter}`
          );
          return true;
        }

        // Обрахунок випадків, коли перед дужками стоїть оператор віднімання або додавання
        if (
          prevToken?.type === TokenType.ADDITION_OPERATOR &&
          (operandsCount === 1 ||
            nextToken?.type !== TokenType.MULTIPLICATION_OPERATOR)
        ) {
          const isNegative = prevToken?.value === '-';

          if (isNegative) {
            for (const innerToken of innerTokens) {
              if (innerToken.type === TokenType.ADDITION_OPERATOR) {
                innerToken.value = innerToken.value === '+' ? '-' : '+';
              }
            }
          }

          let deleteFrom = i - 1;
          let deleteCount = innerTokens.length + 3;

          const firstInnerToken = innerTokens[0];

          if (firstInnerToken?.type !== TokenType.ADDITION_OPERATOR) {
            deleteFrom = i;
            deleteCount--;
          }

          if (
            deleteFrom === 0 &&
            firstInnerToken?.type === TokenType.ADDITION_OPERATOR &&
            firstInnerToken.value === '+'
          ) {
            innerTokens.shift();
          }

          tokens.splice(deleteFrom, deleteCount, ...innerTokens);

          const expAfter = tokensToString(tokens);

          const operatorStr = isNegative ? '"-" (інвертовано знаки)' : '"+"';
          steps.push(
            `Відкрито дужки після ${operatorStr}: ${parentStr} | Вираз ${expBefore} = ${expAfter}`
          );

          return true;
        }

        // Обрахунок з відсутністю оператора перед дужками
        if (
          !prevToken ||
          (prevToken.type === TokenType.PAREN_OPEN &&
            (!nextToken ||
              nextToken.type !== TokenType.MULTIPLICATION_OPERATOR ||
              operandsCount === 1))
        ) {
          tokens.splice(i, innerTokens.length + 2, ...innerTokens);
          const expAfter = tokensToString(tokens);

          steps.push(
            `Відкрито дужки: ${parentStr} | Вираз ${expBefore} = ${expAfter}`
          );
          return true;
        }
      }
    }

    return false;
  }

  private handleDivisionByZero(
    tokens: Token[],
    errors: ValidationError[]
  ): {
    shouldStop: boolean;
  } {
    const { hasDivisionByZero, index } = this.checkDivisionByZero(tokens);

    if (hasDivisionByZero) {
      const red = '\x1b[31m';
      const reset = '\x1b[0m';

      const highlightedExpression = tokens
        .map((token, i) => {
          if (i === index || i === index! + 1) {
            return `${red}${token.value}${reset}`;
          }
          return token.value;
        })
        .join('');

      const errorMessage = `Виявлено ділення на нуль на позиції ${index} у виразі: ${highlightedExpression}`;

      errors.push({ message: errorMessage, position: index });
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

      const expBefore = tokensToString(tokens);
      tokens.splice(deleteFrom, deleteCount + 1, token);
      const expAfter = tokensToString(tokens);

      optomizationSteps.push(
        `Оптимізація унарного оператора перед нулем: ${expBefore} = ${expAfter} `
      );

      i -= deleteCount;

      isOptimized = true;
    }

    return isOptimized;
  }
}
