import { Component, OnInit } from '@angular/core';
import { JobsService } from '../../utils/data-acces/jobs-service/jobs.service';
import {DatePipe, SlicePipe, CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Job} from '../../utils/interfaces/job';
import { NgIconComponent } from '@ng-icons/core';

@Component({
    selector: 'app-jobs-table',
    imports: [
    DatePipe,
    SlicePipe,
    FormsModule,
    NgIconComponent,
    CommonModule
],
    templateUrl: './jobs-table.component.html',
    styleUrls: ['./jobs-table.component.scss']
})
export class JobsTableComponent implements OnInit {
  columns = ['is_approved', 'createdAt', 'title', 'description', 'company', 'link'];
  sortColumn = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';
  searchQuery = '';
  showOnlyApplicable = false;

  newJobs: Job[] = [];

  allJobs: Job[] = [];
  filteredNewJobs: Job[] = [];
  filteredAllJobs: Job[] = [];

  constructor(private jobsService: JobsService) {}

  ngOnInit(): void {
    this.jobsService.getJobOffers().subscribe({
      next: (jobs) => {
        this.allJobs = jobs;
        console.log(this.allJobs,'jobs from all',jobs,'form back');
        this.filterJobs();
      },
      error: (err) => {
        console.error('Error fetching job offers', err);
      }
    });

    this.jobsService.getTodayJobOffers().subscribe({
      next: (jobs: Job[]) => {
        this.newJobs = jobs;
        this.filterJobs();
      },
      error: (err) => {
        console.error('Error fetching today\'s job offers', err);
      }
    });

  }

  filterJobs() {
    // Filter new jobs
    this.filteredNewJobs = this.newJobs.filter(job => {
      const matchesSearch = !this.searchQuery ||
        job.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesApplicable = !this.showOnlyApplicable || job.is_approved;

      return matchesSearch && matchesApplicable;
    });

    // Filter all jobs
    this.filteredAllJobs = this.allJobs.filter(job => {
      const matchesSearch = !this.searchQuery ||
        job.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesApplicable = !this.showOnlyApplicable || job.is_approved;

      return matchesSearch && matchesApplicable;
    });

    // Apply sorting to both filtered arrays
    this.applySorting();
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      // Toggle direction if clicking the same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new sort column and default to ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.applySorting();
  }

  private applySorting() {
    const compareFunction = (a: any, b: any) => {
      let aValue = a[this.sortColumn];
      let bValue = b[this.sortColumn];

      // Handle different types of values
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    };

    this.filteredNewJobs.sort(compareFunction);
    this.filteredAllJobs.sort(compareFunction);
  }
}
