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
  INVALID_FRACTIONAL = 'INVALID_FRACTIONAL',
}

export type Token = {
  type: TokenType;
  value: string;
  position: number;
};

// TODO: invalid decimal numbers like 0.1.2 ++
// TODO: invalid identifiers like 1a < error 1 is correct a is not
// TODO: invalid operators like ++ (without parantheses) < error second plus is incorrect
// TODO: invalid parantheses like (a + b => should specify concrete position < check 
// TODO: invalid parantheses like a + b) => should specify concrete position < check

// TODO: should work with -3, +3, but not with + +3, - -3

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
    TokenType.PAREN_OPEN,
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
  tokenize(expression: string, errors: string[] = []): Token[] {
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
            errors.push('Invalid fractional part at position ' + position);
            isValid = false;
          }

          if (pattern.type === TokenType.NUMBER) {
            tokenValue = this.validateNumberToken(tokenValue, position, errors);
          }

          if (isValid && pattern.type !== TokenType.SPACE) {
            tokens.push({ type: pattern.type, value: tokenValue, position });
          }

          position += match[0].length;
          break;
        }
      }

      if (!match) {
        errors.push(`Unexpected token ${remaining[0]} at position ${position}`);
        position++; // @TODO: test
      }
    }

    return tokens;
  }

  validateTokens(tokens: Token[], errors: string[] = []): string[] {
    let state: TokenType = TokenType.START_EXPR;
    const parenStack: Array<{ position: number; value: '(' | ')' }> = [];

    console.log('\n\n Tokens:', tokens, '\n\n');

    if (!tokens.length) {
      errors.push('Empty expression'); // @TODO: change with checking for START TOKEN and its transitions
      return errors;
    }

    this.validateStartToken(tokens[0], errors);

    for (const token of tokens) {
      const expectedNextStates: TokenType[] =
        transitionGraph[state] || ([] as TokenType[]);

      console.log('\n\n Valid next states:', expectedNextStates, '\n\n');

      if (!expectedNextStates.includes(token.type)) {
        errors.push(
          `Unexpected token '${token.value}' at position ${token.position}`
        );
      }

      if (token.type === TokenType.PAREN_OPEN) {
        parenStack.push({ position: token.position, value: '(' });
      }

      if (token.type === TokenType.PAREN_CLOSE) {
        if (parenStack.length === 0 || parenStack.pop()?.value !== '(') {
          errors.push(
            `Unmatched closing parenthesis at position ${token.position}`
          );
        }
      }

      state = token.type;
    }

    if (parenStack.length > 0) {
      for (const paren of parenStack) {
        errors.push(
          `Unmatched opening parenthesis at position ${paren.position}`
        );
      }
    }

    this.validateEndToken(tokens[tokens.length - 1], errors);

    return errors;
  }

  validateNumberToken(
    value: string,
    position: number,
    errors: string[]
  ): string {
    // not many starting 000
    // not many dots

    return '32';
  }

  validateStartToken(startToken: Token, errors: string[]): void {
    if (!transitionGraph[TokenType.START_EXPR]?.includes(startToken.type)) {
      errors.push(
        `Unexpected start token '${startToken.type}' at position ${startToken.position}`
      );
    }
  }

  validateEndToken(lastToken: Token, errors: string[]): void {
    const transitionsForLastToken = transitionGraph[lastToken.type];

    if (!transitionsForLastToken?.includes(TokenType.END_EXPR)) {
      errors.push(
        `Unexpected end token '${lastToken.type}' at position ${lastToken.position}`
      );
    }
  }

  analyzeExpression(expression: string): {
    valid: boolean;
    errors?: string[];
    tokens?: Token[];
  } {
    try {
      const expressionErrors: string[] = [];
      const tokens = this.tokenize(expression, expressionErrors);
      const errors = this.validateTokens(tokens, expressionErrors);

      console.log('\n\n Errors:', errors, '\n\n');

      if (errors.length > 0) {
        return { valid: false, errors };
      } else {
        return { valid: true, tokens };
      }
    } catch (e) {
      console.log('\n\n DEBUGERROR', e, '\n\n');
      throw e;
    }
  }
}

const analyzer = new ExpressionAnalyzer();
const example = 'a ++ (b - 3)';
const result = analyzer.analyzeExpression(example);

console.log(result);
