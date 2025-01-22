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
  operation: '+' | '-' | '*' | '/';
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

export class MatrixSystem {
  jobs: Job[] = [];

  processors: ProcessingUnit[] = [];
  centralProcessor: ProcessingUnit;
  tick: number = 0;

  constructor(tree: TreeNode, processorCount: number) {
    this.buildJobsFromTree(tree);

    for (let i = 0; i < processorCount; i++) {
      const isCentral = i === 0;
      const processor = new ProcessingUnit(i + 1, isCentral);
      this.processors.push(processor);
    }

    this.centralProcessor = this.processors[0];
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

    console.log(
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

    console.log('\n\n ======= Jobs: ', this.jobs, '\n\n');
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
    console.log('\n\n Assigning jobs \n\n');
    const freeProcessors = this.processors.filter(
      (processor) => !processor.currentJob
    );

    const currentOperation = this.getCurrentOperation();
    console.log('\n\n Current operation: ', currentOperation, '\n\n');

    let availableJobs = this.getAvailableJobs();
    console.log('\n\n Available jobs: ', availableJobs, '\n\n');

    if (currentOperation) {
      availableJobs = availableJobs.filter(
        ({ job }) => job.operation === currentOperation
      );
    } else if (availableJobs.length > 0) {
      const firstJobOperation = availableJobs[0].job.operation;
      console.log('\n\n firstJobOperation: ', firstJobOperation, '\n\n');
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
      console.log('\n\n Best processor: ', bestProcessor, '\n\n');

      if (bestProcessor) {
        // TODO: handle dependencies (send/receiving data)
        const jobIndex = this.jobs.findIndex((j) => j.id === job.id);
        this.jobs.splice(jobIndex, 1);
        bestProcessor.assignJob(job);
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

      console.log(
        '\n\n Iteration details: ',
        { freeProcessors, processor, job, dependencyProcessors },
        '\n\n'
      );

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
          console.log('\n\n HERE1: ', {
            missingDependencies,
            minMissingDependencies,
          });
          minMissingDependencies = missingDependencies;
          bestProcessor = processor;
        }
      }
    }

    console.log(
      '\n\n Inside findBestProcessorByDependencies: ',
      { bestProcessor, freeProcessors },
      '\n\n'
    );

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

  nextTick(): void {
    this.tick++;

    this.processors.forEach((processor) => {
      processor.nextTick(this.tick);
    });

    this.assignJobs();
  }

  /**
   * Runs the simulation until all jobs are completed.
   * Logs the history of operations for each processor.
   */
  simulate(): void {
    console.log(`\n\n STEP OF SIMULATION : ${this.tick} \n\n`);
    console.log(`\n\n JOBS: ${this.jobs} \n\n`);

    while (this.jobs.length > 0 || this.processors.some((p) => p.currentJob)) {
      this.nextTick();

      if (this.tick === 4) {
        return;
      }
    }

    console.log('\nSimulation complete:\n');
    this.processors.forEach((processor) => {
      console.log(
        `Processor ${processor.id} history:\n`,
        util.inspect(processor.history, { depth: null, colors: true })
      );
    });
  }
}
