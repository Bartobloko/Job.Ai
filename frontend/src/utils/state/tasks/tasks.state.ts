import { computed, Injectable, signal } from '@angular/core';
import { TaskEntry, TaskProgress } from '../../interfaces/task';

@Injectable({
  providedIn: 'root'
})
export class TasksStore {
  // Private signals for state management
  private _tasks = signal<TaskEntry[]>([]);
  private _selectedTaskId = signal<string | null>(null);

  // Public computed signals
  public readonly tasks = this._tasks.asReadonly();
  public readonly runningTasks = computed(() => 
    this._tasks().filter(task => task.status === 'running')
  );
  public readonly completedTasks = computed(() => 
    this._tasks().filter(task => task.status === 'completed')
  );
  public readonly errorTasks = computed(() => 
    this._tasks().filter(task => task.status === 'error')
  );
  public readonly selectedTaskId = this._selectedTaskId.asReadonly();
  public readonly selectedTask = computed(() => {
    const taskId = this._selectedTaskId();
    return taskId ? this._tasks().find(task => task.id === taskId) || null : null;
  });
  public readonly hasRunningTasks = computed(() => 
    this.runningTasks().length > 0
  );

  // Actions
  addTask(task: Omit<TaskEntry, 'id'>): string {
    const newTask: TaskEntry = {
      ...task,
      id: this.generateTaskId()
    };
    
    this._tasks.update(tasks => [...tasks, newTask]);
    return newTask.id;
  }

  updateTask(taskId: string, updates: Partial<TaskEntry>): void {
    this._tasks.update(tasks => 
      tasks.map(task => 
        task.id === taskId 
          ? { ...task, ...updates, updatedAt: new Date() } as TaskEntry
          : task
      )
    );
  }

  updateTaskProgress(taskId: string, progress: TaskProgress): void {
    this.updateTask(taskId, {
      progress: {
        current: progress.current,
        total: progress.total
      }
    });
  }

  completeTask(taskId: string, endTime?: Date): void {
    this.updateTask(taskId, {
      status: 'completed',
      endTime: endTime || new Date()
    });
  }

  errorTask(taskId: string, error: string, endTime?: Date): void {
    this.updateTask(taskId, {
      status: 'error',
      description: error,
      endTime: endTime || new Date()
    });
  }

  removeTask(taskId: string): void {
    this._tasks.update(tasks => tasks.filter(task => task.id !== taskId));
    
    // Clear selection if the removed task was selected
    if (this._selectedTaskId() === taskId) {
      this._selectedTaskId.set(null);
    }
  }

  selectTask(taskId: string | null): void {
    this._selectedTaskId.set(taskId);
  }

  clearCompletedTasks(): void {
    this._tasks.update(tasks => 
      tasks.filter(task => task.status !== 'completed')
    );
  }

  clearAllTasks(): void {
    this._tasks.set([]);
    this._selectedTaskId.set(null);
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}