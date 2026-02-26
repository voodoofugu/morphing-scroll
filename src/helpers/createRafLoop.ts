function createRafLoop() {
  let rafId: number | null = null;

  const start = (fn: () => boolean) => {
    // если уже крутится — останавливаем
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    const loop = () => {
      if (!fn()) {
        rafId = null;
        return;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
  };

  const stop = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return { start, stop };
}

export default createRafLoop;
