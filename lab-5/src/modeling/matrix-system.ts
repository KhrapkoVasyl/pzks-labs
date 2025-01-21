import { TreeNode } from '../tree-builder';

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

export const operationCost: { [key: string]: number } = {
  '+': 2,
  '-': 3,
  '*': 4,
  '/': 8,
  S: 1, // sending data
  R: 1, // receiving data
};

export class MatrixSystem {
  jobs: Job[] = [];
  doneJobs: number[] = [];

  constructor() {}

  buildJobsFromTree(tree: TreeNode): void {
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
      '\n\n Jobs with hierarchy: ',
      JSON.stringify(jobsWithHierarchy, null, 2),
      '\n\n'
    );

    for (let level = jobsWithHierarchy.length - 1; level >= 0; level--) {
      const sortedLevel = jobsWithHierarchy[level].sort(
        (a, b) => operationCost[a.operation] - operationCost[b.operation]
      );
      this.jobs.push(...sortedLevel);
    }

    console.log('\n\n Jobs: ', this.jobs, '\n\n');
  }
}
