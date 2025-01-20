import { handleExpressions } from './index';

const expressions = [
  'a*2/0 + b/(b+b*0-1*b) - 1/(c*2*4.76*(1-2+1))', // S2
  'a*2/1 + b/(b+b*0-1*b) - 1/(c*2*4.76*(1-2+1))', // S2 fixed step 1 0 -> 1
  'a*2/1 + b/(b+b*0-1*a) - 1/(c*2*4.76*(1-2+1))', // S2 fixed step 2 b -> a
  'a*2/1 + b/(b+b*0-1*a) - 1/(c*2*4.76*(1-2+3))', // S2 fixed step 3 1 -> 3
];

handleExpressions(expressions);
