import { ExpressionAnalyzer, TokenType } from '../src/expression-analyzer';

describe('Analyze expression', () => {
  let analyzer: ExpressionAnalyzer;

  beforeEach(() => {
    analyzer = new ExpressionAnalyzer();
  });

  describe('Valid simple cases', () => {
    it('should analyze a single positive number', () => {
      const result = analyzer.analyzeExpression('21.17');
      expect(result.valid).toBe(true);
      expect(result.tokens).toEqual([
        { type: TokenType.NUMBER, value: '21.17', position: 0 },
      ]);
    });

    it('should analyze a single negative number', () => {
      const result = analyzer.analyzeExpression('-42.4221');
      expect(result.valid).toBe(true);
      expect(result.tokens).toEqual([
        { type: TokenType.ADDITION_OPERATOR, value: '-', position: 0 },
        { type: TokenType.NUMBER, value: '42.4221', position: 1 },
      ]);
    });

    it('should analyze a single positive number', () => {
      const result = analyzer.analyzeExpression('+3.123');
      expect(result.valid).toBe(true);
      expect(result.tokens).toEqual([
        { type: TokenType.ADDITION_OPERATOR, value: '+', position: 0 },
        { type: TokenType.NUMBER, value: '3.123', position: 1 },
      ]);
    });

    it('should analyze a single identifier with valid dashes', () => {
      const result = analyzer.analyzeExpression('va_r_1');
      expect(result.valid).toBe(true);
      expect(result.tokens).toEqual([
        { type: TokenType.IDENTIFIER, value: 'va_r_1', position: 0 },
      ]);
    });

    it('should analyze a single identifier with a sign', () => {
      const result = analyzer.analyzeExpression('-myVar');
      expect(result.valid).toBe(true);
      expect(result.tokens).toEqual([
        { type: TokenType.ADDITION_OPERATOR, value: '-', position: 0 },
        { type: TokenType.IDENTIFIER, value: 'myVar', position: 1 },
      ]);
    });

    it('should analyze a simple addition expression', () => {
      const result = analyzer.analyzeExpression('32 + 15');
      expect(result.valid).toBe(true);
      expect(result.tokens).toEqual([
        { type: TokenType.NUMBER, value: '32', position: 0 },
        { type: TokenType.ADDITION_OPERATOR, value: '+', position: 3 },
        { type: TokenType.NUMBER, value: '15', position: 5 },
      ]);
    });

    it('should analyze a valid expression with multiple spaces', () => {
      const result = analyzer.analyzeExpression('  42   +    15  ');
      expect(result.valid).toBe(true);
      expect(result.tokens).toEqual([
        { type: TokenType.NUMBER, value: '42', position: 2 },
        { type: TokenType.ADDITION_OPERATOR, value: '+', position: 7 },
        { type: TokenType.NUMBER, value: '15', position: 12 },
      ]);
    });

    it('should analyze an expression with identifiers and mixed operators', () => {
      const result = analyzer.analyzeExpression('a / c * b - 12');
      expect(result.valid).toBe(true);
      expect(result.tokens).toEqual([
        { type: TokenType.IDENTIFIER, value: 'a', position: 0 },
        { type: TokenType.MULTIPLICATION_OPERATOR, value: '/', position: 2 },
        { type: TokenType.IDENTIFIER, value: 'c', position: 4 },
        { type: TokenType.MULTIPLICATION_OPERATOR, value: '*', position: 6 },
        { type: TokenType.IDENTIFIER, value: 'b', position: 8 },
        { type: TokenType.ADDITION_OPERATOR, value: '-', position: 10 },
        { type: TokenType.NUMBER, value: '12', position: 12 },
      ]);
    });

    it('should analyze an expression with parentheses', () => {
      const result = analyzer.analyzeExpression(
        '12 * a + b - (-3) * (21 / a + 4)'
      );
      expect(result.valid).toBe(true);
      expect(result.tokens).toEqual([
        { type: TokenType.NUMBER, value: '12', position: 0 },
        { type: TokenType.MULTIPLICATION_OPERATOR, value: '*', position: 3 },
        { type: TokenType.IDENTIFIER, value: 'a', position: 5 },
        { type: TokenType.ADDITION_OPERATOR, value: '+', position: 7 },
        { type: TokenType.IDENTIFIER, value: 'b', position: 9 },
        { type: TokenType.ADDITION_OPERATOR, value: '-', position: 11 },
        { type: TokenType.PAREN_OPEN, value: '(', position: 13 },
        { type: TokenType.ADDITION_OPERATOR, value: '-', position: 14 },
        { type: TokenType.NUMBER, value: '3', position: 15 },
        { type: TokenType.PAREN_CLOSE, value: ')', position: 16 },
        { type: TokenType.MULTIPLICATION_OPERATOR, value: '*', position: 18 },
        { type: TokenType.PAREN_OPEN, value: '(', position: 20 },
        { type: TokenType.NUMBER, value: '21', position: 21 },
        { type: TokenType.MULTIPLICATION_OPERATOR, value: '/', position: 24 },
        { type: TokenType.IDENTIFIER, value: 'a', position: 26 },
        { type: TokenType.ADDITION_OPERATOR, value: '+', position: 28 },
        { type: TokenType.NUMBER, value: '4', position: 30 },
        { type: TokenType.PAREN_CLOSE, value: ')', position: 31 },
      ]);
    });

    it('should analyze an expression with deeply nested parentheses', () => {
      const result = analyzer.analyzeExpression(
        '12 * (a+ (b -  (c*(d / (e+f )))))'
      );
      expect(result.valid).toBe(true);
      expect(result.tokens).toEqual([
        { type: TokenType.NUMBER, value: '12', position: 0 },
        { type: TokenType.MULTIPLICATION_OPERATOR, value: '*', position: 3 },
        { type: TokenType.PAREN_OPEN, value: '(', position: 5 },
        { type: TokenType.IDENTIFIER, value: 'a', position: 6 },
        { type: TokenType.ADDITION_OPERATOR, value: '+', position: 7 },
        { type: TokenType.PAREN_OPEN, value: '(', position: 9 },
        { type: TokenType.IDENTIFIER, value: 'b', position: 10 },
        { type: TokenType.ADDITION_OPERATOR, value: '-', position: 12 },
        { type: TokenType.PAREN_OPEN, value: '(', position: 15 },
        { type: TokenType.IDENTIFIER, value: 'c', position: 16 },
        { type: TokenType.MULTIPLICATION_OPERATOR, value: '*', position: 17 },
        { type: TokenType.PAREN_OPEN, value: '(', position: 18 },
        { type: TokenType.IDENTIFIER, value: 'd', position: 19 },
        { type: TokenType.MULTIPLICATION_OPERATOR, value: '/', position: 21 },
        { type: TokenType.PAREN_OPEN, value: '(', position: 23 },
        { type: TokenType.IDENTIFIER, value: 'e', position: 24 },
        { type: TokenType.ADDITION_OPERATOR, value: '+', position: 25 },
        { type: TokenType.IDENTIFIER, value: 'f', position: 26 },
        { type: TokenType.PAREN_CLOSE, value: ')', position: 28 },
        { type: TokenType.PAREN_CLOSE, value: ')', position: 29 },
        { type: TokenType.PAREN_CLOSE, value: ')', position: 30 },
        { type: TokenType.PAREN_CLOSE, value: ')', position: 31 },
        { type: TokenType.PAREN_CLOSE, value: ')', position: 32 },
      ]);
    });
  });

  describe('Invalid simple cases', () => {
    // empty expression

    it('should handle an empty expression', () => {
      const result = analyzer.analyzeExpression('');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        { message: 'Заданий вираз не містить валідних токенів' },
      ]);
    });

    it('should handle an expression with only spaces tokens', () => {
      const result = analyzer.analyzeExpression('              ');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        { message: 'Заданий вираз не містить валідних токенів' },
      ]);
    });

    // unsupported characters

    it('should handle invalid tokens with unsupported character', () => {
      const result = analyzer.analyzeExpression('-12 &');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        { message: "Неочікуваний токен '&' на позиції 4", position: 4 },
      ]);
    });

    it('should handle invalid tokens with unsupported characters', () => {
      const result = analyzer.analyzeExpression('42 # $');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        { message: "Неочікуваний токен '#' на позиції 3", position: 3 },
        { message: "Неочікуваний токен '$' на позиції 5", position: 5 },
      ]);
    });

    it('should handle a string with only invalid characters', () => {
      const result = analyzer.analyzeExpression('@#$%^&!');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        { message: 'Заданий вираз не містить валідних токенів' },
        { message: "Неочікуваний токен '@' на позиції 0", position: 0 },
        { message: "Неочікуваний токен '#' на позиції 1", position: 1 },
        { message: "Неочікуваний токен '$' на позиції 2", position: 2 },
        { message: "Неочікуваний токен '%' на позиції 3", position: 3 },
        { message: "Неочікуваний токен '^' на позиції 4", position: 4 },
        { message: "Неочікуваний токен '&' на позиції 5", position: 5 },
        { message: "Неочікуваний токен '!' на позиції 6", position: 6 },
      ]);
    });

    // start tokens

    it('should detect an invalid start token: division operator', () => {
      const result = analyzer.analyzeExpression('/ 32');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: `Неочікуваний початковий токен '/' на позиції 0. Очікувані типи токенів: NUMBER, IDENTIFIER, PAREN_OPEN, ADDITION_OPERATOR.`,
          position: 0,
        },
      ]);
    });

    it('should detect an invalid start token: multiplication operator', () => {
      const result = analyzer.analyzeExpression('* a - b');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: `Неочікуваний початковий токен '*' на позиції 0. Очікувані типи токенів: NUMBER, IDENTIFIER, PAREN_OPEN, ADDITION_OPERATOR.`,
          position: 0,
        },
      ]);
    });

    // end tokens

    it('should detect an invalid end token: addition operator', () => {
      const result = analyzer.analyzeExpression('32 + 15 +');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: `Неочікуваний кінець виразу після оператора '+' на позиції 8`,
          position: 8,
        },
      ]);
    });

    it('should detect an invalid end token: open parenthesis', () => {
      const result = analyzer.analyzeExpression('32 + (');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: `Відкриваюча дужка не має парної закриваючої на позиції 5`,
          position: 5,
        },
        {
          message: `Неочікуваний кінець виразу після оператора '(' на позиції 5`,
          position: 5,
        },
      ]);
    });

    // numbers and fractions
    it('should detect invalid fractional number part with multiple decimal points', () => {
      const result = analyzer.analyzeExpression('-32.436.92');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: "Невалідна десяткова частина '.92' на позиції 7",
          position: 7,
        },
      ]);
    });

    it('should detect many invalid fractional parts with multiple decimal points', () => {
      const result = analyzer.analyzeExpression('172.0.0.1');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: "Невалідна десяткова частина '.0' на позиції 5",
          position: 5,
        },
        {
          message: "Невалідна десяткова частина '.1' на позиції 7",
          position: 7,
        },
      ]);
    });

    // transitions
    it('should detect invalid transition: number followed by a number', () => {
      const result = analyzer.analyzeExpression('32 42');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: `Неочікуваний токен '42' після токену '32' на позиції 3. Очікувані типи токенів: ADDITION_OPERATOR, MULTIPLICATION_OPERATOR, PAREN_CLOSE, END_EXPR`,
          position: 3,
        },
      ]);
    });

    it('should detect invalid transition: multiplication operator before closing parenthesis', () => {
      const result = analyzer.analyzeExpression('(32 * )');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: `Неочікуваний токен ')' після токену '*' на позиції 6. Очікувані типи токенів: NUMBER, IDENTIFIER, PAREN_OPEN`,
          position: 6,
        },
      ]);
    });

    it('should detect invalid transition: number after identifier', () => {
      const result = analyzer.analyzeExpression('var1 42');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: `Неочікуваний токен '42' після токену 'var1' на позиції 5. Очікувані типи токенів: ADDITION_OPERATOR, MULTIPLICATION_OPERATOR, PAREN_CLOSE, END_EXPR`,
          position: 5,
        },
      ]);
    });

    it('should detect invalid transition: multiple following operators', () => {
      const result = analyzer.analyzeExpression('3 * - + 42');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: `Неочікуваний токен '-' після токену '*' на позиції 4. Очікувані типи токенів: NUMBER, IDENTIFIER, PAREN_OPEN`,
          position: 4,
        },
        {
          message: `Неочікуваний токен '+' після токену '-' на позиції 6. Очікувані типи токенів: NUMBER, IDENTIFIER, PAREN_OPEN`,
          position: 6,
        },
      ]);
    });

    it('should detect invalid transition: multiple following operators (case 2)', () => {
      const result = analyzer.analyzeExpression('32 + / 42');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: `Неочікуваний токен '/' після токену '+' на позиції 5. Очікувані типи токенів: NUMBER, IDENTIFIER, PAREN_OPEN`,
          position: 5,
        },
      ]);
    });

    it('should detect unmatched parentheses and invalid transitions (case 1)', () => {
      const result = analyzer.analyzeExpression('3) (32 + 42)');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: `Закриваюча дужка не має парної відкриваючої на позиції 1`,
          position: 1,
        },
        {
          message: `Неочікуваний токен '(' після токену ')' на позиції 3. Очікувані типи токенів: ADDITION_OPERATOR, MULTIPLICATION_OPERATOR, PAREN_CLOSE, END_EXPR`,
          position: 3,
        },
      ]);
    });

    // identifiers

    it('should detect invalid identifiers with invalid first special characters', () => {
      const result = analyzer.analyzeExpression('@identifier');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        { message: "Неочікуваний токен '@' на позиції 0", position: 0 },
      ]);
    });

    it('should detect unexpected identifier after a number', () => {
      const result = analyzer.analyzeExpression('-2ab');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: `Неочікуваний токен 'ab' після токену '2' на позиції 2. Очікувані типи токенів: ADDITION_OPERATOR, MULTIPLICATION_OPERATOR, PAREN_CLOSE, END_EXPR`,
          position: 2,
        },
      ]);
    });

    // parantheses
    it('should detect an unmatched open parenthesis', () => {
      const result = analyzer.analyzeExpression('(32 + 15');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: `Відкриваюча дужка не має парної закриваючої на позиції 0`,
          position: 0,
        },
      ]);
    });

    it('should detect multiple unmatched open parentheses', () => {
      const result = analyzer.analyzeExpression('((32 + 15');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: `Відкриваюча дужка не має парної закриваючої на позиції 0`,
          position: 0,
        },
        {
          message: `Відкриваюча дужка не має парної закриваючої на позиції 1`,
          position: 1,
        },
      ]);
    });

    it('should detect an unmatched close parenthesis', () => {
      const result = analyzer.analyzeExpression('32 + 15)');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: `Закриваюча дужка не має парної відкриваючої на позиції 7`,
          position: 7,
        },
      ]);
    });

    it('should detect multiple unmatched close parentheses', () => {
      const result = analyzer.analyzeExpression('32 + 15))');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: `Закриваюча дужка не має парної відкриваючої на позиції 7`,
          position: 7,
        },
        {
          message: `Закриваюча дужка не має парної відкриваючої на позиції 8`,
          position: 8,
        },
      ]);
    });
  });

  describe('Valid complex cases', () => {
    it('should validate a complex expression (case 1)', () => {
      const result = analyzer.analyzeExpression(
        '-(-5*x+((-var1) + exp) / t - 3.14  / k/(2*x-5*x-1)*y) - A / (N*(i+1)+j)'
      );
      expect(result.valid).toBe(true);
    });

    it('should validate a complex expression (case 2)', () => {
      const result = analyzer.analyzeExpression(
        '(-0)- an *0+p/(a+b)-1.000/6*f+(-b + 1.8-0*(2-6) -1 + (+a) / (6*x+4-x-1) + d/dt*4-ht)'
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('Invalid complex cases', () => {
    it('should validate a complex invalid expression (case 1)', () => {
      const result = analyzer.analyzeExpression(
        'x + var1 + var_2 + _var_3 + var#4 + var!5 + 6var_ + $7 + ?8'
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: `Неочікуваний токен '#' на позиції 31`,
          position: 31,
        },
        {
          message: `Неочікуваний токен '4' після токену 'var' на позиції 32. Очікувані типи токенів: ADDITION_OPERATOR, MULTIPLICATION_OPERATOR, PAREN_CLOSE, END_EXPR`,
          position: 32,
        },
        {
          message: `Неочікуваний токен '!' на позиції 39`,
          position: 39,
        },
        {
          message: `Неочікуваний токен '5' після токену 'var' на позиції 40. Очікувані типи токенів: ADDITION_OPERATOR, MULTIPLICATION_OPERATOR, PAREN_CLOSE, END_EXPR`,
          position: 40,
        },
        {
          message: `Неочікуваний токен 'var_' після токену '6' на позиції 45. Очікувані типи токенів: ADDITION_OPERATOR, MULTIPLICATION_OPERATOR, PAREN_CLOSE, END_EXPR`,
          position: 45,
        },
        {
          message: `Неочікуваний токен '$' на позиції 52`,
          position: 52,
        },
        {
          message: `Неочікуваний токен '?' на позиції 57`,
          position: 57,
        },
      ]);
    });

    it('shoushould validate a complex invalid expression (case 2)', () => {
      const result = analyzer.analyzeExpression(
        '0.71/0.72.3 + .3 + 127.0.0.1*8. + 6.07ab - 9f.89hgt'
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        {
          message: `Невалідна десяткова частина '.3' на позиції 9`,
          position: 9,
        },
        {
          message: `Невалідна десяткова частина '.3' на позиції 14`,
          position: 14,
        },
        {
          message: `Неочікуваний токен '+' після токену '+' на позиції 17. Очікувані типи токенів: NUMBER, IDENTIFIER, PAREN_OPEN`,
          position: 17,
        },
        {
          message: `Невалідна десяткова частина '.0' на позиції 24`,
          position: 24,
        },
        {
          message: `Невалідна десяткова частина '.1' на позиції 26`,
          position: 26,
        },
        {
          message: `Неочікуваний токен '.' на позиції 30`,
          position: 30,
        },
        {
          message: `Неочікуваний токен 'ab' після токену '6.07' на позиції 38. Очікувані типи токенів: ADDITION_OPERATOR, MULTIPLICATION_OPERATOR, PAREN_CLOSE, END_EXPR`,
          position: 38,
        },
        {
          message: `Неочікуваний токен 'f' після токену '9' на позиції 44. Очікувані типи токенів: ADDITION_OPERATOR, MULTIPLICATION_OPERATOR, PAREN_CLOSE, END_EXPR`,
          position: 44,
        },
        {
          message: `Невалідна десяткова частина '.89' на позиції 45`,
          position: 45,
        },
        {
          message: `Неочікуваний токен 'hgt' після токену 'f' на позиції 48. Очікувані типи токенів: ADDITION_OPERATOR, MULTIPLICATION_OPERATOR, PAREN_CLOSE, END_EXPR`,
          position: 48,
        },
      ]);
    });
  });
});
