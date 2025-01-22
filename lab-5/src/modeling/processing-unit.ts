import { Job, JobStatus, operationsCosts } from './matrix-system';

export class ProcessingUnit {
  id: number;
  isCentral: boolean;
  jobResults: { [jobId: string]: boolean } = {};
  history: { tick: number; job: Job; tickToComplete: number }[];

  currentJob?: Job;
  tickToComplete?: number;

  constructor(id: number, isCentral: boolean) {
    this.id = id;
    this.isCentral = isCentral;
    this.jobResults = {};
    this.history = [];
  }

  logOperation(tick: number): void {
    this.history.push({
      tick,
      job: this.currentJob!,
      tickToComplete: this.tickToComplete!,
    });
  }

  nextTick(tick: number) {
    console.log(
      `\n\n TICK ${tick} | Processor `,
      this.id,
      ' is processing job: ',
      this.currentJob
    );

    if (this.currentJob) {
      if (this.currentJob.status === JobStatus.Idle) {
        const hasDependencies = this.hasDependenciesData();
        if (hasDependencies) {
          this.currentJob.status = JobStatus.Process;
        }
      }

      if (this.currentJob.status === JobStatus.Process) {
        this.tickToComplete! -= 1;

        this.logOperation(tick);

        if (this.tickToComplete === 0) {
          this.jobResults[this.currentJob.id] = true;
          console.log(
            'Processor ',
            this.id,
            ' finished processing job ',
            this.currentJob
          );

          this.currentJob.status = JobStatus.Done;

          this.currentJob = undefined;
          this.tickToComplete = undefined;
        }
      }
    }
  }

  hasDependenciesData(): boolean {
    // TODO: mock
    return true;

    // if (!this.currentJob) {
    //   return false;
    // }

    // for (const depId of this.currentJob.dependenciesIds) {
    //   if (!this.jobResults[depId]) {
    //     return false;
    //   }
    // }

    // return true;
  }

  hasResult(jobId: number): boolean {
    return Boolean(this.jobResults[jobId]);
  }

  assignJob(job: Job): void {
    this.currentJob = job;
    const operationCost = operationsCosts[job.operation];
    this.tickToComplete = operationCost;

    console.log('\n\n Assigned job to processor ', this.id, 'JOB: ', {
      currentJob: this.currentJob,
      ttc: this.tickToComplete,
    });
  }
}
