import { Token, TokenType, ValidationError } from './expression-analyzer';
import { findTokensInParanthesisLeft, tokensToString } from './utils';

type GroupingResult = {
  groupedExpression: Token[];
  groupingSteps: string[];
};

export class ExpressionGrouper {
  handleGroupTokens(expressionTokens: Token[]): GroupingResult {
    const result = this.groupTokens(expressionTokens);

    const { groupedExpression, groupingSteps } = result;

    const steps = result.groupingSteps
      .map((step, index) => `${index + 1}. ${step}`)
      .join('\n');
    const expression = tokensToString(groupedExpression);

    let log = `Згруповано вираз: ${expression}`;
    // log += steps.length
    //   ? `\n\nКроки групування:\n${steps}`
    //   : '\n\nЖодного можливого кроку групування не знайдено.\n\n';

    console.log(log);

    return result;
  }

  groupTokens(expressionTokens: Token[], steps: string[] = []): GroupingResult {
    if (expressionTokens.length === 1 || expressionTokens.length === 2) {
      return { groupedExpression: expressionTokens, groupingSteps: steps };
    }

    this.groupParentheses(expressionTokens, steps);

    let isGrouped = true;

    while (isGrouped) {
      isGrouped = this.groupMultiplicationAndDivision(expressionTokens, steps);
    }

    isGrouped = true;

    while (isGrouped) {
      isGrouped = this.groupAdditionAndSubtraction(expressionTokens, steps);
    }

    return {
      groupedExpression: expressionTokens,
      groupingSteps: steps,
    };
  }

