import {
  cancelTask,
  setTask as setKeyTask,
  setThrottleTask,
  type TaskTimer,
} from "keytask-core";

let autoIdCounter = 0;
const generateId = () => `task_${autoIdCounter++}`;

const setTask = (
  callback: () => void,
  timer: TaskTimer,
  id?: string,
): string => {
  const taskId = id ?? generateId();

  if (timer === 0) {
    callback();
    return taskId;
  }

  return setKeyTask(callback, timer, taskId);
};

export { setTask, setThrottleTask, cancelTask };
