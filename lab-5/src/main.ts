import { handleExpressions } from './examples/index';

const examples = [
  'a+b+c+d+e+f+g+h+i+j',
  // '(a/b)+(c/d)*(e+f)+(g/h)*(i-j)',
  // 'a*b*c*d*e*f*g*h*i*j*k*l*m*n*o*p*q*r*s*t*u*v*w*x', // багато однакових операцій
  // '(a/b)-(c*d)*(e-f)+(g+h)', // різні операції
  // 'a/b+c*d*f/g-(h+i)',
];

handleExpressions(examples);
