// additional types
type Vec2 = [x: number, y: number];
type Size = [width: number, height: number];
type Edges = [top: number, right: number, bottom: number, left: number];
type SpacingValue = number | Vec2 | Edges;
type Align = "start" | "center" | "end";

export type { Vec2, Size, SpacingValue, Align };
