import util from 'util';

import { roundToTwoDecimalPlaces } from '../utils';
import { MatrixSystem } from './matrix-system';

export class MatrixSystemEvaluator {
  parSystem: MatrixSystem;
  seqSystem: MatrixSystem;

  parSystemProcessorsCount: number;
  timeParallel?: number;
  timeSequential?: number;
  accelaration?: number;
  efficiency?: number;

  constructor(parSystem: MatrixSystem, seqSystem: MatrixSystem) {
    this.parSystem = parSystem;
    this.seqSystem = seqSystem;

    this.parSystemProcessorsCount = parSystem.processors.length;

    this.evaluate();
  }

  evaluate(): void {
    this.timeParallel = this.parSystem.history?.length!;
    this.timeSequential = this.seqSystem.history?.length!;

    this.accelaration = this.getAcceleration();
    this.efficiency = this.getEfficiency();
  }

  getAcceleration() {
    const res = this.timeSequential! / this.timeParallel!;

    return roundToTwoDecimalPlaces(res);
  }

  getEfficiency() {
    const totalArithmeticOperations = this.parSystem
      .history!.flatMap(({ actions }) => actions)
      .filter(({ operation }) => operation !== 'S' && operation !== 'R').length;

    const maxAvailableOperations =
      this.parSystemProcessorsCount * this.timeParallel!;

    const res = totalArithmeticOperations / maxAvailableOperations;

    return roundToTwoDecimalPlaces(res);
  }

  logResults(): void {
    let log = '\n===== РЕЗУЛЬТАТИ ОЦІНКИ ПАРАЛЕЛЬНОЇ СИСТЕМИ =====\n\n';
    log += `Час роботи паралельної системи: ${this.timeParallel}\n`;
    log += `Час роботи послідовної системи: ${this.timeSequential}\n`;
    log += `Прискорення: ${this.accelaration}\n`;
    log += `Ефективність: ${this.efficiency}\n\n\n`;

    console.log(log);
  }
}
