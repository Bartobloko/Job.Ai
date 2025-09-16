import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

export interface BotStage {
  stage: 'scraping' | 'analysis';
  status: 'in_progress' | 'done' | 'error';
  message?: string;
  progress?: {
    current: number;
    total: number;
  };
}

export interface ScrapingStageUpdate {
  site: string;
  status: 'in_progress' | 'error' | 'nothing_to_scrap' | 'done';
  message?: string;
  jobsFound?: number;
}

export interface AnalysisStageUpdate {
  status: 'in_progress' | 'error' | 'done';
  message?: string;
  progress?: {
    current: number;
    total: number;
  };
}

export interface BotComplete {
  newJobs: number;
  analyzedJobs: number;
  totalScraped: number;
}

export interface BotError {
  message: string;
  stage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket | null = null;
  private connected = false;
  private currentUserId: string | null = null;

  // Subjects for different event types
  private botStageUpdateSubject = new Subject<BotStage>();
  private scrapingUpdateSubject = new Subject<ScrapingStageUpdate>();
  private analysisUpdateSubject = new Subject<AnalysisStageUpdate>();
  private botCompleteSubject = new Subject<BotComplete>();
  private botErrorSubject = new Subject<BotError>();
  private botStatusSubject = new Subject<{ isRunning: boolean }>();

  // Public observables
  public botStageUpdate$ = this.botStageUpdateSubject.asObservable();
  public scrapingUpdate$ = this.scrapingUpdateSubject.asObservable();
  public analysisUpdate$ = this.analysisUpdateSubject.asObservable();
  public botComplete$ = this.botCompleteSubject.asObservable();
  public botError$ = this.botErrorSubject.asObservable();
  public botStatus$ = this.botStatusSubject.asObservable();

  constructor() {}

  connect(userId: string): void {
    if (this.connected && this.currentUserId === userId) {
      return;
    }

    // Disconnect existing connection if user changed
    if (this.connected && this.currentUserId !== userId) {
      this.disconnect();
    }

    this.currentUserId = userId;

    this.socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.connected = true;
      
      // Join user-specific room
      if (this.currentUserId) {
        this.socket?.emit('join-user-room', this.currentUserId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.connected = false;
    });

    // Listen for bot stage updates
    this.socket.on('bot-stage-update', (data: BotStage) => {
      console.log('Bot stage update received:', data);
      this.botStageUpdateSubject.next(data);
    });

    // Listen for scraping updates
    this.socket.on('scraping-update', (data: ScrapingStageUpdate) => {
      console.log('Scraping update received:', data);
      this.scrapingUpdateSubject.next(data);
    });

    // Listen for analysis updates
    this.socket.on('analysis-update', (data: AnalysisStageUpdate) => {
      console.log('Analysis update received:', data);
      this.analysisUpdateSubject.next(data);
    });

    // Listen for bot completion
    this.socket.on('bot-complete', (data: BotComplete) => {
      console.log('Bot completion received:', data);
      this.botCompleteSubject.next(data);
    });

    // Listen for bot errors
    this.socket.on('bot-error', (data: BotError) => {
      console.log('Bot error received:', data);
      this.botErrorSubject.next(data);
    });

    // Listen for bot status updates
    this.socket.on('bot-status', (data: { isRunning: boolean }) => {
      console.log('Bot status received:', data);
      this.botStatusSubject.next(data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.currentUserId = null;
    }
  }

  // Force reconnection
  reconnect(): void {
    if (this.currentUserId) {
      this.disconnect();
      this.connect(this.currentUserId);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}