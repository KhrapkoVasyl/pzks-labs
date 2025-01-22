import { Job } from './matrix-system';

export class ProcessingUnit {
  id: number;
  isCentral: boolean;
  results: Map<number, any>; // Stores job results by job ID
  history: { tick: number; job: Job }[]; // Tracks operations per tick

  currentJob?: Job;

  constructor(id: number, isCentral: boolean) {
    this.id = id;
    this.isCentral = isCentral;
    this.results = new Map();
    this.history = [];
  }

  logOperation(tick: number, operation: string): void {
    this.history.push({ tick, job: this.currentJob! });
  }

  nextTick() {}
}
