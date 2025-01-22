import util from 'util';

import { TreeNode } from '../tree-builder';
import { ProcessingUnit } from './processing-unit';

export enum JobStatus {
  Idle = 'idle',
  Process = 'process',
  Done = 'done',
}

export interface Job {
  id: number;
  operation: '+' | '-' | '*' | '/' | 'R' | 'S';
  dependenciesIds: number[];
  status: JobStatus;
}

export const operationsCosts: { [key: string]: number } = {
  '+': 2,
  '-': 3,
  '*': 4,
  '/': 8,
  S: 1, // sending data
  R: 1, // receiving data
};

export type History = {
  tick: number;
  actions: { processorId: number; operation: string; jobId?: number }[];
}[];

export class MatrixSystem {
  jobs: Job[] = [];

  processors: ProcessingUnit[] = [];
  centralProcessor: ProcessingUnit;
  tick: number = 0;
  history?: History;

  private dataTransfers: { source: number; target: number; jobId: number }[] =
    [];

  enabledLogger: boolean = true;

  constructor(
    tree: TreeNode,
    processorCount: number,
    enabledLogger: boolean = true
  ) {
    this.enabledLogger = enabledLogger;

    this.buildJobsFromTree(tree);

    for (let i = 0; i < processorCount; i++) {
      const isCentral = i === 0;
      const processor = new ProcessingUnit(i + 1, isCentral);
      this.processors.push(processor);
    }

    this.centralProcessor = this.processors[0];
    this.assignJobs();
  }

  private buildJobsFromTree(tree: TreeNode): void {
    let jobIdCounter = 1;
    const jobsWithHierarchy: Job[][] = [];

    const traverse = (node: TreeNode | null, level: number): number => {
      if (!node) return -1;

      if (!['+', '-', '*', '/'].includes(node.value)) {
        return -1;
      }

      while (jobsWithHierarchy.length <= level) {
        jobsWithHierarchy.push([]);
      }

      const leftJobId = traverse(node.left || null, level + 1);
      const rightJobId = traverse(node.right || null, level + 1);

      const jobId = jobIdCounter++;
      const dependenciesIds = [leftJobId, rightJobId].filter((id) => id !== -1);

      jobsWithHierarchy[level].push({
        id: jobId,
        operation: node.value as '+' | '-' | '*' | '/',
        dependenciesIds,
        status: JobStatus.Idle,
      });

      return jobId;
    };

    traverse(tree, 0);

    let newJobIdCounter = 1;
    const oldToNewIdMap = new Map<number, number>();

    for (let level = jobsWithHierarchy.length - 1; level >= 0; level--) {
      for (const job of jobsWithHierarchy[level]) {
        const newId = newJobIdCounter++;
        oldToNewIdMap.set(job.id, newId);
        job.id = newId;
      }
    }

    for (const levelJobs of jobsWithHierarchy) {
      for (const job of levelJobs) {
        job.dependenciesIds = job.dependenciesIds
          .map((oldId) => oldToNewIdMap.get(oldId) || -1)
          .filter((id) => id !== -1);
      }
    }

    this.logToConsole(
      '\n\n ====== Jobs with hierarchy: ',
      util.inspect(jobsWithHierarchy, { depth: null, colors: true }),
      '\n\n'
    );

    for (let level = jobsWithHierarchy.length - 1; level >= 0; level--) {
      const sortedLevel = jobsWithHierarchy[level].sort(
        (a, b) => operationsCosts[a.operation] - operationsCosts[b.operation]
      );
      this.jobs.push(...sortedLevel);
    }

    this.logToConsole('\n\n ======= Jobs: ', this.jobs, '\n\n');
  }

  private getAvailableJobs() {
    return this.jobs
      .filter((job) =>
        job.dependenciesIds.every((depId) =>
          this.processors.some((processor) => processor.hasResult(depId))
        )
      )
      .map((job) => {
        const dependencyProcessors = job.dependenciesIds.map((depId) =>
          this.processors
            .filter((processor) => processor.hasResult(depId))
            .map((processor) => processor.id)
        );
        return { job, dependencyProcessors };
      });
  }

  private getCurrentOperation(): string | null {
    const activeOperations = this.processors
      .map((processor) => processor.currentJob?.operation)
      .filter((operation) => Boolean(operation));

    return activeOperations.length > 0 ? activeOperations[0]! : null;
  }

  private assignJobs() {
    const freeProcessors = this.processors.filter(
      (processor) => !processor.currentJob
    );

    const currentOperation = this.getCurrentOperation();

    let availableJobs = this.getAvailableJobs();

    if (currentOperation) {
      availableJobs = availableJobs.filter(
        ({ job }) => job.operation === currentOperation
      );
    } else if (availableJobs.length > 0) {
      const firstJobOperation = availableJobs[0].job.operation;
      availableJobs = availableJobs.filter(
        ({ job }) => job.operation === firstJobOperation
      );
    }

    for (const { job, dependencyProcessors } of availableJobs) {
      if (!freeProcessors.length) {
        break;
      }

      const bestProcessor = this.findBestProcessorByDependencies(
        dependencyProcessors,
        freeProcessors,
        job
      );

      if (bestProcessor) {
        this.handleDataTransfer(job, dependencyProcessors, bestProcessor);
        const jobIndex = this.jobs.findIndex((j) => j.id === job.id);
        this.jobs.splice(jobIndex, 1);
        bestProcessor.assignJob(job);
      }
    }
  }

