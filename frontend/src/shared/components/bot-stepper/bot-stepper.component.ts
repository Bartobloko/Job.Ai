import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent } from '@ng-icons/core';
import { WebsocketService, BotStage, ScrapingStageUpdate, AnalysisStageUpdate, BotComplete, BotError } from '../../../utils/data-acces/websocket/websocket.service';
import { Subscription } from 'rxjs';

export interface StepperStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
  icon?: string;
  subSteps?: StepperSubStep[];
}

export interface StepperSubStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error' | 'nothing_to_scrap';
  message?: string;
  jobsFound?: number;
}

@Component({
  selector: 'app-bot-stepper',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './bot-stepper.component.html',
  styleUrls: ['./bot-stepper.component.scss']
})
export class BotStepperComponent implements OnInit, OnDestroy {
  @Input() userId: string = '';
  @Input() isVisible: boolean = false;

  steps: StepperStep[] = [
    {
      id: 'scraping',
      label: 'Scraping Job Sites',
      status: 'pending',
      icon: 'heroGlobeAlt',
      subSteps: [
        { id: 'justjoin', label: 'JustJoin.it', status: 'pending' },
        { id: 'theprotocol', label: 'TheProtocol.it', status: 'pending' },
        { id: 'nofluffjobs', label: 'NoFluffJobs', status: 'pending' },
        { id: 'linkedin', label: 'LinkedIn', status: 'pending' },
        { id: 'talent', label: 'Talent.com', status: 'pending' }
      ]
    },
    {
      id: 'analysis',
      label: 'AI Analysis with Ollama',
      status: 'pending',
      icon: 'heroCpuChip',
      message: 'Analyzing jobs with AI'
    }
  ];

  private subscriptions: Subscription[] = [];
  currentProgress = { current: 0, total: 0 };
  isCompleted = false;
  hasError = false;
  completionSummary: BotComplete | null = null;

  constructor(private websocketService: WebsocketService) {}

  ngOnInit() {
    if (this.userId) {
      this.websocketService.connect(this.userId);
      this.setupSubscriptions();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.websocketService.disconnect();
  }

  private setupSubscriptions() {
    // Bot stage updates
    this.subscriptions.push(
      this.websocketService.botStageUpdate$.subscribe(update => {
        this.handleBotStageUpdate(update);
      })
    );

    // Scraping updates
    this.subscriptions.push(
      this.websocketService.scrapingUpdate$.subscribe(update => {
        this.handleScrapingUpdate(update);
      })
    );

    // Analysis updates
    this.subscriptions.push(
      this.websocketService.analysisUpdate$.subscribe(update => {
        this.handleAnalysisUpdate(update);
      })
    );

    // Bot completion
    this.subscriptions.push(
      this.websocketService.botComplete$.subscribe(summary => {
        this.handleBotComplete(summary);
      })
    );

    // Bot error
    this.subscriptions.push(
      this.websocketService.botError$.subscribe(error => {
        this.handleBotError(error);
      })
    );
  }

  private handleBotStageUpdate(update: BotStage) {
    const step = this.steps.find(s => s.id === update.stage);
    if (step) {
      step.status = update.status;
      step.message = update.message;
    }
  }

  private handleScrapingUpdate(update: ScrapingStageUpdate) {
    const scrapingStep = this.steps.find(s => s.id === 'scraping');
    if (!scrapingStep?.subSteps) return;

    const siteMap: { [key: string]: string } = {
      'JustJoin.it': 'justjoin',
      'TheProtocol.it': 'theprotocol',
      'NoFluffJobs': 'nofluffjobs',
      'LinkedIn': 'linkedin',
      'Talent.com': 'talent'
    };

    const subStepId = siteMap[update.site];
    const subStep = scrapingStep.subSteps.find(s => s.id === subStepId);
    
    if (subStep) {
      subStep.status = update.status;
      subStep.message = update.message;
      subStep.jobsFound = update.jobsFound;
    }

    // Update main scraping step status based on substeps
    if (scrapingStep.subSteps.every(s => ['completed', 'done', 'error', 'nothing_to_scrap'].includes(s.status))) {
      scrapingStep.status = 'completed';
      scrapingStep.message = 'All sites scraped';
    } else if (scrapingStep.subSteps.some(s => s.status === 'in_progress')) {
      scrapingStep.status = 'in_progress';
      scrapingStep.message = 'Scraping in progress...';
    }
  }

  private handleAnalysisUpdate(update: AnalysisStageUpdate) {
    const analysisStep = this.steps.find(s => s.id === 'analysis');
    if (analysisStep) {
      analysisStep.status = update.status;
      analysisStep.message = update.message;
      
      if (update.progress) {
        this.currentProgress = update.progress;
      }
    }
  }

  private handleBotComplete(summary: BotComplete) {
    this.isCompleted = true;
    this.completionSummary = summary;
    
    // Mark all steps as completed
    this.steps.forEach(step => {
      if (step.status !== 'error') {
        step.status = 'completed';
      }
    });
  }

  private handleBotError(error: BotError) {
    this.hasError = true;
    
    // Mark appropriate step as error
    if (error.stage) {
      const step = this.steps.find(s => s.id === error.stage);
      if (step) {
        step.status = 'error';
        step.message = error.message;
      }
    }
  }

  resetStepper() {
    this.steps.forEach(step => {
      step.status = 'pending';
      step.message = undefined;
      if (step.subSteps) {
        step.subSteps.forEach(subStep => {
          subStep.status = 'pending';
          subStep.message = undefined;
          subStep.jobsFound = undefined;
        });
      }
    });
    
    this.currentProgress = { current: 0, total: 0 };
    this.isCompleted = false;
    this.hasError = false;
    this.completionSummary = null;
  }

  getStepIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'heroCheckCircle';
      case 'in_progress':
        return 'heroArrowPath';
      case 'error':
        return 'heroXCircle';
      default:
        return 'heroEllipsisHorizontalCircle';
    }
  }

  getStepStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'text-success-600 bg-success-100';
      case 'in_progress':
        return 'text-primary-600 bg-primary-100 animate-pulse';
      case 'error':
        return 'text-danger-600 bg-danger-100';
      default:
        return 'text-secondary-400 bg-secondary-100';
    }
  }

  getSubStepStatusClass(status: string): string {
    switch (status) {
      case 'done':
        return 'text-success-600';
      case 'in_progress':
        return 'text-primary-600 animate-pulse';
      case 'error':
        return 'text-danger-600';
      case 'nothing_to_scrap':
        return 'text-warning-600';
      default:
        return 'text-secondary-400';
    }
  }

  getProgressPercentage(): number {
    if (this.currentProgress.total === 0) return 0;
    return Math.round((this.currentProgress.current / this.currentProgress.total) * 100);
  }
}