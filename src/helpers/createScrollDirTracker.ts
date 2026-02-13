function createScrollDirTracker(threshold = 2) {
  let prevX = 0;
  let prevY = 0;
  let dirX: "left" | "right" | null = null;
  let dirY: "up" | "down" | null = null;

  return {
    update(x: number, y: number) {
      const dx = x - prevX;
      const dy = y - prevY;
      if (Math.abs(dx) > threshold) {
        dirX = dx > 0 ? "right" : "left";
        prevX = x;
      }
      if (Math.abs(dy) > threshold) {
        dirY = dy > 0 ? "down" : "up";
        prevY = y;
      }
    },

    reset() {
      dirX = null;
      dirY = null;
    },

    get() {
      return { x: dirX, y: dirY };
    },
  };
}

export default createScrollDirTracker;
