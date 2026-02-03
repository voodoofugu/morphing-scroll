import { useState, useCallback } from "react";

// hook для обновления UI
function useUpdate() {
  // state
  const [, forceUpdate] = useState({});

  return useCallback(() => {
    forceUpdate({});
  }, []);
}

export default useUpdate;
