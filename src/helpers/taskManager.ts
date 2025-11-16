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
  running: Set<string>;
}
interface RafState {
  tasks: Task[];
  rafId: number | null;
  running: Set<string>;
}

const state: { timeout: TimeoutState; requestFrame: RafState } = {
  timeout: { tasks: [], timer: null, running: new Set() },
  requestFrame: { tasks: [], rafId: null, running: new Set() },
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

// --- Планировщик ---
const schedulers = {
  timeout: {
    scheduleNext() {
      const st = state.timeout;
      if (st.timer !== null) {
        clearTimeout(st.timer);
        st.timer = null;
      }
      if (st.tasks.length === 0) return;

      const now = performance.now();
      const nextIndex = st.tasks.findIndex((t) => !st.running.has(t.id));
      if (nextIndex === -1) return; // нет задач для запуска

      const nextTask = st.tasks[nextIndex];
      const delay = Math.max(0, nextTask.runAt - now);

      st.timer = window.setTimeout(() => {
        st.timer = null;

        // собираем все задачи, которые должны выполниться
        const due: Task[] = [];
        while (st.tasks.length && st.tasks[0].runAt <= performance.now()) {
          const task = st.tasks.shift()!;
          if (!st.running.has(task.id)) due.push(task);
        }

        due.forEach((t) => {
          st.running.add(t.id);
          try {
            t.callback();
          } finally {
            st.running.delete(t.id);
          }
        });

        schedulers.timeout.scheduleNext();
      }, delay);
    },

    clearAll() {
      if (state.timeout.timer !== null) {
        clearTimeout(state.timeout.timer);
        state.timeout.timer = null;
      }
      state.timeout.tasks = [];
      state.timeout.running.clear();
    },
  },

  requestFrame: {
    scheduleNext() {
      const st = state.requestFrame;
      if (st.rafId !== null) return; // цикл уже идёт
      if (st.tasks.length === 0) return;

      const loop = () => {
        st.rafId = null;

        const now = performance.now();
        const due: Task[] = [];
        while (st.tasks.length && st.tasks[0].runAt <= now) {
          const task = st.tasks.shift()!;
          if (!st.running.has(task.id)) due.push(task);
        }

        due.forEach((t) => {
          st.running.add(t.id);
          try {
            t.callback();
          } finally {
            st.running.delete(t.id);
          }
        });

        if (st.tasks.length > 0) {
          st.rafId = requestAnimationFrame(loop);
        }
      };

      st.rafId = requestAnimationFrame(loop);
    },

    clearAll() {
      if (state.requestFrame.rafId !== null) {
        cancelAnimationFrame(state.requestFrame.rafId);
        state.requestFrame.rafId = null;
      }
      state.requestFrame.tasks = [];
      state.requestFrame.running.clear();
    },
  },
};

// --- API ---
const setTask = (
  callback: () => void,
  mode: number | "requestFrame",
  id?: string,
  behavior?: "default" | "exclusive"
): string => {
  const taskId = id || generateId();
  const modeKey: TaskMode =
    mode === "requestFrame" ? "requestFrame" : "timeout";
  const behaviorLocal = behavior || "default";

  const st = state[modeKey];

  // --- exclusive ---
  if (behaviorLocal === "exclusive") {
    // если задача уже выполняется — игнорируем
    if (st.running.has(taskId)) return taskId;

    // если задача уже в очереди — игнорируем
    if (st.tasks.some((t) => t.id === taskId)) return taskId;

    const task: Task = {
      id: taskId,
      runAt:
        modeKey === "requestFrame"
          ? performance.now()
          : performance.now() + (mode as number),
      callback: () => {
        st.running.add(taskId);
        try {
          callback();
        } finally {
          st.running.delete(taskId);
        }
      },
    };

    insertTaskSorted(st.tasks, task);
    schedulers[modeKey].scheduleNext();
    return taskId;
  }

  // --- default ---
  if (id) {
    st.tasks = st.tasks.filter((t) => t.id !== taskId);
  }

  const runAt =
    modeKey === "requestFrame"
      ? performance.now()
      : performance.now() + (mode as number);

  const task: Task = {
    id: taskId,
    callback: () => {
      st.running.add(taskId);
      try {
        callback();
      } finally {
        st.running.delete(taskId);
      }
    },
    runAt,
  };

  insertTaskSorted(st.tasks, task);
  schedulers[modeKey].scheduleNext();

  return taskId;
};

const cancelTask = (id: string, mode?: TaskMode) => {
  const modes = mode ? [mode] : (["timeout", "requestFrame"] as TaskMode[]);
  modes.forEach((m) => {
    state[m].running.delete(id);
    state[m].tasks = state[m].tasks.filter((t) => t.id !== id);

    if (state[m].tasks.length === 0) {
      schedulers[m].clearAll();
    } else {
      schedulers[m].scheduleNext();
    }
  });
};

const cancelAllTasks = (mode?: TaskMode) => {
  const modes = mode ? [mode] : (["timeout", "requestFrame"] as TaskMode[]);
  modes.forEach((m) => schedulers[m].clearAll());
};

export { setTask, cancelTask, cancelAllTasks };
