import React from "react";

import type { MorphScrollHandle } from "@morphing-scroll/src/types/types";

export type PadSample = {
  /** все оси, как их отдаёт устройство: [индекс, значение] */
  axes: [number, number][];
  buttons: number[];
  id: string;
};

export const DEAD_ZONE = 0.15; // сколько стик отдаёт, лёжа в покое

export const PAN_PER_SECOND = 900; // px при полностью отклонённом стике

export const REPEAT = { first: 400, next: 120 }; // автоповтор удержанной кнопки, ms

export const DPAD = { 12: "top", 13: "bottom", 14: "left", 15: "right" } as const;

/**
 * Рецепт из README, слово в слово, плюс отчёт о том, что пришло с устройства:
 * в playground важно видеть не только результат, но и сам ввод — какие оси и
 * какие кнопки геймпад отдаёт прямо сейчас.
 */
export function useGamepadScroll(
  scroll: React.RefObject<MorphScrollHandle | null>,
  enabled: boolean,
  onSample: (sample: PadSample | null) => void,
  /** playground гоняет крестовину тем же способом, что выбран для клавиш */
  dpad: "step" | "focus",
) {
  React.useEffect(() => {
    if (!enabled) {
      onSample(null);
      return;
    }

    let frame = 0;
    let last = performance.now();
    let reported = "";
    const held = new Map<number, number>(); // кнопка -> когда сработает снова

    const report = (sample: PadSample | null) => {
      // состояние отдаём только на изменение, иначе рендер на каждый кадр
      const next = JSON.stringify(sample);
      if (next === reported) return;

      reported = next;
      onSample(sample);
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);

      // кадр мог быть длинным: считаем от времени, а не от количества кадров
      const delta = Math.min(now - last, 100) / 1000;
      last = now;

      const pad = navigator.getGamepads().find(Boolean);
      if (!pad) {
        held.clear();
        report(null);
        return;
      }

      // — правый стик: непрерывное движение —
      const [x, y] = [pad.axes[2] ?? 0, pad.axes[3] ?? 0].map((value) =>
        Math.abs(value) < DEAD_ZONE ? 0 : value,
      );

      if (x || y)
        scroll.current?.pan(
          { x: x * PAN_PER_SECOND * delta, y: y * PAN_PER_SECOND * delta },
          { duration: 0, reason: "gamepad" },
        );

      // — крестовина: шаг на нажатие, а не на кадр —
      for (const [index, side] of Object.entries(DPAD)) {
        const button = Number(index);

        if (!pad.buttons[button]?.pressed) {
          held.delete(button);
          continue;
        }

        const move = () =>
          dpad === "focus"
            ? scroll.current?.moveFocus(side, { reason: "gamepad" })
            : scroll.current?.step(side, { reason: "gamepad" });

        const due = held.get(button);
        if (due === undefined) {
          move();
          held.set(button, now + REPEAT.first);
        } else if (now >= due) {
          move();
          held.set(button, now + REPEAT.next);
        }
      }

      /*
       * Показываем все оси, а не только ту пару, которую крутит рецепт:
       * раскладка у геймпадов разная, и когда стик «не работает», первое,
       * что надо увидеть, — какой индекс он на самом деле шевелит.
       */
      report({
        axes: pad.axes
          .map((value, index): [number, number] => [
            index,
            Math.round(value * 20) / 20,
          ])
          .filter(([, value]) => Math.abs(value) >= 0.1),
        buttons: pad.buttons
          .map((b, i) => (b.pressed ? i : -1))
          .filter((i) => i >= 0),
        id: pad.id,
      });
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [dpad, enabled, onSample, scroll]);
}
