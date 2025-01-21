import { handleExpressions } from './examples/index';

const examples = [
  // 'a+b+c+d+e+f+g+h',
  // 'a-b-c-d-e-f-g-h',
  // 'a/b/c/d/e/f/g/h',
  // 'a*(b-4) - 2*b*c - c*d - a*c*d/e/f/g - g-h-i-j',
  // 'a+(b+c+d+(e+f)+g)+h',
  // 'a-((b-c-d)-(e-f)-g)-h',
  // '5040/8/7/6/5/4/3/2',
  // '10-9-8-7-6-5-4-3-2-1',
  // '-a*(b+(c+d)/e)+b*0+5+4-1*n',
  // '64-(32-16)-8-(4-2-1)',
  // '-(-i)/1.0 + 0 - 0*k*h + 2 - 4.8/2 + 1*e/2',
  // 'a*2/1 + b/(b+b*0-1*a) - 1/(c*2*4.76*(1-2+1+1))',

  '0/b/c-0+(c+(-d)/e)/1+56-32+11*1-12*0',
];

handleExpressions(examples);
