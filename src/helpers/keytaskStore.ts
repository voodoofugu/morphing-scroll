import { createTaskManager } from "keytask-core";

const keytaskStore = createTaskManager();

const { cancelTask, setLockTask, setTask } = keytaskStore;

export default keytaskStore;
export { cancelTask, setLockTask, setTask };
