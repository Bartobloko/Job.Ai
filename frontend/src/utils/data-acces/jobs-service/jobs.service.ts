import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Job} from '../../interfaces/job';
import {JobSummary} from '../../interfaces/job-summary';

@Injectable({
  providedIn: 'root'
})
export class JobsService {

  constructor(
    private http: HttpClient
  ) { }

  getJobOffers() {
    return this.http.get<Job[]>('http://localhost:3000/api/jobs');
  }

  getTodayJobOffers() {
    return this.http.get<Job[]>('http://localhost:3000/api/jobs/today');
  }


}
