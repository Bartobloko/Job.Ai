import {Component, inject, HostListener, OnInit, OnDestroy, effect} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {UsersStore} from '../../utils/state/users/users.state';
import { User } from '../../utils/interfaces/user';
import {UserStore} from '../../utils/state/user/user.state';
import {AuthService} from '../../utils/data-acces/auth/auth.service';
import { NgIconComponent } from '@ng-icons/core';
import { CommonModule } from '@angular/common';
import { BotService } from '../../utils/data-acces/bot/bot.service';
import { WebsocketService } from '../../utils/data-acces/websocket/websocket.service';
import { TasksStore } from '../../utils/state/tasks/tasks.state';
import { BotStepperComponent } from '../../shared/components/bot-stepper/bot-stepper.component';
import { firstValueFrom, Subscription } from 'rxjs';


@Component({
    selector: 'app-navbar',
    imports: [
    RouterLink,
    RouterLinkActive,
    NgIconComponent,
    CommonModule,
    BotStepperComponent
],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private botService = inject(BotService);
  private websocketService = inject(WebsocketService);

  isAccountDropdownOpen = false;
  isMobileMenuOpen = false;
  isTasksDropdownOpen = false;
  isBotRunning = false;
  selectedTaskForDetail: string | null = null;

  readonly usersStore = inject(UsersStore);
  readonly userStore = inject(UserStore);
  readonly tasksStore = inject(TasksStore);
  
  private subscriptions: Subscription[] = [];

  constructor() {
    // Effect to handle user ID changes (for initial load)
    effect(() => {
      const userId = this.userStore.id();
      if (userId !== 0 && !this.websocketService.isConnected()) {
        this.initializeWebSocket();
        this.checkBotStatus();
      }
    });
  }

  ngOnInit(): void {
    // Load user if not already loaded
    if (this.userStore.id() === 0) {
      this.userStore.loadUser();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get accounts(): User[] {
    return this.usersStore.users();
  }

  toggleAccountDropdown(): void {
    this.isAccountDropdownOpen = !this.isAccountDropdownOpen;
    this.isTasksDropdownOpen = false;
  }

  toggleTasksDropdown(): void {
    this.isTasksDropdownOpen = !this.isTasksDropdownOpen;
    this.isAccountDropdownOpen = false;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  selectAccount(account: User) {
    this.authService.login(account.username);
    this.isAccountDropdownOpen = false;
  }

  createNewAccount(): void {
    // Implement your account creation logic here
  }

  onBotStart(): void {
    if (!this.isBotRunning) {
      // Create a new task for this bot run
      const taskId = this.tasksStore.addTask({
        type: 'bot_run',
        status: 'running',
        startTime: new Date(),
        title: 'Bot Execution',
        description: 'Running job search automation',
        userId: this.userStore.id().toString()
      });

      // Start the bot
      firstValueFrom(this.botService.startBot()).then(
        () => {
          console.log('Bot started successfully');
        },
        (error) => {
          console.error('Failed to start bot:', error);
          this.tasksStore.errorTask(taskId, 'Failed to start bot');
          this.isBotRunning = false;
        }
      );
    }
  }

  selectTaskForDetail(taskId: string | null): void {
    this.selectedTaskForDetail = taskId;
    this.tasksStore.selectTask(taskId);
  }

  private initializeWebSocket(): void {
    if (this.userStore.id() !== 0) {
      this.websocketService.connect(this.userStore.id().toString());
      
      // Subscribe to bot status updates
      this.subscriptions.push(
        this.websocketService.botStatus$.subscribe(status => {
          this.isBotRunning = status.isRunning;
        })
      );

      // Subscribe to bot completion
      this.subscriptions.push(
        this.websocketService.botComplete$.subscribe((summary) => {
          this.isBotRunning = false;
          // Find and complete the most recent running bot task
          const runningBotTasks = this.tasksStore.runningTasks().filter(task => task.type === 'bot_run');
          if (runningBotTasks.length > 0) {
            const latestTask = runningBotTasks[runningBotTasks.length - 1];
            this.tasksStore.completeTask(latestTask.id);
          }
        })
      );

      // Subscribe to bot errors
      this.subscriptions.push(
        this.websocketService.botError$.subscribe((error) => {
          this.isBotRunning = false;
          // Find and error the most recent running bot task
          const runningBotTasks = this.tasksStore.runningTasks().filter(task => task.type === 'bot_run');
          if (runningBotTasks.length > 0) {
            const latestTask = runningBotTasks[runningBotTasks.length - 1];
            this.tasksStore.errorTask(latestTask.id, error.message);
          }
        })
      );
    }
  }

  private checkBotStatus(): void {
    this.botService.getBotStatus().subscribe({
      next: (status) => {
        this.isBotRunning = status.isRunning;
      },
      error: (error) => {
        console.error('Error checking bot status:', error);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.account-dropdown')) {
      this.isAccountDropdownOpen = false;
    }
    if (!target.closest('.tasks-dropdown')) {
      this.isTasksDropdownOpen = false;
    }
    if (!target.closest('.mobile-menu')) {
      this.isMobileMenuOpen = false;
    }
  }

}

