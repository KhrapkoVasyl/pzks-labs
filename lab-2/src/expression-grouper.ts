import { Token, TokenType, ValidationError } from './expression-analyzer';
import { findTokensInParanthesisLeft, tokensToString } from './utils';

type GroupingResult = {
  groupedExpression: Token[];
  groupingSteps: string[];
};

export class ExpressionGrouper {
  groupTokens(expressionTokens: Token[]): GroupingResult {
    const groupingSteps: string[] = [];

    let isGrouped = true;

    while (isGrouped) {
      isGrouped = this.groupMultiplicationAndDivision(
        expressionTokens,
        groupingSteps
      );
    }

    isGrouped = true;

    while (isGrouped) {
      isGrouped = this.groupAdditionAndSubtraction(
        expressionTokens,
        groupingSteps
      );
    }

    return {
      groupedExpression: expressionTokens,
      groupingSteps,
    };
  }

  private groupMultiplicationAndDivision(
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
        unaryOperator = undefined;

        if (!firstOperand) {
          firstOperand = operandTokens;
          firstOperandIndex = i;
          i += operandTokens.length - 1;
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
            `Групування: ${beforeGroupping} = ${afterGroupping} | Повний вираз: ${expBefore} = ${expAfter}}`
          );

          groupingDone = true;

          firstOperand = undefined;
          firstOperand = undefined;
          operatorBefore = undefined;
          operatorBetween = undefined;
        }
      } else if (token.type === TokenType.ADDITION_OPERATOR) {
        if (firstOperand) {
          firstOperand = undefined;
        }

        operatorBefore = token;
      } else if (token.type === TokenType.MULTIPLICATION_OPERATOR) {
        !firstOperand ? (operatorBefore = token) : (operatorBetween = token);
      }
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
        unaryOperator = undefined;

        if (!firstOperand) {
          firstOperand = operandTokens;
          firstOperandIndex = i;
          i += operandTokens.length - 1;
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
            `Групування: ${beforeGroupping} = ${afterGroupping} | Повний вираз: ${expBefore} = ${expAfter}}`
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
