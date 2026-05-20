import { getAppName } from "~/lib/erpBranding";
import ProyectoBoardPage from "~/dashboard/proyectos/BoardPage";

export function meta() {
  return [{ title: `Tablero · ${getAppName()}` }];
}

export default ProyectoBoardPage;
