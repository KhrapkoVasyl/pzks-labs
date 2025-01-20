import { handleExpressions } from './index';

const expressions = [
  'a*(b-4) - 2*b*c - c*d - a*c*d/e/f/g - g-h-i-j', // M4
];

handleExpressions(expressions);
