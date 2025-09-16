import { Server } from 'socket.io';

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

class WebSocketService {
  private io: Server | null = null;
  private runningBots: Set<string> = new Set(); // Track running bots by userId

  setIO(io: Server) {
    this.io = io;
  }

  // Bot state management
  setBotRunning(userId: string, isRunning: boolean) {
    if (isRunning) {
      this.runningBots.add(userId);
    } else {
      this.runningBots.delete(userId);
    }
  }

  isBotRunning(userId: string): boolean {
    return this.runningBots.has(userId);
  }

  // Emit bot stage updates to specific user
  emitBotStageUpdate(userId: string, stage: BotStage) {
    if (this.io) {
      this.io.to(`user-${userId}`).emit('bot-stage-update', stage);
      console.log(`Emitted bot stage update to user ${userId}:`, stage);
    }
  }

  // Emit scraping updates for individual sites
  emitScrapingUpdate(userId: string, update: ScrapingStageUpdate) {
    if (this.io) {
      this.io.to(`user-${userId}`).emit('scraping-update', update);
      console.log(`Emitted scraping update to user ${userId}:`, update);
    }
  }

  // Emit analysis updates
  emitAnalysisUpdate(userId: string, update: AnalysisStageUpdate) {
    if (this.io) {
      this.io.to(`user-${userId}`).emit('analysis-update', update);
      console.log(`Emitted analysis update to user ${userId}:`, update);
    }
  }

  // Emit bot completion
  emitBotComplete(userId: string, summary: { newJobs: number; analyzedJobs: number; totalScraped: number }) {
    if (this.io) {
      this.setBotRunning(userId, false); // Mark bot as not running
      this.io.to(`user-${userId}`).emit('bot-complete', summary);
      console.log(`Emitted bot completion to user ${userId}:`, summary);
    }
  }

  // Emit bot error
  emitBotError(userId: string, error: { message: string; stage?: string }) {
    if (this.io) {
      this.setBotRunning(userId, false); // Mark bot as not running
      this.io.to(`user-${userId}`).emit('bot-error', error);
      console.log(`Emitted bot error to user ${userId}:`, error);
    }
  }
}

export const websocketService = new WebSocketService();
export default websocketService;