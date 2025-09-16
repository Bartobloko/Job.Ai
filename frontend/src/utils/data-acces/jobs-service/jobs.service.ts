import { Injectable, inject } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Job} from '../../interfaces/job';
import {JobSummary} from '../../interfaces/job-summary';

export interface JobDay {
  job_date: string;
  job_count: number;
}

export interface JobChange {
  id: number;
  title: string;
  company: string;
  link: string;
  oldStatus: string;
  newStatus: string;
}

export interface RecheckResult {
  message: string;
  totalJobs: number;
  changedJobs: JobChange[];
}

@Injectable({
  providedIn: 'root'
})
export class JobsService {
  private http = inject(HttpClient);


  getJobOffers() {
    return this.http.get<Job[]>('http://localhost:3000/api/jobs');
  }

  getTodayJobOffers() {
    return this.http.get<Job[]>('http://localhost:3000/api/jobs/today');
  }

  getJobDays() {
    return this.http.get<JobDay[]>('http://localhost:3000/api/jobs/days');
  }

  recheckJobsFromDate(date: string) {
    return this.http.post<RecheckResult>(`http://localhost:3000/api/jobs/recheck/${date}`, {});
  }
}
