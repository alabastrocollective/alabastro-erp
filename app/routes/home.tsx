import { getAppName } from "~/lib/erpBranding";
import InicioPage from "~/dashboard/inicio/Page";

export function meta() {
  return [{ title: `Inicio · ${getAppName()}` }];
}

export default InicioPage;
