import { handleExpressions } from './index';

const expressions = [
  'a+(b+c+d+(e+f)+g)+h', // P1
  'a-((b-c-d)-(e-f)-g)-h', // P2
  '5040/8/7/6/5/4/3/2', // E1
  '10-9-8-7-6-5-4-3-2-1', // E2
  '64-(32-16)-8-(4-2-1)', // E3

  '-(-i)/1.0 + 0 - 0*k*h + 2 - 4.8/2 + 1*e/2', // S1

  '2+3+4+5+6+7+8*s-p', // custom simple
  '0/b/c-0+(c+(-d)/e)/1+56-32+11*1-12*0', // custom complex
];

handleExpressions(expressions);