  private handleDataTransfer(
    job: Job,
    dependencyProcessors: number[][],
    targetProcessor: ProcessingUnit
  ): void {
    for (let i = 0; i < job.dependenciesIds.length; i++) {
      const depId = job.dependenciesIds[i];
      const processorsWithData = dependencyProcessors[i];

      if (!processorsWithData.includes(targetProcessor.id)) {
        const sourceProcessor = this.processors.find((processor) =>
          processor.hasResult(depId)
        );

        if (sourceProcessor && sourceProcessor.id !== targetProcessor.id) {
          if (
            sourceProcessor.id !== this.centralProcessor.id &&
            targetProcessor.id !== this.centralProcessor.id
          ) {
            this.dataTransfers.push({
              source: sourceProcessor.id,
              target: this.centralProcessor.id,
              jobId: depId,
            });
            this.dataTransfers.push({
              source: this.centralProcessor.id,
              target: targetProcessor.id,
              jobId: depId,
            });
          } else {
            this.dataTransfers.unshift({
              source: sourceProcessor.id,
              target: targetProcessor.id,
              jobId: depId,
            });
          }
        }
      }
    }
  }

  // Шукаємо процесор, для якого потрібно робити мінімальну кількість пересилань даних результатів попердніх обчислень
  // Якщо процесора зі всіма даними немає - обираємо центральний або той, у якому є мінімальна кількість даних, які треба отримати
  private findBestProcessorByDependencies(
    dependencyProcessors: number[][],
    freeProcessors: ProcessingUnit[],
    job: Job
  ): ProcessingUnit | null {
    let bestProcessor: ProcessingUnit | null = null;
    let minMissingDependencies = Infinity;

    for (let i = 0; i < freeProcessors.length; i++) {
      const processor = freeProcessors[i];

      if (job.dependenciesIds.length === 0) {
        freeProcessors.splice(i, 1);
        return processor;
      } else {
        const missingDependencies = dependencyProcessors.filter(
          (deps) => !deps.includes(processor.id)
        ).length;

        if (missingDependencies === 0) {
          freeProcessors.splice(i, 1);

          return processor;
        } else if (missingDependencies < minMissingDependencies) {
          minMissingDependencies = missingDependencies;
          bestProcessor = processor;
        }
      }
    }

    if (bestProcessor) {
      for (let i = 0; i < freeProcessors.length; i++) {
        if (freeProcessors[i].id === bestProcessor.id) {
          freeProcessors.splice(i, 1);
          break;
        }
      }
    }

    return bestProcessor;
  }

  handleDataTransferOnNextTick(): void {
    const dataTransfer = this.dataTransfers.shift();

    if (dataTransfer) {
      const { source, target, jobId } = dataTransfer;

      let sendOperation = {
        id: jobId,
        operation: 'S',
        dependenciesIds: [],
        status: JobStatus.Idle,
      } as Job;

      let receiveOperation = { ...sendOperation, operation: 'R' } as Job;

      const sourceProcessor = this.processors.find(
        (processor) => processor.id === source
      );
      const targetProcessor = this.processors.find(
        (processor) => processor.id === target
      );

      sourceProcessor?.setDataTransferOperation(sendOperation);
      targetProcessor?.setDataTransferOperation(receiveOperation);
    }
  }

  nextTick(): void {
    this.tick++;

    this.handleDataTransferOnNextTick();

    this.processors.forEach((processor) => {
      processor.nextTick(this.tick);
    });

    this.assignJobs();
  }

  simulate(): void {
    while (this.jobs.length > 0 || this.processors.some((p) => p.currentJob)) {
      this.nextTick();
    }

    this.history = this.generateHistory();
    this.logHistory(this.history);
  }

  private generateHistory(): History {
    const historyMap: {
      [tick: number]: {
        processorId: number;
        operation: string;
        jobId?: number;
      }[];
    } = {};

    this.processors.forEach((processor) => {
      processor.history.forEach(({ tick, job }) => {
        if (!historyMap[tick]) {
          historyMap[tick] = [];
        }
        historyMap[tick].push({
          processorId: processor.id,
          operation: job.operation || '',
          jobId: job.id,
        });
      });
    });

    const maxTick = Math.max(...Object.keys(historyMap).map(Number));

    const history: History = [];
    for (let tick = 1; tick <= maxTick; tick++) {
      history.push({ tick, actions: historyMap[tick] || [] });
    }

    return history;
  }

  private logHistory(history: History, delimiter: string = '|'): void {
    const columnWidth = 15;

    const header = [
      'Tick',
      ...this.processors.map((p) => `P${p.id}`.padEnd(columnWidth)),
    ].join('\t');
    this.logToConsole(header);

    history.forEach(({ tick, actions }) => {
      const row = [
        tick.toString().padEnd(5),
        ...this.processors.map((p) => {
          const processorActions = actions
            .filter((a) => a.processorId === p.id)
            .map((a) => `[${a.operation}${a.jobId ? `(${a.jobId})` : ''}]`);

          return processorActions.join(delimiter).padEnd(columnWidth);
        }),
      ].join('\t');
      this.logToConsole(row);
    });

    this.logToConsole('\n\n');
  }

  private logToConsole(message: any, ...params: any[]): void {
    if (this.enabledLogger) {
      console.log(message, ...params);
    }
  }
}
