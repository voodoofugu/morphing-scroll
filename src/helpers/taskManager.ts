// --- Типы ---
type Task = { id: string; callback: () => void; runAt: number };

// --- Счётчик для авто-ID ---
let autoIdCounter = 0;
const generateId = () => `task_${autoIdCounter++}`;

// --- Состояния ---
interface TimeoutState {
  tasks: Task[];
  timer: number | null;
  running: Set<string>;
}

const timeoutState: TimeoutState = {
  tasks: [],
  timer: null,
  running: new Set(),
};

// --- Таймеры для exclusive ---
const unlockTimeouts = new Map<string, number>(); // id -> timeoutId

// --- Вставка задачи в отсортированный массив ---
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

// --- Планировщик ---
const timeoutScheduler = {
  scheduleNext() {
    if (timeoutState.timer !== null) {
      clearTimeout(timeoutState.timer);
      timeoutState.timer = null;
    }
    if (timeoutState.tasks.length === 0) return;

    const nextTask = timeoutState.tasks[0];
    const delay = Math.max(0, nextTask.runAt - performance.now());

    timeoutState.timer = window.setTimeout(() => {
      timeoutState.timer = null;

      const now = performance.now();
      const due: Task[] = [];

      // забираем все задачи, ready к выполнению
      while (
        timeoutState.tasks.length &&
        timeoutState.tasks[0].runAt <= now &&
        !timeoutState.running.has(timeoutState.tasks[0].id)
      ) {
        due.push(timeoutState.tasks.shift()!);
      }

      due.forEach((t) => {
        timeoutState.running.add(t.id);
        try {
          t.callback();
        } finally {
          timeoutState.running.delete(t.id);
        }
      });

      timeoutScheduler.scheduleNext();
    }, delay);
  },

  clearAll() {
    if (timeoutState.timer !== null) {
      clearTimeout(timeoutState.timer);
      timeoutState.timer = null;
    }
    timeoutState.tasks = [];
    timeoutState.running.clear();
  },
};

// --- API ---
const setTask = (
  callback: () => void,
  timer: number,
  id?: string,
  behavior?: "default" | "exclusive",
): string => {
  const taskId = id || generateId();

  // --- immediate ---
  if (timer === 0) {
    callback();
    return taskId;
  }

  const behaviorLocal = behavior || "default";
  const runAt = performance.now() + timer;

  // --- exclusive ---
  if (behaviorLocal === "exclusive") {
    if (
      timeoutState.running.has(taskId) ||
      timeoutState.tasks.some((t) => t.id === taskId)
    )
      return taskId;

    timeoutState.running.add(taskId);
    try {
      callback();
    } finally {
      const to = window.setTimeout(() => {
        timeoutState.running.delete(taskId);
        unlockTimeouts.delete(taskId);
      }, timer);
      unlockTimeouts.set(taskId, to);
    }
    return taskId;
  }

  // --- default ---
  if (id) {
    timeoutState.tasks = timeoutState.tasks.filter((t) => t.id !== taskId);
  }

  const task: Task = {
    id: taskId,
    runAt,
    callback: () => {
      timeoutState.running.add(taskId);
      try {
        callback();
      } finally {
        timeoutState.running.delete(taskId);
      }
    },
  };

  insertTaskSorted(timeoutState.tasks, task);
  timeoutScheduler.scheduleNext();

  return taskId;
};

const cancelTask = (taskData?: string | string[]) => {
  if (!taskData) {
    timeoutScheduler.clearAll();
    unlockTimeouts.forEach((t) => clearTimeout(t));
    unlockTimeouts.clear();
    return;
  }

  const items = Array.isArray(taskData) ? taskData : [taskData];

  items.forEach((id) => {
    timeoutState.running.delete(id);

    const to = unlockTimeouts.get(id);
    if (to !== undefined) {
      clearTimeout(to);
      unlockTimeouts.delete(id);
    }

    timeoutState.tasks = timeoutState.tasks.filter((t) => t.id !== id);
    if (timeoutState.tasks.length === 0) timeoutScheduler.clearAll();
    else timeoutScheduler.scheduleNext();
  });
};

export { setTask, cancelTask };
