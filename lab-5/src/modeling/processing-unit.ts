import { Job, JobStatus, operationsCosts } from './matrix-system';

export class ProcessingUnit {
  id: number;
  isCentral: boolean;
  jobResults: { [jobId: string]: boolean } = {};
  history: { tick: number; job: Job; tickToComplete: number }[];

  currentJob?: Job;
  tickToComplete?: number;
  dataTransferOperation?: Job;

  constructor(id: number, isCentral: boolean) {
    this.id = id;
    this.isCentral = isCentral;
    this.jobResults = {};
    this.history = [];
  }

  logOperation(tick: number, job: Job, tickToComplete: number): void {
    this.history.push({ tick, job, tickToComplete });
  }

  nextTick(tick: number) {
    if (this.currentJob) {
      if (this.currentJob.status === JobStatus.Idle) {
        const hasDependencies = this.hasDependenciesData();
        if (hasDependencies) {
          this.currentJob.status = JobStatus.Process;
        }
      }

      if (this.currentJob.status === JobStatus.Process) {
        this.tickToComplete! -= 1;

        this.logOperation(tick, this.currentJob, this.tickToComplete!);

        if (this.tickToComplete === 0) {
          this.jobResults[this.currentJob.id] = true;

          this.currentJob.status = JobStatus.Done;

          this.currentJob = undefined;
          this.tickToComplete = undefined;
        }
      }

      this.handleDataTransferOperation(tick);
    }
  }

  handleDataTransferOperation(tick: number): void {
    if (this.dataTransferOperation) {
      if (this.dataTransferOperation?.operation === 'R') {
        this.jobResults[this.dataTransferOperation.id] = true;
      }

      this.dataTransferOperation.status = JobStatus.Done;

      this.logOperation(tick, this.dataTransferOperation, 0);
      this.dataTransferOperation = undefined;
    }
  }

  hasDependenciesData(): boolean {
    if (!this.currentJob) {
      return false;
    }

    for (const depId of this.currentJob.dependenciesIds) {
      if (!this.jobResults[depId]) {
        return false;
      }
    }

    return true;
  }

  hasResult(jobId: number): boolean {
    return Boolean(this.jobResults[jobId]);
  }

  setDataTransferOperation(dataTransferOperation: Job): void {
    this.dataTransferOperation = dataTransferOperation;
  }

  assignJob(job: Job): void {
    this.currentJob = job;
    const operationCost = operationsCosts[job.operation];
    this.tickToComplete = operationCost;
  }
}