  private groupParentheses(tokens: Token[], steps: string[]): boolean {
    let groupingDone = false;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === TokenType.PAREN_OPEN) {
        const group = findTokensInParanthesisLeft(tokens, i);

        const innerTokens = group.slice(1, -1);
        this.groupTokens(innerTokens, steps);

        tokens.splice(i, group.length, ...innerTokens);

        i -= group.length - innerTokens.length - 1;

        groupingDone = true;
      }
    }

    return groupingDone;
  }

  private groupMultiplicationAndDivision(
    tokens: Token[],
    steps: string[]
  ): boolean {
    let groupingDone = false;

    let hasUnaryOperator = false;
    let shouldReturnUnaryOperator = true;
    let useUnaryOperator = false;

    let firstOperand: Token[] | undefined;
    let firstOperandIndex: number | undefined;

    let operatorBefore: Token | undefined;
    let operatorBetween: Token | undefined;
    let unaryOperator: Token | undefined;

    if (tokens[0].type === TokenType.ADDITION_OPERATOR) {
      unaryOperator = tokens[0];
      tokens.splice(0, 1);

      hasUnaryOperator = true;
      useUnaryOperator = true;
    }

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      const isUngroupedOperand =
        token.type === TokenType.NUMBER || token.type === TokenType.IDENTIFIER;
      const isGrouppedOperand = token.type === TokenType.PAREN_OPEN;

      if (isUngroupedOperand || isGrouppedOperand) {
        const operandTokens = isUngroupedOperand
          ? [...((useUnaryOperator ? [unaryOperator] : []) as Token[]), token]
          : findTokensInParanthesisLeft(tokens, i);

        const shift = useUnaryOperator ? 1 : 0;
        useUnaryOperator = false;

        if (!firstOperand) {
          firstOperand = operandTokens;
          firstOperandIndex = i;

          i += operandTokens.length - shift - 1;
        } else {
          const secondOperand = operandTokens;
          const secondOperandIndex = i;

          const expBefore = tokensToString(tokens);

          const beforeGroupping = tokensToString([
            ...((operatorBefore ? [operatorBefore] : []) as Token[]),
            ...firstOperand!,
            operatorBetween!,
            ...secondOperand!,
          ]);

          if (operatorBefore?.value === '/' && operatorBetween?.value === '/') {
            operatorBetween.value = '*';
          }

          const groupedTokens: Token[] = [
            {
              type: TokenType.PAREN_OPEN,
              value: '(',
              position: i,
            },
            ...firstOperand,
            operatorBetween!,
            ...secondOperand,
            {
              type: TokenType.PAREN_CLOSE,
              value: ')',
              position: secondOperand[secondOperand.length - 1].position + 1,
            },
          ];

          const deleteFrom = firstOperandIndex!;
          const deleteCount =
            secondOperandIndex + secondOperand.length - deleteFrom;

          tokens.splice(deleteFrom, deleteCount, ...groupedTokens);

          i = deleteFrom + groupedTokens.length - 1;

          const expAfter = tokensToString(tokens);
          const afterGroupping = tokensToString([
            ...((operatorBefore ? [operatorBefore] : []) as Token[]),
            ...groupedTokens,
          ]);

          steps.push(
            `Групування: ${beforeGroupping} = ${afterGroupping} | Повний вираз: ${expBefore} = ${expAfter}`
          );

          groupingDone = true;

          firstOperand = undefined;
          firstOperand = undefined;
          operatorBefore = undefined;
          operatorBetween = undefined;
        }
      } else if (token.type === TokenType.ADDITION_OPERATOR) {
        firstOperand = undefined;
        operatorBefore = token;

        if (!groupingDone) {
          shouldReturnUnaryOperator = true;
        }
      } else if (token.type === TokenType.MULTIPLICATION_OPERATOR) {
        !firstOperand ? (operatorBefore = token) : (operatorBetween = token);
      }
    }

    if (hasUnaryOperator && shouldReturnUnaryOperator) {
      tokens.unshift(unaryOperator!);
    }

    return groupingDone;
  }

  private groupAdditionAndSubtraction(
    tokens: Token[],
    steps: string[]
  ): boolean {
    let groupingDone = false;

    let firstOperand: Token[] | undefined;
    let firstOperandIndex: number | undefined;

    let operatorBefore: Token | undefined;
    let operatorBetween: Token | undefined;
    let unaryOperator: Token | undefined;

    if (tokens[0].type === TokenType.ADDITION_OPERATOR) {
      unaryOperator = tokens[0];
      tokens.splice(0, 1);
    }

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      const isUngroupedOperand =
        token.type === TokenType.NUMBER || token.type === TokenType.IDENTIFIER;
      const isGrouppedOperand = token.type === TokenType.PAREN_OPEN;

      if (isUngroupedOperand || isGrouppedOperand) {
        const operandTokens = isUngroupedOperand
          ? [...((unaryOperator ? [unaryOperator] : []) as Token[]), token]
          : findTokensInParanthesisLeft(tokens, i);

        const shift = unaryOperator ? 1 : 0;
        unaryOperator = undefined;

        if (!firstOperand) {
          firstOperand = operandTokens;
          firstOperandIndex = i;
          i += operandTokens.length - shift - 1;
        } else {
          const secondOperand = operandTokens;
          const secondOperandIndex = i;

          const expBefore = tokensToString(tokens);
          const beforeGroupping = tokensToString([
            ...((operatorBefore ? [operatorBefore] : []) as Token[]),
            ...firstOperand!,
            operatorBetween!,
            ...secondOperand!,
          ]);

          if (operatorBefore?.value === '-') {
            operatorBetween!.value = operatorBetween?.value === '+' ? '-' : '+';
          }

          const groupedTokens: Token[] = [
            {
              type: TokenType.PAREN_OPEN,
              value: '(',
              position: i,
            },
            ...firstOperand,
            operatorBetween!,
            ...secondOperand,
            {
              type: TokenType.PAREN_CLOSE,
              value: ')',
              position: secondOperand[secondOperand.length - 1].position + 1,
            },
          ];

          const deleteFrom = firstOperandIndex!;
          const deleteCount =
            secondOperandIndex + secondOperand.length - deleteFrom;

          tokens.splice(deleteFrom, deleteCount, ...groupedTokens);

          i = deleteFrom + groupedTokens.length - 1;

          const expAfter = tokensToString(tokens);
          const afterGroupping = tokensToString([
            ...((operatorBefore ? [operatorBefore] : []) as Token[]),
            ...groupedTokens,
          ]);

          steps.push(
            `Групування: ${beforeGroupping} = ${afterGroupping} | Повний вираз: ${expBefore} = ${expAfter}`
          );

          groupingDone = true;

          firstOperand = undefined;
          firstOperand = undefined;
          operatorBefore = undefined;
          operatorBetween = undefined;
        }
      } else if (token.type === TokenType.ADDITION_OPERATOR) {
        !firstOperand ? (operatorBefore = token) : (operatorBetween = token);
      }
    }

    return groupingDone;
  }
}
