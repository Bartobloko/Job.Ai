import {Component, effect, inject, OnInit, OnDestroy} from '@angular/core';
import {BotService} from '../../utils/data-acces/bot/bot.service';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {JobsService} from '../../utils/data-acces/jobs-service/jobs.service';
import {StatsService} from './utils/stats-service/stats.service';
import {Log} from './utils/interfaces/log';
import { DatePipe, CommonModule } from '@angular/common';
import {SettingsStore} from '../../utils/state/settings/settings.state';
import {UserStore} from '../../utils/state/user/user.state';
import {firstValueFrom, Subscription} from 'rxjs';
import { NgIconComponent } from '@ng-icons/core';
import { BotStepperComponent } from '../../shared/components/bot-stepper/bot-stepper.component';
import { WebsocketService } from '../../utils/data-acces/websocket/websocket.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    FormsModule,
    DatePipe,
    ReactiveFormsModule,
    NgIconComponent,
    CommonModule,
    BotStepperComponent
  ],
  templateUrl: './dashboard.component.html',
  standalone: true,
  styleUrl: './dashboard.component.scss'
})



export class DashboardComponent implements OnInit, OnDestroy {
  private botService = inject(BotService);
  private statsService = inject(StatsService);
  private fb = inject(FormBuilder);
  private websocketService = inject(WebsocketService);


  settingsStore = inject(SettingsStore);
  userStore = inject(UserStore);
  botForm: FormGroup;
  showBotStepper = false;
  isBotRunning = false;
  private subscriptions: Subscription[] = [];

  constructor() {
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

    // Effect to handle user ID changes (for initial load)
    effect(() => {
      const userId = this.userStore.id();
      if (userId !== 0 && !this.websocketService.isConnected()) {
        this.initializeWebSocket();
        this.checkBotStatus();
      }
    });
  }

  ngOnInit() {
    // Load user if not already loaded
    if (this.userStore.id() === 0) {
      this.userStore.loadUser();
    }
    
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

  private initializeWebSocket() {
    if (this.userStore.id() !== 0) {
      this.websocketService.connect(this.userStore.id().toString());
      
      // Subscribe to bot status updates
      this.subscriptions.push(
        this.websocketService.botStatus$.subscribe(status => {
          this.isBotRunning = status.isRunning;
          this.showBotStepper = status.isRunning;
        })
      );

      // Subscribe to bot completion to hide stepper
      this.subscriptions.push(
        this.websocketService.botComplete$.subscribe(() => {
          this.isBotRunning = false;
          // Keep stepper visible for a moment to show completion
          setTimeout(() => {
            this.showBotStepper = false;
          }, 3000);
        })
      );

      // Subscribe to bot errors to hide stepper
      this.subscriptions.push(
        this.websocketService.botError$.subscribe(() => {
          this.isBotRunning = false;
          // Keep stepper visible for a moment to show error
          setTimeout(() => {
            this.showBotStepper = false;
          }, 5000);
        })
      );
    }
  }

  private checkBotStatus() {
    this.botService.getBotStatus().subscribe({
      next: (status) => {
        this.isBotRunning = status.isRunning;
        this.showBotStepper = status.isRunning;
      },
      error: (error) => {
        console.error('Error checking bot status:', error);
      }
    });
  }

  onBotStart() {
    if (!this.isBotRunning) {
      // Don't set state optimistically - wait for API response
      firstValueFrom(this.botService.startBot()).then(
        () => {
          // Success: state will be updated via WebSocket
          console.log('Bot started successfully');
        },
        (error) => {
          // Error: ensure UI state remains consistent
          console.error('Failed to start bot:', error);
          this.isBotRunning = false;
          this.showBotStepper = false;
          // Optionally show user-friendly error message
        }
      );
    }
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
