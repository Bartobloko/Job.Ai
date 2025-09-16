import { computed } from '@angular/core';
import { signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { TaskEntry, TaskProgress } from '../../interfaces/task';

interface TasksState {
  tasks: TaskEntry[];
  selectedTaskId: string | null;
}

const initialState: TasksState = {
  tasks: [],
  selectedTaskId: null,
};

export const TasksStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    runningTasks: computed(() => 
      store.tasks().filter(task => task.status === 'running')
    ),
    completedTasks: computed(() => 
      store.tasks().filter(task => task.status === 'completed')
    ),
    errorTasks: computed(() => 
      store.tasks().filter(task => task.status === 'error')
    ),
    selectedTask: computed(() => {
      const taskId = store.selectedTaskId();
      return taskId ? store.tasks().find(task => task.id === taskId) || null : null;
    }),
    hasRunningTasks: computed(() => 
      store.tasks().filter(task => task.status === 'running').length > 0
    ),
  })),
  withMethods((store) => ({
    addTask(task: Omit<TaskEntry, 'id'>): string {
      const newTask: TaskEntry = {
        ...task,
        id: generateTaskId()
      };
      
      store.tasks.update(tasks => [...tasks, newTask]);
      return newTask.id;
    },

    updateTask(taskId: string, updates: Partial<TaskEntry>): void {
      store.tasks.update(tasks => 
        tasks.map(task => 
          task.id === taskId 
            ? { ...task, ...updates, updatedAt: new Date() } as TaskEntry
            : task
        )
      );
    },

    updateTaskProgress(taskId: string, progress: TaskProgress): void {
      this.updateTask(taskId, {
        progress: {
          current: progress.current,
          total: progress.total
        }
      });
    },

    completeTask(taskId: string, endTime?: Date): void {
      this.updateTask(taskId, {
        status: 'completed',
        endTime: endTime || new Date()
      });
    },

    errorTask(taskId: string, error: string, endTime?: Date): void {
      this.updateTask(taskId, {
        status: 'error',
        description: error,
        endTime: endTime || new Date()
      });
    },

    removeTask(taskId: string): void {
      store.tasks.update(tasks => tasks.filter(task => task.id !== taskId));
      
      // Clear selection if the removed task was selected
      if (store.selectedTaskId() === taskId) {
        store.selectedTaskId.set(null);
      }
    },

    selectTask(taskId: string | null): void {
      store.selectedTaskId.set(taskId);
    },

    clearCompletedTasks(): void {
      store.tasks.update(tasks => 
        tasks.filter(task => task.status !== 'completed')
      );
    },

    clearAllTasks(): void {
      store.tasks.set([]);
      store.selectedTaskId.set(null);
    },
  }))
);

function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}