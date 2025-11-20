import React from "react";
import { MorphScrollT } from "../types/types";

type OnCustomScrollFn = (
  targetScrollTop: number,
  direction: "y" | "x",
  duration: number,
  callback?: () => void
) => void;

type ModifiedProps = Partial<MorphScrollT> & {
  size: number[];
  scrollBarEvent:
    | ((event: MouseEvent) => void)
    | ((event: TouchEvent) => void)
    | OnCustomScrollFn;
  thumbSize: number;
  thumbSpace: number;
  objLengthPerSize: number;
  sliderCheckLocal: () => void;
  duration: number;
};

const ScrollBar = ({
  type,
  direction,
  progressReverse,
  size,
  progressTrigger,
  scrollBarOnHover,
  scrollBarEvent,
  thumbSize,
  thumbSpace,
  objLengthPerSize,
  sliderCheckLocal,
  duration,
}: ModifiedProps) => {
  const scrollBarRef = React.useRef<HTMLDivElement>(null);
  const thumbRef = React.useRef<HTMLDivElement>(null);

  // добавление прокрутки по колесом по thumb
  React.useEffect(() => {
    if (matchMedia("(pointer: coarse)").matches) return; // при touch устроиствах выключаем

    const el = scrollBarRef.current;
    if (!el) return;

    const axis = el.getAttribute("data-direction") === "y" ? "y" : "x";

    let prev = el.previousElementSibling as HTMLElement | null;
    while (prev && !prev.classList.contains("ms-element")) {
      prev = prev.previousElementSibling as HTMLElement | null;
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); // верхний элемент не скроллим
      prev?.scrollBy({
        ...(axis === "y" ? { top: e.deltaY } : { left: e.deltaY }),
        behavior: "auto", // обязательно auto, иначе будут глюки
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  React.useEffect(() => {
    const el = thumbRef.current;
    if (!el || type === "sliderMenu") return;

    const handleStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault(); // помогает блокировать интерфейс при перетаскивании
      e.stopPropagation();

      (scrollBarEvent as (e: MouseEvent | TouchEvent) => void)(e);
    };

    el.addEventListener("touchstart", handleStart, { passive: false });
    el.addEventListener("mousedown", handleStart, { passive: false });

    return () => {
      el.removeEventListener("touchstart", handleStart);
      el.removeEventListener("mousedown", handleStart);
    };
  }, [scrollBarEvent]);

  const sliderContent = React.useMemo(() => {
    if (type === "scroll" || !direction) return;

    const axis = ["hybrid", "y"].includes(direction) ? "y" : "x";
    const neededSize = axis === "x" ? size[0] : size[1];

    return Array.from({ length: objLengthPerSize }, (_, index) => (
      <div
        key={index}
        className="ms-slider-element"
        style={{
          ...(type === "sliderMenu" && {
            cursor: "pointer",
          }),
        }}
        onClick={
          type === "sliderMenu"
            ? () => {
                (scrollBarEvent as OnCustomScrollFn)(
                  neededSize * index,
                  axis,
                  duration,
                  sliderCheckLocal
                );
              }
            : undefined
        }
      >
        {Array.isArray(progressTrigger?.progressElement)
          ? progressTrigger.progressElement[index]
          : progressTrigger?.progressElement}
      </div>
    ));
  }, [
    objLengthPerSize,
    direction,
    size,
    type,
    scrollBarEvent,
    progressTrigger?.progressElement,
    duration,
    sliderCheckLocal,
  ]);

  return (
    <React.Fragment>
      {type === "scroll" ? (
        <div
          className="ms-bar"
          ref={scrollBarRef}
          data-direction={["hybrid", "y"].includes(direction!) ? "y" : "x"}
          style={{
            position: "absolute",
            width: "fit-content",
            ...(direction === "x"
              ? {
                  transformOrigin: "left top",
                  height: `${size[0]}px`,
                  left: "50%",
                  ...(progressReverse
                    ? {
                        top: 0,
                        transform: "rotate(-90deg) translate(-100%, -50%)",
                      }
                    : { transform: "rotate(-90deg) translateY(-50%)" }),
                }
              : {
                  top: "50%",
                  transform: "translateY(-50%)",
                  height: `${size[1]}px`,
                  ...(progressReverse ? { left: 0 } : { right: 0 }),
                }),
            ...(!progressTrigger?.progressElement !== false && {
              pointerEvents: "none",
            }),
            ...(scrollBarOnHover && {
              opacity: 0,
              transition: "opacity 0.1s ease-in-out",
            }),
          }}
        >
          <div
            className="ms-thumb"
            ref={thumbRef}
            style={{
              height: `${thumbSize}px`,
              willChange: "transform, height", // свойство убирает артефакты во время анимации
              transform: `translateY(${thumbSpace}px)`,
              ...(progressTrigger?.progressElement && {
                cursor: "grab",
              }),
              transition: "height 0.05s ease-in-out", // небольшая анимация для плавности при resize
            }}
          >
            {progressTrigger?.progressElement}
          </div>
        </div>
      ) : (
        objLengthPerSize > 1 &&
        progressTrigger?.progressElement && (
          <div
            className="ms-slider"
            ref={thumbRef}
            style={{
              position: "absolute",
              display: "flex",
              ...(type === "slider" && {
                cursor: "grab",
              }),
              ...(scrollBarOnHover && {
                opacity: 0,
                transition: "opacity 0.1s ease-in-out",
              }),
              ...(direction === "x"
                ? {
                    transformOrigin: "left top",
                    left: "50%",
                    transform: "translateX(-50%)",
                    ...(progressReverse ? { top: 0 } : { bottom: 0 }),
                  }
                : {
                    flexDirection: "column",
                    top: "50%",
                    transform: "translateY(-50%)",
                    ...(progressReverse ? { left: 0 } : { right: 0 }),
                  }),
            }}
          >
            {sliderContent}
          </div>
        )
      )}
    </React.Fragment>
  );
};

ScrollBar.displayName = "ScrollBar";
export default React.memo(ScrollBar);
