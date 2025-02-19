export enum TokenType {
  SPACE = 'SPACE', // ' ', '\t', '\n'
  NUMBER = 'NUMBER', // 32, -1, 4.482
  IDENTIFIER = 'IDENTIFIER', // a, b, var1, _myVar
  ADDITION_OPERATOR = 'ADDITION_OPERATOR', // +, -
  MULTIPLICATION_OPERATOR = 'MULTIPLICATION_OPERATOR', // *, /
  PAREN_OPEN = 'PAREN_OPEN', // (
  PAREN_CLOSE = 'PAREN_CLOSE', // )
  START_EXPR = 'START_EXPR', // Початок виразу
  END_EXPR = 'END_EXPR', // Кінець виразу

  // INVALID tokens
  INVALID_FRACTIONAL = 'INVALID_FRACTIONAL', // '.123', '123.123.123'
}

export type Token = {
  type: TokenType;
  value: string;
  position: number;
};

export type ValidationError = {
  message: string;
  position?: number;
};

export type AnalysisResult = {
  valid: boolean;
  tokens?: Token[];
  errors?: ValidationError[];
};

export const tokenPatterns: {
  type: TokenType;
  regex: RegExp;
}[] = [
  { type: TokenType.SPACE, regex: /^\s/ },
  { type: TokenType.NUMBER, regex: /^\d+(\.\d+)?/ },
  { type: TokenType.IDENTIFIER, regex: /^[a-zA-Z_][a-zA-Z_\d]*/ },
  { type: TokenType.ADDITION_OPERATOR, regex: /^[+\-]/ },
  { type: TokenType.MULTIPLICATION_OPERATOR, regex: /^[*/]/ },
  { type: TokenType.PAREN_OPEN, regex: /^\(/ },
  { type: TokenType.PAREN_CLOSE, regex: /^\)/ },

  // INVALID tokens patterns
  { type: TokenType.INVALID_FRACTIONAL, regex: /^\.\d+/ },
];

export const transitionGraph: Partial<Record<TokenType, TokenType[]>> = {
  START_EXPR: [
    TokenType.NUMBER,
    TokenType.IDENTIFIER,
    TokenType.PAREN_OPEN,
    TokenType.ADDITION_OPERATOR,
  ],
  NUMBER: [
    TokenType.ADDITION_OPERATOR,
    TokenType.MULTIPLICATION_OPERATOR,
    TokenType.PAREN_CLOSE,
    TokenType.END_EXPR,
  ],
  IDENTIFIER: [
    TokenType.ADDITION_OPERATOR,
    TokenType.MULTIPLICATION_OPERATOR,
    TokenType.PAREN_CLOSE,
    TokenType.END_EXPR,
  ],
  ADDITION_OPERATOR: [
    TokenType.NUMBER,
    TokenType.IDENTIFIER,
    TokenType.PAREN_OPEN,
  ],
  MULTIPLICATION_OPERATOR: [
    TokenType.NUMBER,
    TokenType.IDENTIFIER,
    TokenType.PAREN_OPEN,
  ],
  PAREN_OPEN: [
    TokenType.ADDITION_OPERATOR,
    TokenType.NUMBER,
    TokenType.IDENTIFIER,
    TokenType.PAREN_OPEN,
  ],
  PAREN_CLOSE: [
    TokenType.ADDITION_OPERATOR,
    TokenType.MULTIPLICATION_OPERATOR,
    TokenType.PAREN_CLOSE,
    TokenType.END_EXPR,
  ],
};

export class ExpressionAnalyzer {
  tokenize(expression: string, errors: ValidationError[] = []): Token[] {
    const tokens: Token[] = [];
    let position = 0;

    while (position < expression.length) {
      const remaining = expression.slice(position);
      let match = null;

      for (const pattern of tokenPatterns) {
        match = remaining.match(pattern.regex);

        if (match) {
          let tokenValue = match[0];
          let isValid = true;

          if (pattern.type === TokenType.INVALID_FRACTIONAL) {
            errors.push({
              message: `Невалідна десяткова частина '${tokenValue}' на позиції ${position}`,
              position,
            });

            isValid = false;
          }

          if (isValid && pattern.type !== TokenType.SPACE) {
            tokens.push({ type: pattern.type, value: tokenValue, position });
          }

          position += match[0].length;
          break;
        }
      }

      if (!match) {
        errors.push({
          message: `Неочікуваний токен '${remaining[0]}' на позиції ${position}`,
          position,
        });
        position++;
      }
    }

    return tokens;
  }

