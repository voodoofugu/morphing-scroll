import React from "react";

import type { EdgePull } from "./edgePull";

/**
 * One element is cloned into every MorphScroll edge. The surrounding
 * `.ms-top/right/bottom/left` class chooses the matching CSS variable.
 */
function EdgeLoader({ progress }: { progress: EdgePull }) {
  const style = {
    "--pull-top": progress.top,
    "--pull-right": progress.right,
    "--pull-bottom": progress.bottom,
    "--pull-left": progress.left,
  } as React.CSSProperties;

  return (
    <span className="edge-pull-loader" style={style} aria-hidden="true">
      <svg viewBox="0 0 32 32">
        <circle className="edge-pull-track" cx="16" cy="16" r="13" />
        {(Object.keys(progress) as Array<keyof EdgePull>).map((edge) => (
          <circle
            key={edge}
            className={`edge-pull-value edge-pull-value-${edge}${
              progress[edge] >= 1 ? " active" : ""
            }`}
            cx="16"
            cy="16"
            r="13"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - progress[edge] * 100}
          />
        ))}
      </svg>
    </span>
  );
}

export default EdgeLoader;
