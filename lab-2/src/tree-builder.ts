import { Token, TokenType, ValidationError } from './expression-analyzer';

interface TreeNode {
  value: string;
  left?: TreeNode;
  right?: TreeNode;
  unarySign?: string;
}

export class TreeBuilder {
  precedence: { [key: string]: number } = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
  };

  toPostfix(tokens: Token[]): Token[] {
    const output: Token[] = [];
    const operators: Token[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (
        token.type === TokenType.NUMBER ||
        token.type === TokenType.IDENTIFIER
      ) {
        output.push(token);
      } else if (token.type === TokenType.PAREN_OPEN) {
        operators.push(token);
      } else if (token.type === TokenType.PAREN_CLOSE) {
        while (
          operators.length &&
          operators[operators.length - 1].type !== TokenType.PAREN_OPEN
        ) {
          output.push(operators.pop()!);
        }
        operators.pop();
      } else {
        while (
          operators.length &&
          this.precedence[operators[operators.length - 1].value] >=
            this.precedence[token.value]
        ) {
          output.push(operators.pop()!);
        }

        operators.push(token);
      }
    }

    while (operators.length) {
      output.push(operators.pop()!);
    }

    return output;
  }

  build(postfixTokens: Token[]): TreeNode | null {
    const stack: TreeNode[] = [];

    for (const token of postfixTokens) {
      if (
        token.type === TokenType.NUMBER ||
        token.type === TokenType.IDENTIFIER
      ) {
        stack.push({ value: token.value });
      } else if (
        token.type === TokenType.ADDITION_OPERATOR ||
        token.type === TokenType.MULTIPLICATION_OPERATOR
      ) {
        let right = stack.pop();
        let left = stack.pop();
        if (!left && right) {
          left = { value: '0' };
        }

        if (left && !right) {
          right = { value: '0' };
        }

        if (!left || !right) {
          throw new Error('Невалідний вираз для побудови дереа');
        }

        stack.push({
          value: token.value,
          left,
          right,
        });
      } else {
        throw new Error(
          `Невалідний тип токена для побудови дерева: ${token.type}`
        );
      }
    }

    if (stack.length !== 1) {
      throw new Error('Невалідний вираз для побудови дереа');
    }

    return stack[0];
  }

  logTree(
    node: TreeNode | null,
    prefix: string = '',
    isLeft: boolean = true
  ): void {
    if (!node) return;

    const blue = '\x1b[34m';
    const reset = '\x1b[0m';

    const value = ['+', '-', '*', '/'].includes(node.value)
      ? `${blue}${node.value}${reset}`
      : node.value;

    if (node.right) {
      this.logTree(node.right, `${prefix}${isLeft ? '│   ' : '    '}`, false);
    }

    console.log(
      `${prefix}${isLeft ? '└── ' : '┌── '}${
        node.unarySign ? node.unarySign : ''
      }${value}`
    );

    if (node.left) {
      this.logTree(node.left, `${prefix}${isLeft ? '    ' : '│   '}`, true);
    }
  }

  processAndLogTree(tokens: Token[]): void {
    const postfixTokens = this.toPostfix(tokens);

    const tree = this.build(postfixTokens);
    this.logTree(tree);
  }
}
