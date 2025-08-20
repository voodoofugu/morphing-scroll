// --- Типы ---
type Task = { id: string; callback: () => void; runAt: number };
export type TaskMode = "timeout" | "requestFrame";

// --- Счётчик для авто-ID ---
let autoIdCounter = 0;
const generateId = () => `task_${autoIdCounter++}`;

// --- Состояния ---
interface TimeoutState {
  tasks: Task[];
  timer: number | null;
}
interface RafState {
  tasks: Task[];
  rafId: number | null;
}

const state: { timeout: TimeoutState; requestFrame: RafState } = {
  timeout: { tasks: [], timer: null },
  requestFrame: { tasks: [], rafId: null },
};

// --- Стратегии планирования ---
const schedulers = {
  timeout: {
    scheduleNext() {
      const { tasks } = state.timeout;
      if (state.timeout.timer !== null) {
        clearTimeout(state.timeout.timer);
        state.timeout.timer = null;
      }
      if (tasks.length === 0) return;

      const nextTask = tasks[0];
      const now = performance.now();
      const delay = Math.max(0, nextTask.runAt - now);

      state.timeout.timer = window.setTimeout(() => {
        const now = performance.now();
        const due: Task[] = [];
        while (tasks.length && tasks[0].runAt <= now) {
          due.push(tasks.shift()!);
        }
        due.forEach((t) => t.callback());
        schedulers.timeout.scheduleNext();
      }, delay);
    },
    clearAll() {
      if (state.timeout.timer !== null) {
        clearTimeout(state.timeout.timer);
        state.timeout.timer = null;
      }
      state.timeout.tasks = [];
    },
  },
  requestFrame: {
    scheduleNext() {
      const { tasks } = state.requestFrame;
      if (state.requestFrame.rafId !== null) return; // цикл уже идёт
      if (tasks.length === 0) return;

      const loop = () => {
        state.requestFrame.rafId = null;

        const now = performance.now();
        const due: Task[] = [];
        while (tasks.length && tasks[0].runAt <= now) {
          due.push(tasks.shift()!);
        }
        due.forEach((t) => t.callback());

        if (tasks.length > 0) {
          state.requestFrame.rafId = requestAnimationFrame(loop);
        }
      };

      state.requestFrame.rafId = requestAnimationFrame(loop);
    },
    clearAll() {
      if (state.requestFrame.rafId !== null) {
        cancelAnimationFrame(state.requestFrame.rafId);
        state.requestFrame.rafId = null;
      }
      state.requestFrame.tasks = [];
    },
  },
};

// --- API ---
const setManagedTask = (
  callback: () => void,
  mode: number | "requestFrame",
  id?: string
): string => {
  const taskId = id || generateId();
  const modeKey: TaskMode =
    typeof mode === "string" ? "requestFrame" : "timeout";

  // убираем задачу с таким же id
  state[modeKey].tasks = state[modeKey].tasks.filter((t) => t.id !== taskId);

  const runAt =
    modeKey === "requestFrame"
      ? performance.now()
      : performance.now() + (mode as number);

  const task: Task = { id: taskId, callback, runAt };

  // вставляем в отсортированный массив
  let i = state[modeKey].tasks.length;
  while (i > 0 && state[modeKey].tasks[i - 1].runAt > task.runAt) i--;
  state[modeKey].tasks.splice(i, 0, task);

  schedulers[modeKey].scheduleNext();

  return taskId;
};

const clearManagedTask = (id: string, mode?: TaskMode) => {
  const modes = mode ? [mode] : (["timeout", "requestFrame"] as TaskMode[]);
  modes.forEach((m) => {
    state[m].tasks = state[m].tasks.filter((t) => t.id !== id);
    schedulers[m].scheduleNext();
  });
};

const clearAllManagedTasks = (mode?: TaskMode) => {
  const modes = mode ? [mode] : (["timeout", "requestFrame"] as TaskMode[]);
  modes.forEach((m) => schedulers[m].clearAll());
};

export { setManagedTask, clearManagedTask, clearAllManagedTasks };
