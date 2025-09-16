import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ProfilesService, ProfileTestResponse, FakeJob, BotProfile } from '../../utils/data-acces/profiles/profiles.service';
import { ProfilesStore } from '../../utils/state/profiles/profiles.state';

@Component({
  selector: 'app-bot-testing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './bot-testing.component.html',
  styleUrls: ['./bot-testing.component.scss']
})
export class BotTestingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profilesService = inject(ProfilesService);
  readonly profilesStore = inject(ProfilesStore);

  fakeJobForm: FormGroup;
  testResults: ProfileTestResponse | null = null;
  fakeJobs: FakeJob[] = [];
  selectedProfile: BotProfile | null = null;
  loading = false;
  error: string | null = null;
  showAddJobForm = false;

  constructor() {
    this.fakeJobForm = this.fb.group({
      description: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;
      await this.profilesStore.loadProfiles();
      await this.profilesStore.loadActiveProfile();
      this.selectedProfile = this.profilesStore.activeProfile();
      await this.loadFakeJobs();
    } catch (error: any) {
      this.error = error.message || 'Failed to load data';
    } finally {
      this.loading = false;
    }
  }

  async loadFakeJobs() {
    try {
      this.fakeJobs = await firstValueFrom(this.profilesService.getFakeJobs());
    } catch (error: any) {
      this.error = error.message || 'Failed to load fake jobs';
    }
  }

  onProfileSelect(profile: BotProfile) {
    this.selectedProfile = profile;
    this.testResults = null;
  }

  async onTestProfile() {
    if (!this.selectedProfile) {
      this.error = 'Please select a profile to test';
      return;
    }

    try {
      this.loading = true;
      this.error = null;
      this.testResults = await firstValueFrom(this.profilesService.testProfile(this.selectedProfile.id));
    } catch (error: any) {
      this.error = error.message || 'Failed to test profile';
      this.testResults = null;
    } finally {
      this.loading = false;
    }
  }

  onShowAddJobForm() {
    this.showAddJobForm = true;
    this.fakeJobForm.reset();
  }

  onCancelAddJob() {
    this.showAddJobForm = false;
    this.fakeJobForm.reset();
  }

  async onAddFakeJob() {
    if (this.fakeJobForm.valid) {
      try {
        this.loading = true;
        const description = this.fakeJobForm.get('description')?.value;
        await firstValueFrom(this.profilesService.createFakeJob(description));
        await this.loadFakeJobs();
        this.onCancelAddJob();
        this.error = null;
      } catch (error: any) {
        this.error = error.message || 'Failed to add fake job';
      } finally {
        this.loading = false;
      }
    }
  }

  async onDeleteFakeJob(jobId: number) {
    if (confirm('Are you sure you want to delete this fake job?')) {
      try {
        this.loading = true;
        await firstValueFrom(this.profilesService.deleteFakeJob(jobId));
        await this.loadFakeJobs();
        this.error = null;
        
        // Clear test results if they exist, as the job list has changed
        this.testResults = null;
      } catch (error: any) {
        this.error = error.message || 'Failed to delete fake job';
      } finally {
        this.loading = false;
      }
    }
  }

  onClearError() {
    this.error = null;
  }

  onClearResults() {
    this.testResults = null;
  }

  getResultIcon(isApproved: boolean): string {
    return isApproved ? '✓' : '✗';
  }

  getResultClass(isApproved: boolean): string {
    return isApproved ? 'text-green-600' : 'text-red-600';
  }

  getResultBgClass(isApproved: boolean): string {
    return isApproved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  }
}