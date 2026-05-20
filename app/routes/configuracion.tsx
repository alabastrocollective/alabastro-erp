import { getAppName } from "~/lib/erpBranding";
import ConfiguracionPage from "~/dashboard/configuracion/Page";

export function meta() {
  return [{ title: `Configuración · ${getAppName()}` }];
}

export default ConfiguracionPage;
