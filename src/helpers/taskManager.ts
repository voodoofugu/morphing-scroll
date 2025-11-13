// --- Типы ---
type Task = { id: string; callback: () => void; runAt: number };
type TaskMode = "timeout" | "requestFrame";

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

function insertTaskSorted(tasks: Task[], task: Task) {
  let left = 0;
  let right = tasks.length;
  while (left < right) {
    const mid = (left + right) >> 1;
    if (tasks[mid].runAt < task.runAt) left = mid + 1;
    else right = mid;
  }
  tasks.splice(left, 0, task);
}

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
const setTask = (
  callback: () => void,
  mode: number | "requestFrame",
  id?: string
): string => {
  const taskId = id || generateId();
  const modeKey: TaskMode =
    mode === "requestFrame" ? "requestFrame" : "timeout";

  // удаляем старую задачу с тем же ID, если ID передан
  if (id)
    state[modeKey].tasks = state[modeKey].tasks.filter((t) => t.id !== taskId);

  const runAt =
    modeKey === "requestFrame"
      ? performance.now()
      : performance.now() + (mode as number);

  const task: Task = { id: taskId, callback, runAt };

  // Вставляем задачу в очередь по времени
  insertTaskSorted(state[modeKey].tasks, task);

  // Запускаем/продолжаем цикл
  schedulers[modeKey].scheduleNext();

  return taskId;
};

const cancelTask = (id: string, mode?: TaskMode) => {
  const modes = mode ? [mode] : (["timeout", "requestFrame"] as TaskMode[]);
  modes.forEach((m) => {
    const tasks = state[m].tasks;
    state[m].tasks = tasks.filter((t) => t.id !== id);
    if (state[m].tasks.length > 0) schedulers[m].scheduleNext();
  });
};

const cancelAllTasks = (mode?: TaskMode) => {
  const modes = mode ? [mode] : (["timeout", "requestFrame"] as TaskMode[]);
  modes.forEach((m) => schedulers[m].clearAll());
};

export { setTask, cancelTask, cancelAllTasks };
