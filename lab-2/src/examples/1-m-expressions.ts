import { handleExpressions } from './index';

const expressions = [
  'a+b+c+d+e+f+g+h', // M1
  'a-b-c-d-e-f-g-h', // M2
  'a/b/c/d/e/f/g/h', // M3
];

handleExpressions(expressions);
