import { Component, OnInit, inject, output } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NgIconComponent } from '@ng-icons/core';
import { JobsService, JobDay, RecheckResult } from '../../../utils/data-acces/jobs-service/jobs.service';

@Component({
  selector: 'app-job-recheck',
  standalone: true,
  imports: [FormsModule, NgIconComponent],
  templateUrl: './job-recheck.component.html',
  styleUrls: ['./job-recheck.component.scss']
})
export class JobRecheckComponent implements OnInit {
  private jobsService = inject(JobsService);

  readonly recheckComplete = output<RecheckResult>();

  jobDays: JobDay[] = [];
  selectedDate: string = '';
  isLoading: boolean = false;
  isRecheckingJobs: boolean = false;
  error: string = '';

  ngOnInit() {
    this.loadJobDays();
  }

  loadJobDays() {
    this.isLoading = true;
    this.error = '';
    
    this.jobsService.getJobDays().subscribe({
      next: (days) => {
        this.jobDays = days;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching job days', err);
        this.error = 'Failed to load available dates';
        this.isLoading = false;
      }
    });
  }

  onRecheckJobs() {
    if (!this.selectedDate) {
      this.error = 'Please select a date';
      return;
    }

    this.isRecheckingJobs = true;
    this.error = '';

    this.jobsService.recheckJobsFromDate(this.selectedDate).subscribe({
      next: (result) => {
        this.isRecheckingJobs = false;
        this.recheckComplete.emit(result);
      },
      error: (err) => {
        console.error('Error rechecking jobs', err);
        this.error = 'Failed to recheck jobs. Please try again.';
        this.isRecheckingJobs = false;
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getSelectedDayInfo(): JobDay | undefined {
    return this.jobDays.find(day => day.job_date === this.selectedDate);
  }
}