import {Component, effect, inject, OnInit} from '@angular/core';
import {BotService} from '../../utils/data-acces/bot/bot.service';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {JobsService} from '../../utils/data-acces/jobs-service/jobs.service';
import {StatsService} from './utils/stats-service/stats.service';
import {Log} from './utils/interfaces/log';
import {DatePipe, CommonModule} from '@angular/common';
import {SettingsStore} from '../../utils/state/settings/settings.state';
import {firstValueFrom} from 'rxjs';
import { NgIconComponent } from '@ng-icons/core';

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



export class DashboardComponent implements OnInit {


  settingsStore = inject(SettingsStore);
  botForm: FormGroup;

  constructor(
    private botService: BotService,
    private statsService: StatsService,
    private fb: FormBuilder
  ) {
    this.botForm = this.fb.group({
      prompt: ['', Validators.required],
      experience: ['', [
        Validators.required,
      ]],
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
  }

  ngOnInit() {
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

  onBotStart() {
    firstValueFrom(this.botService.startBot()).then();
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

}
