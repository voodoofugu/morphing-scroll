import { createTaskManager } from "keytask-core";
import type { TaskManager } from "keytask-core";

/**
 * Менеджер отложенных задач — на каждый инстанс MorphScroll, а не на модуль.
 *
 * Ключи задач ("isScrolling", "removeHover", "smoothScrollBlockY") одинаковы
 * у всех скроллов, а keytask по контракту заменяет задачу с тем же ключом.
 * В общем менеджере это значило, что второй скролл на странице стирал
 * scroll-end первого: `isScrolling` навсегда залипал в `true`, ключи
 * загруженных элементов переставали обновляться, а thumb не прятался.
 */
type Tasks = TaskManager;

const createTasks = (): Tasks => createTaskManager();

export default createTasks;
export type { Tasks };
