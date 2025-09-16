import { Injectable } from '@angular/core';
import {JobSummary} from '../../../../utils/interfaces/job-summary';
import {HttpClient} from '@angular/common/http';
import {Log} from '../interfaces/log';
import {BotStats} from '../interfaces/bot-stats';

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  constructor(
    private http: HttpClient
  ) { }

  getJobSummary() {
    return this.http.get<JobSummary>('http://localhost:3000/api/jobs/summary')
  }

  getLogs() {
    return this.http.get<Log[]>('http://localhost:3000/api/bot/logs');
  }

  getBotStats() {
    return this.http.get<BotStats>('http://localhost:3000/api/users/botStats');
  }

}