  validateTokens(
    tokens: Token[],
    errors: ValidationError[] = []
  ): ValidationError[] {
    const parenStack: Array<{ position: number; value: '(' | ')' }> = [];

    if (!tokens.length) {
      errors.push({ message: 'Заданий вираз не містить валідних токенів' });
      return errors;
    }

    let prevToken: Token | undefined = undefined;
    this.validateStartToken(tokens[0], errors);

    for (const token of tokens) {
      if (prevToken) {
        const expectedNextStates: TokenType[] =
          transitionGraph[prevToken.type] || ([] as TokenType[]);

        if (!expectedNextStates.includes(token.type)) {
          const expectedStr = transitionGraph[prevToken.type]
            ?.join(', ')
            .toString();
          errors.push({
            message:
              `Неочікуваний токен '${token.value}' після токену '${prevToken.value}' на позиції ${token.position}. ` +
              `Очікувані типи токенів: ${expectedStr}`,
            position: token.position,
          });
        }
      }

      if (token.type === TokenType.PAREN_OPEN) {
        parenStack.push({ position: token.position, value: '(' });
      }

      if (token.type === TokenType.PAREN_CLOSE) {
        if (parenStack.length === 0 || parenStack.pop()?.value !== '(') {
          errors.push({
            message: `Закриваюча дужка не має парної відкриваючої на позиції ${token.position}`,
            position: token.position,
          });
        }
      }

      prevToken = token;
    }

    if (parenStack.length > 0) {
      for (const paren of parenStack) {
        errors.push({
          message: `Відкриваюча дужка не має парної закриваючої на позиції ${paren.position}`,
          position: paren.position,
        });
      }
    }

    this.validateEndToken(prevToken!, errors);

    return errors;
  }

  validateStartToken(startToken: Token, errors: ValidationError[]): void {
    if (!transitionGraph[TokenType.START_EXPR]?.includes(startToken.type)) {
      const expectedStartTokens = transitionGraph[TokenType.START_EXPR];
      const expectedStartTokensString = expectedStartTokens
        ?.join(', ')
        .toString();

      errors.push({
        message:
          `Неочікуваний початковий токен '${startToken.value}' на позиції ${startToken.position}. ` +
          `Очікувані типи токенів: ${expectedStartTokensString}.`,
        position: startToken.position,
      });
    }
  }

  validateEndToken(lastToken: Token, errors: ValidationError[]): void {
    const transitionsForLastToken = transitionGraph[lastToken.type];

    if (!transitionsForLastToken?.includes(TokenType.END_EXPR)) {
      errors.push({
        message: `Неочікуваний кінець виразу після оператора '${lastToken.value}' на позиції ${lastToken.position}`,
        position: lastToken.position,
      });
    }
  }

  analyzeExpression(expression: string): AnalysisResult {
    const expressionErrors: ValidationError[] = [];
    const tokens = this.tokenize(expression, expressionErrors);
    const errors = this.validateTokens(tokens, expressionErrors).sort(
      (a, b) => (a?.position ?? -1) - (b?.position ?? -1)
    );

    return errors.length > 0
      ? { valid: false, errors }
      : { valid: true, tokens };
  }

  logResult(expression: string, result: AnalysisResult): void {
    return result.valid
      ? this.logValidResult(expression, result)
      : this.logInvalidResult(expression, result);
  }

  logValidResult(expression: string, result: AnalysisResult): void {
    const green = '\x1b[32m';
    const reset = '\x1b[0m';

    console.log(`Заданий вираз '${expression}' — ${green}валідний${reset}`);
    const tokens = result
      .tokens!.map((token) => `${token.type}('${token.value}')`)
      .join(' ');
    console.log(`Токени: ${tokens}`);
  }

  logInvalidResult(expression: string, result: AnalysisResult): void {
    const red = '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`Задано ${red}невалідний${reset} вираз:`);

    const coloredExpression = expression.split('');
    const errorMarkers = Array(expression.length).fill(' ');
    const errorMessages: string[] = [];

    for (const error of result.errors!) {
      if (error.position !== undefined) {
        coloredExpression[error.position] = `${red}${
          coloredExpression[error.position]
        }${reset}`;
        errorMarkers[error.position] = '^';
      }
      errorMessages.push(`${red}- ${error.message}${reset}`);
    }

    const expressionStr = coloredExpression.join('');

    console.log(`${expressionStr}`);
    console.log(`${red}${errorMarkers.join('')}${reset}`);
    console.log(errorMessages.join('\n'));
  }
}
