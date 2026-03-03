// система для батчинга нескольких RAF
function createSchedulerRAF() {
  let rafId: number | null = null;
  const queue = new Set<() => void>();

  const schedule = (fn: () => void) => {
    queue.add(fn);

    if (rafId !== null) return;

    rafId = requestAnimationFrame(() => {
      rafId = null;

      const tasks = Array.from(queue); // сохраняем задачи в момент начала выполнения, чтобы новые, добавленные во время выполнения, не запустились
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
