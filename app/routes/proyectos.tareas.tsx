import { getAppName } from "~/lib/erpBranding";
import TasksBacklogPage from "~/dashboard/proyectos/TasksBacklogPage";

export function meta() {
  return [{ title: `Tareas · ${getAppName()}` }];
}

export default TasksBacklogPage;
