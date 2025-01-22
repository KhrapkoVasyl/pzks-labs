import { Token, TokenType } from '../expression-analyzer';

export function tokensToString(tokens: Token[]): string {
  return tokens.map((token) => token.value).join('');
}

export function findTokensInParanthesisLeft(
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
    `Відповідна закриваюча дужка не знайдена для відкриваючої на індексі ${openingParenthesisIndex}. Вираз ${tokensToString(
      tokens
    )}`
  );
}

export function findTokensInParanthesisRight(
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
    `Відповідна відкриваюча дужка не знайдена для закриваючої на індексі ${closingParenthesisIndex}. Вираз ${tokensToString(
      tokens
    )}`
  );
}

export function roundToTwoDecimalPlaces(value: number): number {
  return Math.round(value * 100) / 100;
}
