// система для батчинга нескольких RAF
function createSchedulerRAF() {
  let rafId: number | null = null;
  const queue = new Map<string, () => void>();

  const schedule = (key: string, fn: () => void) => {
    queue.set(key, fn);

    if (rafId !== null) return;

    rafId = requestAnimationFrame(() => {
      rafId = null;

      const tasks = Array.from(queue.values());
      queue.clear();

      tasks.forEach((t) => t());
    });
  };

  const cancel = () => {
    if (rafId === null) return;

    cancelAnimationFrame(rafId);
    rafId = null;
    queue.clear();
  };

  return { schedule, cancel };
}

export default createSchedulerRAF;
