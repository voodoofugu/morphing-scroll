function createRafLoop() {
  let rafId: number | null = null;
  let idCounter = 0;

  const tasks = new Map<string | number, () => boolean>();

  const loop = () => {
    tasks.forEach((fn, id) => {
      const shouldContinue = fn();

      if (!shouldContinue) {
        tasks.delete(id);
      }
    });

    if (tasks.size === 0) {
      rafId = null;
      return;
    }

    rafId = requestAnimationFrame(loop);
  };

  const start = (fn: () => boolean, customId?: string) => {
    const id = customId ?? ++idCounter;

    // если задача с таким id уже есть — удаляем
    tasks.delete(id);
    tasks.set(id, fn);

    if (rafId === null) {
      rafId = requestAnimationFrame(loop);
    }

    return id;
  };

  const stop = (id?: string | number) => {
    // удаляем по id
    if (id !== undefined) {
      tasks.delete(id);

      if (tasks.size === 0 && rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
    // если id нет — останавливаем все
    else {
      tasks.clear();

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  };

  const isRunning = (id?: string | number) => {
    if (id === undefined) return tasks.size > 0;
    return tasks.has(id);
  };

  return { start, stop, isRunning };
}

export default createRafLoop;
