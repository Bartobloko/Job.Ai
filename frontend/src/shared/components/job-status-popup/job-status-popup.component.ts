import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent } from '@ng-icons/core';
import { JobChange } from '../../../utils/data-acces/jobs-service/jobs.service';

@Component({
  selector: 'app-job-status-popup',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './job-status-popup.component.html',
  styleUrls: ['./job-status-popup.component.scss']
})
export class JobStatusPopupComponent {
  @Input() isVisible: boolean = false;
  @Input() changedJobs: JobChange[] = [];
  @Input() totalJobs: number = 0;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  getStatusIcon(status: string): string {
    return status === 'approved' ? 'heroCheckCircle' : 'heroXCircle';
  }

  getStatusColor(status: string): string {
    return status === 'approved' ? 'text-success-600' : 'text-secondary-500';
  }

  getStatusBgColor(status: string): string {
    return status === 'approved' ? 'bg-success-100' : 'bg-secondary-100';
  }

  trackByJobId(index: number, job: JobChange): number {
    return job.id;
  }
}