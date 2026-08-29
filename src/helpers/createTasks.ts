import { createTaskManager } from "keytask-core";
import type { TaskManager } from "keytask-core";

/**
 * The deferred-task manager — one per MorphScroll instance, not one per module.
 *
 * Task keys ("isScrolling", "removeHover", "smoothScrollBlockY") are the same
 * in every scroll, and keytask replaces a task carrying the same key by
 * contract. In a shared manager that meant the second scroll on the page wiped
 * the first one's scroll-end: `isScrolling` stuck on `true` forever, the keys
 * of loaded elements stopped updating, and the thumb never hid.
 */
type Tasks = TaskManager;

const createTasks = (): Tasks => createTaskManager();

export default createTasks;
export type { Tasks };
