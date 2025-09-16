import {Component, effect, inject, OnInit, OnDestroy, HostListener} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {StatsService} from './utils/stats-service/stats.service';
import {Log} from './utils/interfaces/log';
import { DatePipe, CommonModule } from '@angular/common';
import {SettingsStore} from '../../utils/state/settings/settings.state';
import {UserStore} from '../../utils/state/user/user.state';
import {Subscription} from 'rxjs';
import { NgIconComponent } from '@ng-icons/core';
import { ProfilesStore } from '../../utils/state/profiles/profiles.state';
import { BotProfile } from '../../utils/data-acces/profiles/profiles.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    FormsModule,
    DatePipe,
    ReactiveFormsModule,
    NgIconComponent,
    CommonModule
  ],
  templateUrl: './dashboard.component.html',
  standalone: true,
  styleUrl: './dashboard.component.scss'
})



export class DashboardComponent implements OnInit, OnDestroy {
  private statsService = inject(StatsService);
  private fb = inject(FormBuilder);

  readonly settingsStore = inject(SettingsStore);
  readonly userStore = inject(UserStore);
  readonly profilesStore = inject(ProfilesStore);
  
  botForm: FormGroup;
  profileForm: FormGroup;
  
  // Profile management state
  showProfileModal = false;
  showProfileDropdown = false;
  editingProfile: BotProfile | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor() {
    this.botForm = this.fb.group({
      prompt: ['', Validators.required],
      experience: ['', [
        Validators.required,
      ]],
      blockedKeywords: ['', Validators.pattern('^([a-zA-Z0-9]+,\\s?)*[a-zA-Z0-9]+$')]
    });

    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      prompt: ['', Validators.required],
      experience: ['', Validators.required],
      blockedKeywords: ['', Validators.pattern('^([a-zA-Z0-9]+,\\s?)*[a-zA-Z0-9]+$')]
    });

    effect(() => {
      const settings = this.settingsStore.shortSettings();

      if (settings.custom_prompt()) {
        this.botForm.patchValue({
          prompt: settings.custom_prompt(),
          experience: settings.experience_level(),
          blockedKeywords: settings.blocked_keywords(),
        });
      }
    });

    // Effect to handle selected profile changes
    effect(() => {
      const selectedProfile = this.profilesStore.selectedProfile();
      if (selectedProfile) {
        this.botForm.patchValue({
          prompt: selectedProfile.custom_prompt,
          experience: selectedProfile.experience_level,
          blockedKeywords: selectedProfile.blocked_keywords,
        });
      }
    });
  }

  ngOnInit() {
    // Load user if not already loaded
    if (this.userStore.id() === 0) {
      this.userStore.loadUser();
    }

    // Load profiles
    this.profilesStore.loadProfiles();
    
    this.statsService.getJobSummary().subscribe({
      next: (summary) => {
        this.stats.appliedJobs = summary.appliedJobs;
        this.stats.scrappedTotal = summary.totalJobs;
        this.stats.scrapedToday = summary.todayJobs;
        this.stats.applicableJobs = summary.applicableJobs;
      },
      error: () => {
        console.error('Error fetching job summary');
      }
    });

    this.statsService.getLogs().subscribe({
      next: (logs) => {
        this.activityLog = logs;
      },
      error: () => {
        console.error('Error fetching logs');
      }
    });

    this.statsService.getBotStats().subscribe({
      next: (botStats) => {
        this.stats.botRuns = botStats.bot_activation_count;
        this.stats.lastRun = botStats.last_bot_use;
      },
      error: () => {
        console.error('Error fetching bot stats');
      }
    });
  }

  stats = {
    scrappedTotal: 0,
    appliedJobs: 0,
    scrapedToday: 0,
    applicableJobs: 0,
    botRuns: 0,
    lastRun: '2024-02-13 14:30'
  };


  activityLog: Log[] = [
  ];

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Profile Management Methods
  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  selectProfile(profile: BotProfile | null): void {
    this.profilesStore.selectProfile(profile?.id || null);
    this.showProfileDropdown = false;
  }

  openProfileModal(profile?: BotProfile): void {
    this.editingProfile = profile || null;
    if (profile) {
      this.profileForm.patchValue({
        name: profile.name,
        prompt: profile.custom_prompt,
        experience: profile.experience_level,
        blockedKeywords: profile.blocked_keywords
      });
    } else {
      // Pre-fill with current form values when creating new profile
      this.profileForm.patchValue({
        name: '',
        prompt: this.botForm.get('prompt')?.value || '',
        experience: this.botForm.get('experience')?.value || '',
        blockedKeywords: this.botForm.get('blockedKeywords')?.value || ''
      });
    }
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
    this.editingProfile = null;
    this.profileForm.reset();
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.valid) {
      const profileData = {
        name: this.profileForm.get('name')?.value,
        custom_prompt: this.profileForm.get('prompt')?.value,
        experience_level: this.profileForm.get('experience')?.value,
        blocked_keywords: this.profileForm.get('blockedKeywords')?.value
      };

      if (this.editingProfile) {
        // Update existing profile
        await this.profilesStore.updateProfile(this.editingProfile.id, profileData);
        this.closeProfileModal();
      } else {
        // Create new profile
        await this.profilesStore.createProfile(profileData);
        this.closeProfileModal();
      }
    }
  }

  async deleteProfile(profile: BotProfile): Promise<void> {
    if (confirm(`Are you sure you want to delete the profile "${profile.name}"?`)) {
      await this.profilesStore.deleteProfile(profile.id);
    }
  }

  loadProfile(profile: BotProfile): void {
    this.botForm.patchValue({
      prompt: profile.custom_prompt,
      experience: profile.experience_level,
      blockedKeywords: profile.blocked_keywords
    });
    this.profilesStore.selectProfile(profile.id);
  }

  onSettingsSave() {
    if (this.botForm.valid) {
      const partialSettings = {
        custom_prompt: this.botForm.get('prompt')?.value || '',
        experience_level: this.botForm.get('experience')?.value || '',
        blocked_keywords: this.botForm.get('blockedKeywords')?.value || '',
      };
      this.settingsStore.updateSettings(partialSettings);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showProfileDropdown = false;
    }
  }

}
