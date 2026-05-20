import { getAppName } from "~/lib/erpBranding";
import ProyectosPage from "~/dashboard/proyectos/Page";

export function meta() {
  return [{ title: `Proyectos · ${getAppName()}` }];
}

export default ProyectosPage;
