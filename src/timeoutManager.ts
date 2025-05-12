type TimeoutMap = Map<string, ReturnType<typeof setTimeout>>;

const timeouts: TimeoutMap = new Map();

const setManagedTimeout = (id: string, callback: () => void, delay: number) => {
  clearManagedTimeout(id); // Чтобы избежать дублирования

  const timeout = setTimeout(() => {
    callback();
    timeouts.delete(id); // Удаляем после выполнения
  }, delay);

  timeouts.set(id, timeout);
};

const clearManagedTimeout = (id: string) => {
  const timeout = timeouts.get(id);
  if (timeout) {
    clearTimeout(timeout);
    timeouts.delete(id);
  }
};

const clearAllManagedTimeouts = () => {
  for (const timeout of timeouts.values()) {
    clearTimeout(timeout);
  }
  timeouts.clear();
};

export { setManagedTimeout, clearManagedTimeout, clearAllManagedTimeouts };
