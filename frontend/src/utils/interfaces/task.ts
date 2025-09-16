export interface TaskEntry {
  id: string;
  type: 'bot_run' | 'job_recheck';
  status: 'running' | 'completed' | 'error';
  startTime: Date;
  endTime?: Date;
  title: string;
  description: string;
  progress?: {
    current: number;
    total: number;
  };
  userId: string;
}

export interface TaskProgress {
  taskId: string;
  current: number;
  total: number;
  stage: string;
  message?: string;
}